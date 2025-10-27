"use client";

import type { WalletConnectProps } from "@/app/types";
import { FiLoader } from "react-icons/fi";

function WalletConnect({ onConnect, isConnecting }: WalletConnectProps) {
  return (
    <button
      type="button"
      onClick={onConnect}
      disabled={isConnecting}
      className="w-full bg-[#FFD966] hover:bg-[#F0CB5C] text-gray-900 disabled:bg-gray-200 disabled:text-gray-400 font-medium py-4 px-6 rounded-full transition-all shadow-sm hover:shadow-md transform hover:-translate-y-0.5 disabled:cursor-not-allowed"
    >
      {isConnecting ? (
        <>
          <FiLoader className="inline animate-spin mr-2" />
          Connecting...
        </>
      ) : (
        "Connect Wallet"
      )}
    </button>
  );
}

export default WalletConnect;
