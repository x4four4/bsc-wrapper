"use client";

import { useEffect, useState } from "react";
import { FiPlus, FiRefreshCw } from "react-icons/fi";
import api from "../services/api";
import { addUSD1ToMetaMask } from "../utils/addToken";

function BalanceDisplay({ address }: { address: string }) {
  const [balance, setBalance] = useState("0.00");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchBalance = async () => {
    if (!address) return;

    try {
      setIsRefreshing(true);
      const response = await api.getBalance(address);
      // @ts-expect-error - response.success is not typed
      if (response.success) {
        setBalance(parseFloat(response.data.balance || "0").toFixed(2));
      }
    } catch (error) {
      console.error("Failed to fetch balance:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [address]);

  const handleAddToken = async () => {
    try {
      await addUSD1ToMetaMask();
    } catch (error) {
      console.error("Failed to add token:", error);
    }
  };

  return (
    <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-800">
      <div>
        <p className="text-xs text-gray-500">Balance</p>
        <p className="text-lg font-medium text-white">
          {isLoading ? (
            <span className="inline-block w-16 h-5 bg-gray-700 rounded animate-pulse" />
          ) : (
            `${balance} USD1`
          )}
        </p>
      </div>
      <div className="flex gap-1">
        <button
          onClick={handleAddToken}
          className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors"
          title="Add USD1 to MetaMask"
        >
          <FiPlus className="w-4 h-4" />
        </button>
        <button
          onClick={fetchBalance}
          disabled={isRefreshing}
          className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors"
          title="Refresh balance"
        >
          <FiRefreshCw
            className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
        </button>
      </div>
    </div>
  );
}

export default BalanceDisplay;
