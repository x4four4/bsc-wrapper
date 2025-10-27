// Network types
export interface Network {
  chainId: number;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  contracts: {
    usd1: string;
    wrapper: string;
  };
  supportsPermit: boolean;
  gasPrice?: string;
  blockTime?: number;
}

// Transaction types
export interface TransferSignature {
  validAfter: number;
  validBefore: number;
  nonce: string;
  v: number;
  r: string;
  s: string;
}

export interface PermitSignature {
  deadline: number;
  v: number;
  r: string;
  s: string;
}

export interface GaslessSignatures {
  transfer: TransferSignature;
  permit: PermitSignature | null;
}

export interface TransactionData {
  txHash: string;
  from: string;
  to: string;
  amount: string;
  explorerUrl?: string;
  blockNumber?: number;
  gasUsed?: string;
  timestamp?: number;
}

export interface TransactionStatus {
  status: "pending" | "success" | "failed";
  confirmations?: number;
  blockNumber?: number;
  gasUsed?: string;
  effectiveGasPrice?: string;
}

// Transfer context types
export type TransferStep =
  | "idle"
  | "signing"
  | "sending"
  | "confirming"
  | "complete";
export type FeedbackType = "error" | "info" | "success" | null;

export interface TransferData {
  from: string;
  to: string;
  amount: string;
  transfer: TransferSignature;
  permit?: PermitSignature;
}

// API types
export interface TransferRequest {
  from: string;
  to: string;
  amount: string;
  transfer: TransferSignature;
  permit?: PermitSignature;
}

export interface TransferResponse {
  success: boolean;
  txHash?: string;
  explorerUrl?: string;
  error?: string;
}

export interface EstimateGasRequest {
  from: string;
  to: string;
  amount: string;
  withPermit: boolean;
}

export interface EstimateGasResponse {
  success: boolean;
  gasEstimate?: string;
  estimatedCostBNB?: string;
  estimatedCostUSD?: string;
  error?: string;
}

export interface BalanceResponse {
  success: boolean;
  balance?: string;
  address?: string;
  error?: string;
}

// Component props
export interface WalletConnectProps {
  onConnect: () => Promise<void>;
  isConnecting: boolean;
}

export interface TransferFormProps {
  onConnect: () => Promise<void>;
  isConnecting: boolean;
  account?: string | null;
  network?: Network | null;
  onTransactionComplete?: (data: TransactionData) => void;
}

export interface TransactionStatusProps {
  transaction: TransactionData;
  onClose: () => void;
}

export interface SubmitButtonProps {
  onConnect: () => Promise<void>;
  isConnecting: boolean;
}

// Ethereum types
export interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener: (
    event: string,
    handler: (...args: unknown[]) => void
  ) => void;
  isMetaMask?: boolean;
}

// Error types
export interface ApiError extends Error {
  code?: string | number;
  status?: number;
  data?: unknown;
}

// Window extension
declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}
