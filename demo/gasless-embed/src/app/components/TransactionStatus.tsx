"use client";

import { calculateGasCosts } from "@/app/services/priceService";
import type { TransactionStatusProps } from "@/app/types";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { FiCopy, FiLoader } from "react-icons/fi";

function TransactionStatus({ transaction, onClose }: TransactionStatusProps) {
  const [gasData, setGasData] = useState<{
    gasCostBNB: number;
    gasCostUSD: number;
    gasPrice: string;
    bnbPrice: number;
  } | null>(null);
  const [isLoadingGas, setIsLoadingGas] = useState(true);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Fetch real-time gas data
  useEffect(() => {
    const fetchGasData = async () => {
      setIsLoadingGas(true);
      try {
        const data = await calculateGasCosts(transaction.gasUsed);
        setGasData(data);
      } catch (error) {
        console.error("Failed to fetch gas data:", error);
        // Fallback values
        setGasData({
          gasCostBNB: 0.00036,
          gasCostUSD: 0.216,
          gasPrice: "3",
          bnbPrice: 600,
        });
      } finally {
        setIsLoadingGas(false);
      }
    };

    fetchGasData();
  }, [transaction.gasUsed]);

  const gasSaved = gasData?.gasCostUSD
    ? gasData.gasCostUSD < 0.01
      ? "0.01"
      : gasData.gasCostUSD.toFixed(3)
    : "0.00";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Success header */}
      <div className="text-center mb-4">
        <h3 className="text-2xl font-medium text-gray-900">
          Transfer Complete
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Your transaction has been confirmed
        </p>
      </div>

      {/* Transaction details */}
      <div className="space-y-2">
        {/* Amount card */}
        <div className="bg-[#FFF9E6] flex items-center justify-between rounded-2xl p-4 border border-[#F0D890]/30">
          <label className="text-sm text-gray-700 font-normal block">
            Amount
          </label>
          <div className="text-lg font-normal text-gray-900">
            {transaction.amount} USD1
          </div>
        </div>

        {/* Recipient card */}
        <div className="bg-[#FFF9E6] flex items-center justify-between rounded-2xl p-4 border border-[#F0D890]/30">
          <label className="text-sm text-gray-700 font-normal block">To</label>
          <div className="font-mono text-gray-700">
            {formatAddress(transaction.to)}
          </div>
        </div>

        {/* TX Hash card */}
        <div className="bg-[#FFF9E6] flex items-center justify-between rounded-2xl p-4 border border-[#F0D890]/30">
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-700 font-normal">TX Hash</label>
            <button
              onClick={() => copyToClipboard(transaction.txHash)}
              className="text-gray-500 hover:text-gray-700"
              title="Copy"
            >
              <FiCopy className="w-3 h-3" />
            </button>
          </div>
          <div className="font-mono text-gray-700 text-sm">
            {formatAddress(transaction.txHash)}
          </div>
        </div>

        {/* Gas saved - with real-time data */}
        <div className="bg-green-50 rounded-2xl p-4 border border-green-200/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700 font-normal">
                Gas Saved
              </span>
              {isLoadingGas && (
                <FiLoader className="animate-spin text-gray-500 w-3 h-3" />
              )}
            </div>
            <div className="text-right">
              <div className="text-base font-medium text-green-700">
                ${gasSaved}
              </div>
              <div className="text-xs text-gray-500">
                {gasData?.gasCostBNB.toFixed(5) || "0.00036"} BNB
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons - same style as form */}
      <div className="flex gap-2 mt-6">
        <a
          href={
            transaction.explorerUrl ||
            `https://bscscan.com/tx/${transaction.txHash}`
          }
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-center bg-gray-700 hover:bg-gray-800 text-white font-medium py-4 px-4 rounded-full transition-colors text-sm"
        >
          View on BSCScan
        </a>

        <button
          onClick={onClose}
          className="flex-1 bg-[#FFD966] hover:bg-[#F0CB5C] text-gray-900 font-medium py-4 px-4 rounded-full transition-colors text-sm shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
        >
          New Transfer
        </button>
      </div>
    </motion.div>
  );
}

export default TransactionStatus;
