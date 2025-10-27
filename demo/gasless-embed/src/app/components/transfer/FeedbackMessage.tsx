"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FiAlertCircle } from "react-icons/fi";
import { useTransfer } from "../../hooks/useTransfer";

function FeedbackMessage() {
  const { feedbackMessage, feedbackType, clearFeedback } = useTransfer();

  // Only show validation errors, not progress feedback
  if (!feedbackMessage || feedbackType !== "error") return null;

  const getIcon = () => {
    return <FiAlertCircle className="text-red-600" size={16} />;
  };

  const getStyles = () => {
    return "bg-red-50 border-red-200 text-red-700";
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`rounded-xl p-3 border ${getStyles()} mb-4`}
      >
        <div className="flex items-center gap-2">
          {getIcon()}
          <span className="text-sm flex-1">{feedbackMessage}</span>
          {feedbackType === "error" && (
            <button
              onClick={clearFeedback}
              className="text-gray-500 hover:text-gray-700 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default FeedbackMessage;
