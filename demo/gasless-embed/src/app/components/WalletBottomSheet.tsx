"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { FiX } from "react-icons/fi";
import {
  BinanceIcon,
  CoinbaseIcon,
  MetaMaskIcon,
  TrustWalletIcon,
} from "./icons/WalletIcons";

export interface WalletOption {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description: string;
  installed?: boolean;
}

interface WalletBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onWalletSelect: (walletId: string) => void;
  isConnecting: boolean;
  connectingWallet?: string;
  error?: string | null;
}

// Wallet options for BSC
const WALLET_OPTIONS: WalletOption[] = [
  {
    id: "metamask",
    name: "MetaMask",
    icon: MetaMaskIcon,
    color: "#F6851B",
    description: "Most popular Web3 wallet",
  },
  {
    id: "trust",
    name: "Trust Wallet",
    icon: TrustWalletIcon,
    color: "#3375BB",
    description: "Official Binance wallet",
  },
  {
    id: "binance",
    name: "Binance Wallet",
    icon: BinanceIcon,
    color: "#F0B90B",
    description: "Binance Chain Wallet",
  },
  // {
  //   id: "walletconnect",
  //   name: "WalletConnect",
  //   icon: WalletConnectIcon,
  //   color: "#3B99FC",
  //   description: "Connect with mobile wallets",
  // },
  {
    id: "coinbase",
    name: "Coinbase Wallet",
    icon: CoinbaseIcon,
    color: "#0052FF",
    description: "Easy to use wallet",
  },
];

export default function WalletBottomSheet({
  isOpen,
  onClose,
  onWalletSelect,
  isConnecting,
  connectingWallet,
  error,
}: WalletBottomSheetProps) {
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

  // Detect installed wallets
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Check for MetaMask
      const hasMetaMask = (window as any).ethereum?.isMetaMask;

      // Check for Trust Wallet
      const hasTrustWallet = (window as any).ethereum?.isTrust;

      // Check for Binance Wallet
      const hasBinanceWallet =
        (window as any).ethereum?.isBinance || (window as any).BinanceChain;

      // Check for Coinbase Wallet
      const hasCoinbaseWallet = (window as any).ethereum?.isCoinbaseWallet;

      // Update wallet options with installation status
      WALLET_OPTIONS.forEach((wallet) => {
        if (wallet.id === "metamask") wallet.installed = hasMetaMask;
        if (wallet.id === "trust") wallet.installed = hasTrustWallet;
        if (wallet.id === "binance") wallet.installed = hasBinanceWallet;
        if (wallet.id === "coinbase") wallet.installed = hasCoinbaseWallet;
      });
    }
  }, [isOpen]);

  const handleWalletSelect = (walletId: string) => {
    setSelectedWallet(walletId);
    onWalletSelect(walletId);
  };

  // Bottom sheet animation variants
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const sheetVariants = {
    hidden: {
      y: "100%",
      borderRadius: "24px 24px 0 0",
    },
    visible: {
      y: 0,
      borderRadius: "24px 24px 0 0",
      transition: {
        type: "spring",
        damping: 30,
        stiffness: 300,
      },
    },
    exit: {
      y: "100%",
      transition: {
        type: "spring",
        damping: 30,
        stiffness: 300,
      },
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 -bottom-8 -left-8 -right-8 -top-12 bg-black/30 backdrop-blur-sm rounded-[24px] z-40"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
          />

          {/* Bottom Sheet */}
          <motion.div
            className="absolute -bottom-8 -left-6 -right-6 z-50 bg-white max-h-[45vh] overflow-hidden shadow-2xl"
            variants={sheetVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, { velocity }) => {
              if (velocity.y > 500) {
                onClose();
              }
            }}
          >
            {/* Drag Handle */}
            <div className="flex justify-center py-3">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Header - more compact */}
            <div className="flex items-center justify-between px-6 pb-3 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                Connect Wallet
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                disabled={isConnecting}
              >
                <FiX className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mx-6 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            {/* Wallet Options */}
            <div className="px-6 py-4 overflow-y-auto max-h-[40vh]">
              <div className="grid grid-cols-4 gap-2">
                {WALLET_OPTIONS.map((wallet) => {
                  const Icon = wallet.icon;
                  const isSelected =
                    selectedWallet === wallet.id ||
                    connectingWallet === wallet.id;
                  const isCurrentlyConnecting = isConnecting && isSelected;

                  return (
                    <motion.button
                      key={wallet.id}
                      type="button"
                      onClick={() => handleWalletSelect(wallet.id)}
                      disabled={isConnecting}
                      className={`
                        flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all relative
                        ${
                          isSelected
                            ? "border-[#FFD966] bg-[#FFF8E1]"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }
                        ${isConnecting && !isSelected ? "opacity-50 cursor-not-allowed" : ""}
                      `}
                      whileTap={{ scale: 0.95 }}
                    >
                      {/* Installed Badge */}
                      {wallet.installed && (
                        <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full" />
                      )}

                      {/* Wallet Icon */}
                      <div className="w-12 h-12 flex items-center justify-center mb-2">
                        {isCurrentlyConnecting ? (
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#FFD966] border-t-transparent" />
                        ) : (
                          <Icon className="w-10 h-10" />
                        )}
                      </div>

                      {/* Wallet Name */}
                      <h3 className="text-xs font-semibold text-gray-900 text-center">
                        {wallet.name}
                      </h3>
                    </motion.button>
                  );
                })}
              </div>

              {/* Info Section - more compact */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-700">
                  <strong>New to wallets?</strong> We recommend MetaMask.
                  <a
                    href="https://metamask.io/download/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-800 font-medium ml-1 hover:underline"
                  >
                    Learn more →
                  </a>
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100">
              <p className="text-xs text-center text-gray-400">
                By connecting, you agree to our Terms of Service
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
