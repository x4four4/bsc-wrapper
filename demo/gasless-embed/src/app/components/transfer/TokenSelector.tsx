"use client";

import { FiChevronDown } from "react-icons/fi";
import { useTransfer } from "../../hooks/useTransfer";

function TokenSelector() {
  const { selectedToken } = useTransfer();

  return (
    <button
      type="button"
      className="flex items-center gap-2 px-3 py-1.5 bg-[#FFD966] hover:bg-[#F0CB5C] rounded-full transition-colors"
      disabled // Currently only supports USD1
    >
      <span className="text-gray-900 text-sm font-medium">{selectedToken}</span>
      <FiChevronDown className="text-gray-700" size={16} />
    </button>
  );
}

export default TokenSelector;
