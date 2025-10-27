"use client";

import React, { useEffect, useRef, useState } from "react";
import { FiAlertCircle } from "react-icons/fi";
import { useTransfer } from "../../hooks/useTransfer";
import TokenSelector from "./TokenSelector";

function AmountInput() {
  const { amount, setAmount, isProcessing, account, balance, clearFeedback } =
    useTransfer();
  const inputRef = useRef<HTMLInputElement>(null);
  const [displayValue, setDisplayValue] = useState("0.00");
  const [exceedsBalance, setExceedsBalance] = useState(false);

  useEffect(() => {
    if (amount && amount !== displayValue) {
      setDisplayValue(amount);
    }
  }, [amount, displayValue]);

  useEffect(() => {
    if (account && inputRef.current) {
      inputRef.current.focus();
    }
  }, [account]);

  // Check if amount exceeds balance
  useEffect(() => {
    const numAmount = parseFloat(displayValue);
    const numBalance = parseFloat(balance);
    setExceedsBalance(numAmount > numBalance && numAmount > 0);
  }, [displayValue, balance]);

  // Format value payment-style (type in cents)
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // Remove everything that's not a digit
    value = value.replace(/\D/g, "");

    if (value === "") {
      setDisplayValue("0.00");
      setAmount("");
      clearFeedback();
      return;
    }

    // Limit to 8 digits (999999.99 max)
    if (value.length > 8) {
      value = value.slice(0, 8);
    }

    // Convert to number and divide by 100
    const numValue = parseInt(value, 10);
    const formatted = (numValue / 100).toFixed(2);

    setDisplayValue(formatted);
    setAmount(formatted);
    clearFeedback();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow only numbers, backspace, delete, tab
    const allowedKeys = [
      "Backspace",
      "Delete",
      "Tab",
      "ArrowLeft",
      "ArrowRight",
    ];

    if (!allowedKeys.includes(e.key) && !/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div
      className={`bg-[#FFF9E6] rounded-2xl p-4 border ${
        exceedsBalance ? "border-red-300" : "border-[#F0D890]/30"
      } transition-colors`}
    >
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm text-gray-700 font-normal">
          {account ? `Sending from ${formatAddress(account)}` : "Sending"}
        </label>
        {exceedsBalance && (
          <div className="flex items-center gap-1 text-xs text-red-600">
            <FiAlertCircle size={12} />
            <span>Exceeds balance</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <TokenSelector />

        <div className="text-right">
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            value={displayValue}
            onChange={handleAmountChange}
            onKeyDown={handleKeyDown}
            placeholder="0.00"
            disabled={!account || isProcessing}
            className={`bg-transparent text-3xl font-light ${
              exceedsBalance ? "text-red-600" : "text-gray-900"
            } placeholder-gray-400 text-right outline-none w-32 transition-colors`}
            style={{ minWidth: "120px" }}
          />
          <div
            className={`text-sm mt-1 ${
              exceedsBalance ? "text-red-500" : "text-gray-500"
            }`}
          >
            {account ? `Available: ${balance} USD1` : "$0.00"}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AmountInput;
