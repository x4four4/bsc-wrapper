"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import {
  coinbaseWallet,
  injectedWallet,
  metaMaskWallet,
  rainbowWallet,
  trustWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { Chain } from "wagmi/chains";
import { NETWORKS } from "./constants";

// Convert our network config to Wagmi Chain format
const bscMainnet: Chain = {
  id: NETWORKS.mainnet.chainId,
  name: NETWORKS.mainnet.name,
  nativeCurrency: NETWORKS.mainnet.currency,
  rpcUrls: NETWORKS.mainnet.rpcUrls,
  blockExplorers: NETWORKS.mainnet.blockExplorers,
  testnet: false,
};

const bscTestnet: Chain = {
  id: NETWORKS.testnet.chainId,
  name: NETWORKS.testnet.name,
  nativeCurrency: NETWORKS.testnet.currency,
  rpcUrls: NETWORKS.testnet.rpcUrls,
  blockExplorers: NETWORKS.testnet.blockExplorers,
  testnet: true,
};

// Determine which network to use based on env
const defaultNetwork = process.env.NEXT_PUBLIC_DEFAULT_NETWORK || "mainnet";
const chains: readonly [Chain, ...Chain[]] =
  defaultNetwork === "testnet"
    ? [bscTestnet, bscMainnet]
    : [bscMainnet, bscTestnet];

// Custom wallet configuration for BSC
const wallets = [
  {
    groupName: "Popular for BSC",
    wallets: [metaMaskWallet, trustWallet, walletConnectWallet, coinbaseWallet],
  },
  {
    groupName: "Other Wallets",
    wallets: [rainbowWallet, injectedWallet],
  },
];

// Create Wagmi configuration
export const config = getDefaultConfig({
  appName: "X402 USD1 Transfer",
  projectId:
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "YOUR_PROJECT_ID_HERE",
  chains,
  ssr: false, // Disable SSR for Next.js
});

// Export chains and config
export { chains, wallets };
