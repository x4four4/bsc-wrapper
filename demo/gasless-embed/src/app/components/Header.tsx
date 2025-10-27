"use client";

import { motion } from "framer-motion";
import { FiZap } from "react-icons/fi";

function Header() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center mb-8"
    >
      <div className="flex items-center justify-center mb-4">
        <div
          className="p-3 rounded-2xl shadow-lg"
          style={{
            background: "linear-gradient(to bottom right, #FFD966, #F0CB5C)",
          }}
        >
          <FiZap className="w-8 h-8 text-white" />
        </div>
      </div>
      <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
        Gasless <span className="text-gradient">USD1</span> Transfer
      </h1>
      <p className="text-lg text-gray-600 max-w-md mx-auto">
        Send USD1 on BSC without paying gas fees. Sign once, we handle the rest.
      </p>
    </motion.header>
  );
}

export default Header;
