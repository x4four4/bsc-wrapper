import { useTransferContext } from "@/app/contexts/TransferContext";
import { useCallback } from "react";

export function useTransfer() {
  const context = useTransferContext();

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      return await context.executeTransfer();
    },
    [context]
  );

  const isFormValid = useCallback(() => {
    return context.recipient && context.amount && !context.isProcessing;
  }, [context.recipient, context.amount, context.isProcessing]);

  return {
    ...context,
    handleSubmit,
    isFormValid,
  };
}
