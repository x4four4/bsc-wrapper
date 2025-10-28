"use client";

import type { TransferFormProps } from "@/app/types";
import { TransferProvider } from "../contexts/TransferContext";
import { useTransfer } from "../hooks/useTransfer";
import AmountInput from "./transfer/AmountInput";
import RecipientInput from "./transfer/RecipientInput";
import SubmitButton from "./transfer/SubmitButton";
import TransferHeader from "./transfer/TransferHeader";

// Container interno que usa o contexto
function TransferFormContent({ onConnect, isConnecting }: TransferFormProps) {
  const { handleSubmit } = useTransfer();

  return (
    <div className="w-full max-w-md mx-auto relative">
      <TransferHeader />

      <form onSubmit={handleSubmit} className="space-y-4">
        <AmountInput />
        <RecipientInput />
        <SubmitButton onConnect={onConnect} isConnecting={isConnecting} />
      </form>
    </div>
  );
}

// Componente principal com Provider
function TransferForm({
  account,
  network,
  onTransactionComplete,
  onConnect,
  isConnecting,
}: TransferFormProps) {
  return (
    <TransferProvider
      account={account || null}
      network={network || null}
      onTransactionComplete={onTransactionComplete}
    >
      <TransferFormContent onConnect={onConnect} isConnecting={isConnecting} />
    </TransferProvider>
  );
}

export default TransferForm;
