"use client";

import { motion } from "framer-motion";

function TransferHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center mb-6"
    >
      <h1 className="text-2xl font-medium text-gray-900 mb-2">Send USD1</h1>

      <p className="text-gray-600 text-sm leading-5 max-w-xs mx-auto">
        Send money to wallet addresses
        <br />
        with instant, on-chain finality.
      </p>
    </motion.div>
  );
}

export default TransferHeader;
