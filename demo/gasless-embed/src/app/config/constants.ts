// Network configuration
export const DEFAULT_NETWORK =
  process.env.NEXT_PUBLIC_DEFAULT_NETWORK || "mainnet";

// API configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

// Contract ABIs
export const USD1_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)",
];

export const WRAPPER_ABI = [
  "function nonces(address owner) view returns (uint256)",
  "function gaslessTransferWithPermit(address from, address to, uint256 amount, uint256 validAfter, uint256 validBefore, bytes32 nonce, uint8 v, bytes32 r, bytes32 s, uint256 deadline, uint8 permitV, bytes32 permitR, bytes32 permitS) returns (bool)",
  "function gaslessTransfer(address from, address to, uint256 amount, uint256 validAfter, uint256 validBefore, bytes32 nonce, uint8 v, bytes32 r, bytes32 s) returns (bool)",
  "function DOMAIN_SEPARATOR() view returns (bytes32)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event GaslessTransfer(address indexed from, address indexed to, uint256 value, address indexed facilitator)",
];

// Network configurations
export const NETWORKS = {
  mainnet: {
    chainId: 56,
    name: "BNB Smart Chain",
    network: "mainnet",
    currency: {
      name: "BNB",
      symbol: "BNB",
      decimals: 18,
    },
    rpcUrls: {
      default: {
        http: [
          process.env.NEXT_PUBLIC_BSC_RPC_URL ||
            "https://bsc-dataseed.binance.org/",
        ],
      },
      public: {
        http: ["https://bsc-dataseed.binance.org/"],
      },
    },
    blockExplorers: {
      default: {
        name: "BscScan",
        url: "https://bscscan.com",
      },
    },
    contracts: {
      usd1: "0x8d0D000Ee44948FC98c9B98A4FA4921476f08B0d",
      wrapper: "0x39228EB6452e6880Dee82e55d49468ce6697fB46",
    },
    supportsPermit: true,
  },
  testnet: {
    chainId: 97,
    name: "BNB Smart Chain Testnet",
    network: "testnet",
    currency: {
      name: "tBNB",
      symbol: "tBNB",
      decimals: 18,
    },
    rpcUrls: {
      default: {
        http: [
          process.env.NEXT_PUBLIC_BSC_TESTNET_RPC_URL ||
            "https://data-seed-prebsc-1-s1.binance.org:8545/",
        ],
      },
      public: {
        http: ["https://data-seed-prebsc-1-s1.binance.org:8545/"],
      },
    },
    blockExplorers: {
      default: {
        name: "BscScan Testnet",
        url: "https://testnet.bscscan.com",
      },
    },
    contracts: {
      usd1: "0x004ba8e73b41750084b01edacc08c39662e262af",
      wrapper: "0xb73727c185fc8444a3c31dc5a25556d76f5d8c42",
    },
    supportsPermit: false, // Testnet USD1 doesn't support permit
  },
};

// EIP-712 Domain
export const EIP712_DOMAIN = {
  name: "X402 BSC Wrapper",
  version: "2",
};

// Transaction types for EIP-712
export const GASLESS_TRANSFER_TYPE = {
  TransferWithAuthorization: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "validAfter", type: "uint256" },
    { name: "validBefore", type: "uint256" },
    { name: "nonce", type: "bytes32" },
  ],
};

// USD1 Permit type for EIP-2612
export const PERMIT_TYPE = {
  Permit: [
    { name: "owner", type: "address" },
    { name: "spender", type: "address" },
    { name: "value", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
};

// USD1 Domain for mainnet
export const USD1_DOMAIN = {
  name: "World Liberty Financial USD",
  version: "1",
  chainId: 56,
  verifyingContract: "0x8d0D000Ee44948FC98c9B98A4FA4921476f08B0d",
};

// Time constants
export const SIGNATURE_VALIDITY = 3600; // 1 hour
export const PERMIT_DEADLINE = 3600; // 1 hour

// UI Messages
export const MESSAGES = {
  CONNECTING: "Connecting to wallet...",
  SIGNING: "Please sign the transaction in your wallet...",
  SENDING: "Sending transaction to network...",
  CONFIRMING: "Waiting for confirmation...",
  SUCCESS: "Transfer completed successfully! 🎉",
  ERROR: {
    NO_WALLET: "Please install MetaMask to continue",
    WRONG_NETWORK: "Please switch to BSC",
    INVALID_ADDRESS: "Please enter a valid BSC address",
    INVALID_AMOUNT: "Please enter a valid amount",
    INSUFFICIENT_BALANCE: "Insufficient USD1 balance",
    TRANSACTION_FAILED: "Transaction failed. Please try again.",
    USER_REJECTED: "Transaction cancelled by user",
    MINIMUM_AMOUNT: "Minimum transfer amount is 0.01 USD1",
    SELF_TRANSFER: "Cannot send to yourself",
  },
};

// Regex patterns
export const PATTERNS = {
  ETH_ADDRESS: /^0x[a-fA-F0-9]{40}$/,
  AMOUNT: /^\d+(\.\d{0,18})?$/,
};

// Transaction status
export const TX_STATUS = {
  IDLE: "idle",
  SIGNING: "signing",
  SENDING: "sending",
  CONFIRMING: "confirming",
  SUCCESS: "success",
  ERROR: "error",
};

// Rate limiting
export const RATE_LIMIT = {
  WINDOW: 60000, // 1 minute
  MAX_REQUESTS: 10,
};

// Utils
export const formatAddress = (address: string): string => {
  if (!address) return "";
  return `${address.substring(0, 6)}...${address.substring(38)}`;
};

export const formatAmount = (amount: string | number, decimals = 2): string => {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "0.00";
  return num.toFixed(decimals);
};

export const isValidAddress = (address: string): boolean => {
  return PATTERNS.ETH_ADDRESS.test(address);
};

export const isValidAmount = (amount: string): boolean => {
  if (!PATTERNS.AMOUNT.test(amount)) return false;
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0;
};

export const getExplorerUrl = (
  txHash: string,
  network = DEFAULT_NETWORK
): string => {
  const explorer =
    NETWORKS[network as keyof typeof NETWORKS].blockExplorers.default.url;
  return `${explorer}/tx/${txHash}`;
};

export const getAddressExplorerUrl = (
  address: string,
  network = DEFAULT_NETWORK
): string => {
  const explorer =
    NETWORKS[network as keyof typeof NETWORKS].blockExplorers.default.url;
  return `${explorer}/address/${address}`;
};
