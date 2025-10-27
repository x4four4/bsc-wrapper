import { DEFAULT_NETWORK, NETWORKS, USD1_ABI } from "@/app/config/constants";
import type { Network } from "@/app/types";
import { ethers } from "ethers";
import { useCallback, useEffect, useState } from "react";

export function useWeb3() {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [network, setNetwork] = useState<Network | null>(null);
  const [balance, setBalance] = useState("0");
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const targetNetwork = NETWORKS[DEFAULT_NETWORK as keyof typeof NETWORKS];

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return typeof window !== "undefined" && window.ethereum;
  };

  // Get user's USD1 balance
  const fetchBalance = useCallback(
    async (address: string, provider: ethers.BrowserProvider) => {
      if (!address || !provider) return;

      try {
        console.log("🔍 Fetching USD1 balance for:", address);
        console.log("   USD1 Contract:", targetNetwork.contracts.usd1);

        const usd1Contract = new ethers.Contract(
          targetNetwork.contracts.usd1,
          USD1_ABI,
          provider
        );

        const balance = await usd1Contract.balanceOf(address);
        const formatted = ethers.formatUnits(balance, 18);

        console.log("   Raw balance:", balance.toString());
        console.log("   Formatted:", formatted, "USD1");

        setBalance(formatted);
      } catch (error) {
        console.error("Failed to fetch balance:", error);
        setBalance("0");
      }
    },
    [targetNetwork]
  );

  // Switch to correct network
  const switchNetwork = useCallback(async () => {
    if (!isMetaMaskInstalled()) return;

    try {
      await window.ethereum?.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${targetNetwork.chainId.toString(16)}` }],
      });

      return true;
    } catch (switchError) {
      // This error code indicates that the chain has not been added to MetaMask
      const error = switchError as { code?: number; message?: string };
      if (error.code === 4902) {
        try {
          await window.ethereum?.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: `0x${targetNetwork.chainId.toString(16)}`,
                chainName: targetNetwork.name,
                nativeCurrency: targetNetwork.currency,
                rpcUrls: targetNetwork.rpcUrls.default.http,
                blockExplorerUrls: [targetNetwork.blockExplorers.default.url],
              },
            ],
          });

          return true;
        } catch (addError) {
          console.error("Failed to add network:", addError);
          return false;
        }
      }

      console.error("Failed to switch network:", switchError);
      return false;
    }
  }, [targetNetwork]);

  // Connect wallet
  const connect = useCallback(async () => {
    if (!isMetaMaskInstalled()) {
      window.open("https://metamask.io/download/", "_blank");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum!);
      const network = await provider.getNetwork();

      // Check if on correct network
      if (Number(network.chainId) !== targetNetwork.chainId) {
        const switched = await switchNetwork();

        if (!switched) {
          setIsConnecting(false);
          return;
        }
      }

      // Request account access
      const accounts = await provider.send("eth_requestAccounts", []);

      if (accounts.length === 0) {
        throw new Error("No accounts found");
      }

      const signer = await provider.getSigner();
      const address = accounts[0];

      setProvider(provider);
      setSigner(signer);
      setAccount(address);
      setNetwork(targetNetwork as unknown as Network);

      // Fetch balance
      await fetchBalance(address, provider);

      // Store connection state
      localStorage.setItem("walletConnected", "true");
    } catch (error) {
      const connectionError = error as { code?: number; message?: string };
      console.error("Connection error:", connectionError);
      setError(connectionError.message || "Connection failed");

      // Silent error handling
    } finally {
      setIsConnecting(false);
    }
  }, [targetNetwork, fetchBalance, switchNetwork]);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setNetwork(null);
    setBalance("0");
    setError(null);

    localStorage.removeItem("walletConnected");
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (!isMetaMaskInstalled()) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else if (accounts[0] !== account && account) {
        // Account changed, reconnect
        connect();
      }
    };

    const handleChainChanged = (_chainId: string) => {
      // Reload the page when chain changes
      window.location.reload();
    };

    window.ethereum?.on("accountsChanged", handleAccountsChanged as never);
    window.ethereum?.on("chainChanged", handleChainChanged as never);

    return () => {
      window.ethereum?.removeListener(
        "accountsChanged",
        handleAccountsChanged as never
      );
      window.ethereum?.removeListener(
        "chainChanged",
        handleChainChanged as never
      );
    };
  }, [account, connect, disconnect]);

  // Auto-connect if previously connected
  useEffect(() => {
    const wasConnected = localStorage.getItem("walletConnected");

    if (wasConnected === "true" && isMetaMaskInstalled()) {
      connect();
    }
  }, []); // eslint-disable-line

  // Refresh balance periodically
  useEffect(() => {
    if (!account || !provider) return;

    const interval = setInterval(() => {
      fetchBalance(account, provider);
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [account, provider, fetchBalance]);

  return {
    // State
    provider,
    signer,
    account,
    network,
    balance,
    isConnecting,
    error,

    // Methods
    connect,
    disconnect,
    switchNetwork,
    fetchBalance: () => provider && account && fetchBalance(account, provider),

    // Helpers
    isConnected: !!account,
    isCorrectNetwork: network?.chainId === targetNetwork.chainId,
  };
}
