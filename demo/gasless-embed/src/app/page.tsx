"use client";

import type { TransactionData } from "@/app/types";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import TransactionStatus from "./components/TransactionStatus";
import TransferForm from "./components/TransferForm";
import { useWeb3 } from "./hooks/useWeb3";

export default function Page() {
  const { account, isConnecting, connect, network } = useWeb3();

  const [currentTransaction, setCurrentTransaction] =
    useState<TransactionData | null>(null);

  const isEmbedded = true;

  // Listen for messages from parent (if embedded)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "set-recipient") {
        // Parent can set default recipient
        console.log("Recipient set from parent:", event.data.recipient);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleTransactionComplete = (txData: TransactionData) => {
    setCurrentTransaction(txData);

    // Notify parent if embedded
    if (isEmbedded) {
      window.parent.postMessage(
        {
          type: "gasless-transfer-complete",
          data: txData,
        },
        "*"
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Gradient background similar to Jupiter */}
      <div className="fixed inset-0 bg-white -z-10" />

      {/* Subtle glow effect */}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[420px] bg-[#FFF1C6] rounded-[32px] p-8 overflow-hidden relative"
      >
        {/* Show transaction status if there's one */}
        {currentTransaction ? (
          <TransactionStatus
            transaction={currentTransaction}
            onClose={() => setCurrentTransaction(null)}
          />
        ) : (
          <TransferForm
            account={account}
            network={network}
            onTransactionComplete={handleTransactionComplete}
            onConnect={connect}
            isConnecting={isConnecting}
          />
        )}
      </motion.div>
    </div>
  );
}
