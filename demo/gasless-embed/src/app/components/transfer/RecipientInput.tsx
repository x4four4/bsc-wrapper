"use client";

import { ethers } from "ethers";
import { useEffect, useState } from "react";
import { FiAlertCircle } from "react-icons/fi";
import { useTransfer } from "../../hooks/useTransfer";

function RecipientInput() {
  const {
    recipient,
    setRecipient,
    isProcessing,
    account,
    clearFeedback,
    setFeedback,
  } = useTransfer();
  const [isInvalid, setIsInvalid] = useState(false);

  // Validate address in real-time
  useEffect(() => {
    if (!recipient) {
      setIsInvalid(false);
      clearFeedback();
      return;
    }

    // Only show error if it has 42 characters and is still invalid
    if (recipient.length >= 42) {
      const valid = ethers.isAddress(recipient);
      setIsInvalid(!valid);

      if (!valid) {
        setFeedback("Invalid address format", "error");
      } else {
        clearFeedback();
      }
    } else {
      setIsInvalid(false);
      clearFeedback();
    }
  }, [recipient, setFeedback, clearFeedback]);

  const formatAddress = (address: string) => {
    if (!address) return "";
    if (address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setRecipient(text.trim());
    } catch (err) {
      console.error("Failed to read clipboard:", err);
    }
  };

  return (
    <div
      className={`bg-[#FFF9E6] rounded-2xl p-4 border ${
        isInvalid ? "border-red-300" : "border-[#F0D890]/30"
      } transition-colors`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-700 font-normal">To:</label>
          {isInvalid && <FiAlertCircle className="text-red-500" size={14} />}
        </div>
        {recipient && (
          <button
            type="button"
            onClick={() => setRecipient("")}
            className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      <div className="relative">
        <input
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="Enter recipient address"
          disabled={!account || isProcessing}
          className="w-full bg-transparent text-gray-900 placeholder-gray-400 text-base outline-none"
        />

        {!recipient && account && (
          <button
            type="button"
            onClick={handlePaste}
            className="absolute right-0 top-1/2 -translate-y-1/2 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded-lg transition-colors"
          >
            Paste
          </button>
        )}
      </div>
    </div>
  );
}

export default RecipientInput;
