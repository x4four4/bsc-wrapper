"use client";

import type { SubmitButtonProps } from "@/app/types";
import { useEffect, useState } from "react";
import { FiEdit3, FiLoader, FiSend } from "react-icons/fi";
import { useTransfer } from "../../hooks/useTransfer";
import { useWeb3 } from "../../hooks/useWeb3";
import WalletBottomSheet from "../WalletBottomSheet";
import WalletConnect from "../WalletConnect";

interface ExtendedSubmitButtonProps extends SubmitButtonProps {
  onOpenWalletSheet?: () => void;
}

function SubmitButton({ onConnect, isConnecting }: ExtendedSubmitButtonProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState<string>();
  const { account, isProcessing, recipient, amount, step } = useTransfer();
  const { error } = useWeb3();

  // Close sheet when account connects successfully
  useEffect(() => {
    if (account && isSheetOpen) {
      setTimeout(() => {
        setIsSheetOpen(false);
        setConnectingWallet(undefined);
      }, 500);
    }
  }, [account, isSheetOpen]);

  const handleWalletSelect = async (walletId: string) => {
    setConnectingWallet(walletId);

    try {
      // Call the original connect function with wallet type
      await onConnect(walletId);
      // The sheet will close automatically via useEffect when account connects
    } catch (error) {
      console.error("Wallet connection error:", error);
      setConnectingWallet(undefined);
      // Don't close the sheet on error
    }
  };

  if (!account) {
    return (
      <>
        <div className="mt-6">
          <WalletConnect
            onConnect={onConnect}
            isConnecting={isConnecting}
            onOpenSheet={() => setIsSheetOpen(true)}
          />
        </div>

        <WalletBottomSheet
          isOpen={isSheetOpen}
          onClose={() => setIsSheetOpen(false)}
          onWalletSelect={handleWalletSelect}
          isConnecting={isConnecting}
          connectingWallet={connectingWallet}
          error={error}
        />
      </>
    );
  }

  const getButtonContent = () => {
    if (isProcessing) {
      let icon, text;
      switch (step) {
        case "signing":
          icon = <FiEdit3 className="inline animate-pulse mr-2" size={18} />;
          text = "Sign in Wallet...";
          break;
        case "sending":
          icon = <FiSend className="inline animate-pulse mr-2" size={18} />;
          text = "Sending Transaction...";
          break;
        case "confirming":
          icon = <FiLoader className="inline animate-spin mr-2" size={18} />;
          text = "Confirming on Chain...";
          break;
        default:
          icon = <FiLoader className="inline animate-spin mr-2" size={18} />;
          text = "Processing...";
      }
      return (
        <div className="flex items-center justify-center">
          {icon}
          <span>{text}</span>
        </div>
      );
    }

    if (!recipient && !amount) {
      return "Enter details";
    }
    if (!recipient) {
      return "Enter recipient";
    }
    if (!amount) {
      return "Enter amount";
    }

    return "Send";
  };

  const isDisabled = isProcessing || !recipient || !amount;

  return (
    <button
      type="submit"
      disabled={isDisabled}
      className={`
        w-full mt-6 py-4 px-6 rounded-full font-medium text-base transition-all
        ${
          isProcessing
            ? "bg-[#FFE599] text-gray-700 cursor-wait"
            : isDisabled
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-[#FFD966] hover:bg-[#F0CB5C] text-gray-900 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
        }
      `}
    >
      {getButtonContent()}
    </button>
  );
}

export default SubmitButton;
