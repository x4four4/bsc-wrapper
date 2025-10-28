import { DEFAULT_NETWORK, NETWORKS, USD1_ABI } from "@/app/config/constants";
import type { Network } from "@/app/types";
import { ethers } from "ethers";
import { useCallback, useEffect, useState } from "react";

// Wallet types supported
type WalletType =
  | "metamask"
  | "trust"
  | "binance"
  | "walletconnect"
  | "coinbase"
  | "other";

interface WalletProvider extends ethers.Eip1193Provider {
  isMetaMask?: boolean;
  isTrust?: boolean;
  isBinance?: boolean;
  isCoinbaseWallet?: boolean;
  isWalletConnect?: boolean;
  providers?: WalletProvider[];
}

export function useWeb3() {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [network, setNetwork] = useState<Network | null>(null);
  const [balance, setBalance] = useState("0");
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectedWallet, setConnectedWallet] = useState<WalletType | null>(
    null
  );

  const targetNetwork = NETWORKS[DEFAULT_NETWORK as keyof typeof NETWORKS];

  // Detect available wallet providers
  const detectWalletProvider = useCallback(
    (walletType: WalletType): WalletProvider | null => {
      if (typeof window === "undefined" || !window.ethereum) return null;

      const provider = window.ethereum as WalletProvider;

      // Handle multiple injected providers
      if (provider.providers && provider.providers.length > 0) {
        for (const p of provider.providers) {
          switch (walletType) {
            case "metamask":
              if (p.isMetaMask) return p;
              break;
            case "trust":
              if (p.isTrust) return p;
              break;
            case "binance":
              if (p.isBinance) return p;
              break;
            case "coinbase":
              if (p.isCoinbaseWallet) return p;
              break;
          }
        }
      } else {
        // Single wallet detected
        switch (walletType) {
          case "metamask":
            if (provider.isMetaMask && !provider.isTrust) return provider;
            break;
          case "trust":
            if (provider.isTrust) return provider;
            break;
          case "binance":
            if (provider.isBinance || (window as any).BinanceChain) {
              return provider.isBinance
                ? provider
                : (window as any).BinanceChain;
            }
            break;
          case "coinbase":
            if (provider.isCoinbaseWallet) return provider;
            break;
          case "other":
            return provider;
        }
      }

      return null;
    },
    []
  );

  // Check if wallet is installed
  const isWalletInstalled = useCallback((walletType: WalletType): boolean => {
    if (typeof window === "undefined") return false;

    switch (walletType) {
      case "metamask":
        return !!window.ethereum?.isMetaMask;
      case "trust":
        return !!(window.ethereum as any)?.isTrust;
      case "binance":
        return !!(
          (window.ethereum as any)?.isBinance || (window as any).BinanceChain
        );
      case "coinbase":
        return !!(window.ethereum as any)?.isCoinbaseWallet;
      case "walletconnect":
        return true; // Always available via QR code
      case "other":
        return !!window.ethereum;
      default:
        return false;
    }
  }, []);

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
  const switchNetwork = useCallback(
    async (walletProvider?: WalletProvider) => {
      const provider = walletProvider || (window.ethereum as WalletProvider);
      if (!provider) return false;

      try {
        await provider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${targetNetwork.chainId.toString(16)}` }],
        });

        return true;
      } catch (switchError) {
        // This error code indicates that the chain has not been added to wallet
        const error = switchError as { code?: number; message?: string };
        if (error.code === 4902) {
          try {
            await provider.request({
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
    },
    [targetNetwork]
  );

  // Connect wallet with specific type
  const connect = useCallback(
    async (walletId?: string) => {
      const walletType = (walletId || "metamask") as WalletType;

      // Clear previous errors
      setError(null);
      setIsConnecting(true);

      // Special handling for WalletConnect
      if (walletType === "walletconnect") {
        setError("WalletConnect coming soon! Please use another wallet.");
        setIsConnecting(false);
        return;
      }

      // Check if wallet is installed
      if (!isWalletInstalled(walletType)) {
        // Open wallet download page
        const walletUrls: Record<WalletType, string> = {
          metamask: "https://metamask.io/download/",
          trust: "https://trustwallet.com/download",
          binance: "https://www.bnbchain.org/en/binance-wallet",
          walletconnect: "#", // Will be handled by RainbowKit in future
          coinbase: "https://www.coinbase.com/wallet",
          other: "https://ethereum.org/en/wallets/find-wallet/",
        };

        window.open(walletUrls[walletType], "_blank");
        setIsConnecting(false);
        setError(`Please install ${walletType} wallet`);
        return;
      }

      try {
        // Get the specific wallet provider
        const walletProvider = detectWalletProvider(walletType);

        if (!walletProvider) {
          throw new Error(`${walletType} wallet not found`);
        }

        const provider = new ethers.BrowserProvider(walletProvider);
        const network = await provider.getNetwork();

        // Check if on correct network
        if (Number(network.chainId) !== targetNetwork.chainId) {
          const switched = await switchNetwork(walletProvider);

          if (!switched) {
            setIsConnecting(false);
            return;
          }
        }

        // Request account access
        const accounts = (await walletProvider.request({
          method: "eth_requestAccounts",
        })) as string[];

        if (accounts.length === 0) {
          throw new Error("No accounts found");
        }

        const signer = await provider.getSigner();
        const address = accounts[0];

        setProvider(provider);
        setSigner(signer);
        setAccount(address);
        setNetwork(targetNetwork as unknown as Network);
        setConnectedWallet(walletType);

        // Fetch balance
        await fetchBalance(address, provider);

        // Store connection state
        localStorage.setItem("walletConnected", "true");
        localStorage.setItem("walletType", walletType);

        console.log(`✅ Connected to ${walletType} successfully!`);
      } catch (error) {
        const connectionError = error as { code?: number; message?: string };
        console.error("Connection error:", connectionError);
        setError(connectionError.message || "Connection failed");
        setConnectedWallet(null);
      } finally {
        setIsConnecting(false);
      }
    },
    [
      targetNetwork,
      fetchBalance,
      switchNetwork,
      detectWalletProvider,
      isWalletInstalled,
    ]
  );

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setNetwork(null);
    setBalance("0");
    setError(null);
    setConnectedWallet(null);

    localStorage.removeItem("walletConnected");
    localStorage.removeItem("walletType");
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else if (accounts[0] !== account && account) {
        // Account changed, reconnect with same wallet type
        if (connectedWallet) {
          connect(connectedWallet);
        }
      }
    };

    const handleChainChanged = () => {
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
  }, [account, connect, disconnect, connectedWallet]);

  // Auto-connect if previously connected
  useEffect(() => {
    const wasConnected = localStorage.getItem("walletConnected");
    const walletType = localStorage.getItem("walletType") as WalletType;

    if (
      wasConnected === "true" &&
      walletType &&
      isWalletInstalled(walletType)
    ) {
      connect(walletType);
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
    connectedWallet,

    // Methods
    connect,
    disconnect,
    switchNetwork: () => {
      if (connectedWallet) {
        const walletProvider = detectWalletProvider(connectedWallet);
        if (walletProvider) {
          return switchNetwork(walletProvider);
        }
      }
      return Promise.resolve(false);
    },
    fetchBalance: () => provider && account && fetchBalance(account, provider),

    // Wallet detection
    isWalletInstalled,

    // Helpers
    isConnected: !!account,
    isCorrectNetwork: network?.chainId === targetNetwork.chainId,
  };
}
