"use client";

import type { SubmitButtonProps } from "@/app/types";
import { FiEdit3, FiLoader, FiSend } from "react-icons/fi";
import { useTransfer } from "../../hooks/useTransfer";
import WalletConnect from "../WalletConnect";

function SubmitButton({ onConnect, isConnecting }: SubmitButtonProps) {
  const { account, isProcessing, recipient, amount, step } = useTransfer();

  if (!account) {
    return (
      <div className="mt-6">
        <WalletConnect onConnect={onConnect} isConnecting={isConnecting} />
      </div>
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
