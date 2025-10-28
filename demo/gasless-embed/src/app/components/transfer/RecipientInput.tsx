"use client";

import { ethers } from "ethers";
import { useEffect, useState } from "react";
import { FiAlertCircle } from "react-icons/fi";
import { useTransfer } from "../../hooks/useTransfer";

function RecipientInput() {
  const { recipient, setRecipient, isProcessing, account, clearFeedback } =
    useTransfer();
  const [isInvalid, setIsInvalid] = useState(false);
  const [isSelfTransfer, setIsSelfTransfer] = useState(false);

  // Validate address in real-time
  useEffect(() => {
    if (!recipient) {
      setIsInvalid(false);
      setIsSelfTransfer(false);
      clearFeedback();
      return;
    }

    // Only show error if it has 42 characters and is still invalid
    if (recipient.length >= 42) {
      const valid = ethers.isAddress(recipient);
      setIsInvalid(!valid);

      // Check if sending to self
      if (valid && account) {
        const isSelf = recipient.toLowerCase() === account.toLowerCase();
        setIsSelfTransfer(isSelf);
      } else {
        setIsSelfTransfer(false);
      }
    } else {
      setIsInvalid(false);
      setIsSelfTransfer(false);
      clearFeedback();
    }
  }, [recipient, account, clearFeedback]);

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
        <label className="text-sm text-gray-700 font-normal">To:</label>
        <div className="flex items-center gap-2">
          {isInvalid && (
            <div className="flex items-center gap-1 text-xs text-red-600">
              <FiAlertCircle size={12} />
              <span>Invalid address</span>
            </div>
          )}
          {isSelfTransfer && (
            <div className="flex items-center gap-1 text-xs text-orange-600">
              <FiAlertCircle size={12} />
              <span>Self transfer</span>
            </div>
          )}
          {recipient && (
            <button
              type="button"
              onClick={() => setRecipient("")}
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors ml-2"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="relative">
        <input
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="Enter recipient address"
          disabled={!account || isProcessing}
          className={`w-full bg-transparent placeholder-gray-400 text-base outline-none ${
            isInvalid
              ? "text-red-600"
              : isSelfTransfer
                ? "text-orange-600"
                : "text-gray-900"
          }`}
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
