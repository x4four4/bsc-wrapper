"use client";

import api from "@/app/services/api";
import type {
  FeedbackType,
  Network,
  TransactionData,
  TransferStep,
} from "@/app/types";
import { createGaslessSignatures } from "@/app/utils/signatures";
import { ethers } from "ethers";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface TransferContextType {
  // States
  recipient: string;
  setRecipient: (value: string) => void;
  amount: string;
  setAmount: (value: string) => void;
  isProcessing: boolean;
  step: TransferStep | null;
  selectedToken: string;
  setSelectedToken: (value: string) => void;
  balance: string;
  feedbackMessage: string | null;
  feedbackType: FeedbackType;

  // Actions
  executeTransfer: () => Promise<boolean>;
  resetForm: () => void;
  validateForm: () => boolean;
  setFeedback: (message: string, type?: FeedbackType) => void;
  clearFeedback: () => void;

  // External props
  account: string | null;
  network: Network | null;
}

const TransferContext = createContext<TransferContextType | undefined>(
  undefined
);

export const useTransferContext = () => {
  const context = useContext(TransferContext);
  if (!context) {
    throw new Error("useTransferContext must be used within TransferProvider");
  }
  return context;
};

interface TransferProviderProps {
  children: ReactNode;
  account: string | null;
  network: Network | null;
  onTransactionComplete?: (data: TransactionData) => void;
}

export function TransferProvider({
  children,
  account,
  network,
  onTransactionComplete,
}: TransferProviderProps) {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<TransferStep | null>(null);
  const [selectedToken, setSelectedToken] = useState("USD1");
  const [balance, setBalance] = useState("0.00");
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>(null);

  const setFeedback = useCallback(
    (message: string, type: FeedbackType = "info") => {
      setFeedbackMessage(message);
      setFeedbackType(type);
    },
    []
  );

  const clearFeedback = useCallback(() => {
    setFeedbackMessage(null);
    setFeedbackType(null);
  }, []);

  const validateForm = useCallback(() => {
    if (!recipient || !ethers.isAddress(recipient)) {
      setFeedback("Please enter a valid BSC address", "error");
      return false;
    }

    if (recipient.toLowerCase() === account?.toLowerCase()) {
      setFeedback("Cannot send to yourself", "error");
      return false;
    }

    const amountNum = parseFloat(amount);
    if (!amount || amountNum <= 0) {
      setFeedback("Please enter a valid amount", "error");
      return false;
    }

    if (amountNum < 0.01) {
      setFeedback("Minimum transfer amount is 0.01 USD1", "error");
      return false;
    }

    const balanceNum = parseFloat(balance);
    if (amountNum > balanceNum) {
      setFeedback("USD1 balance insufficient", "error");
      return false;
    }

    return true;
  }, [recipient, account, amount, balance, setFeedback]);

  const resetForm = useCallback(() => {
    setRecipient("");
    setAmount("");
    setStep(null);
    clearFeedback();
  }, [clearFeedback]);

  const executeTransfer = useCallback(async () => {
    if (!validateForm()) return false;

    setIsProcessing(true);
    setStep("signing");

    try {
      // Step 1: Create signatures
      setFeedback("Please sign the transaction in your wallet...", "info");

      const signatures = await createGaslessSignatures(
        account!,
        recipient,
        amount,
        "mainnet"
      );

      setStep("sending");

      // Step 2: Send to facilitator

      const response = await api.executeTransfer(signatures as never);

      // @ts-expect-error - response.success is not typed
      if (!response.success) {
        throw new Error(response.data.error);
      }

      setStep("confirming");

      // Step 3: Wait for confirmation
      let confirmed = false;
      let attempts = 0;
      const maxAttempts = 20;

      while (!confirmed && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 3000));

        const status = await api.getTransactionStatus(
          response.data.txHash || ""
        );

        if (status.data.status === "success") {
          confirmed = true;

          // Call completion handler
          if (onTransactionComplete) {
            onTransactionComplete({
              ...response.data,
              to: recipient,
              amount,
            } as never);
          }

          // Reset form after delay
          setTimeout(() => {
            resetForm();
          }, 3000);

          return true;
        } else if (status.data.status === "failed") {
          throw new Error("Transaction failed on blockchain");
        }

        attempts++;
      }

      if (!confirmed) {
        setFeedback(
          "Transaction confirmation timeout. Check the explorer for the status.",
          "error"
        );
      }
    } catch (error) {
      const transferError = error as {
        code?: string | number;
        message?: string;
      };
      console.error("Transfer error:", transferError);

      if (
        transferError.code === "ACTION_REJECTED" ||
        transferError.message?.includes("rejected")
      ) {
        setFeedback("Transaction cancelled by user", "error");
      } else if (transferError.message?.includes("Insufficient")) {
        setFeedback("Insufficient USD1 balance", "error");
      } else if (transferError.message?.includes("Nonce already used")) {
        setFeedback("This transaction has already been processed", "error");
      } else {
        setFeedback(
          transferError.message || "Transfer failed. Please try again.",
          "error"
        );
      }
      return false;
    } finally {
      setIsProcessing(false);
      setStep(null);
    }

    return true;
  }, [
    account,
    recipient,
    amount,
    validateForm,
    onTransactionComplete,
    resetForm,
    setFeedback,
  ]);

  // Fetch balance when account changes
  useEffect(() => {
    const fetchBalance = async () => {
      if (!account) {
        setBalance("0.00");
        return;
      }

      try {
        const response = await api.getBalance(account);

        // @ts-expect-error - response.success is not typed
        if (response.success) {
          setBalance(parseFloat(response.data.balance || "0").toFixed(2));
        }
      } catch (error) {
        console.error("Failed to fetch balance:", error);
        setBalance("0.00");
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 30000); // Update every 30s

    return () => clearInterval(interval);
  }, [account]);

  const value: TransferContextType = {
    // States
    recipient,
    setRecipient,
    amount,
    setAmount,
    isProcessing,
    step,
    selectedToken,
    setSelectedToken,
    balance,
    feedbackMessage,
    feedbackType,

    // Actions
    executeTransfer,
    resetForm,
    validateForm,
    setFeedback,
    clearFeedback,

    // External props
    account,
    network,
  };

  return (
    <TransferContext.Provider value={value}>
      {children}
    </TransferContext.Provider>
  );
}
