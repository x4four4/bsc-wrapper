// Server-side contract configuration
// This is used by API routes

export const CONTRACT_CONFIG = {
  mainnet: {
    chainId: 56,
    rpcUrl: process.env.BSC_RPC_URL || "https://bsc-dataseed.binance.org/",
    contracts: {
      usd1: "0x8d0D000Ee44948FC98c9B98A4FA4921476f08B0d",
      wrapper: "0x6F212f443Ba6BD5aeeF87e37DEe2480F95b75a36",
    },
    explorer: "https://bscscan.com",
    supportsPermit: true,
  },
  testnet: {
    chainId: 97,
    rpcUrl:
      process.env.BSC_TESTNET_RPC_URL ||
      "https://data-seed-prebsc-1-s1.binance.org:8545/",
    contracts: {
      usd1: "0x004ba8e73b41750084b01edacc08c39662e262af",
      wrapper: "0x9C21afb2B9C04aD3E31868234AD94D5b895c5e07",
    },
    explorer: "https://testnet.bscscan.com",
    supportsPermit: false,
  },
};

// ABIs for server-side
export const CONTRACT_ABIS = {
  USD1: [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address account) view returns (uint256)",
    "function transfer(address recipient, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function transferFrom(address sender, address recipient, uint256 amount) returns (bool)",
    "function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)",
    "function nonces(address owner) view returns (uint256)",
    "function DOMAIN_SEPARATOR() view returns (bytes32)",
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    "event Approval(address indexed owner, address indexed spender, uint256 value)",
  ],

  WRAPPER: [
    "function DOMAIN_SEPARATOR() view returns (bytes32)",
    "function nonces(address owner) view returns (uint256)",
    "function transferWithAuthorization(address from, address to, uint256 value, uint256 validAfter, uint256 validBefore, bytes32 nonce, bytes calldata signature)",
    "function authorizationState(address account, bytes32 nonce) view returns (bool)",
    "function getPermitData(address owner, uint256 value, uint256 deadline) view returns (bytes32 domainSeparator, uint256 nonce)",
    "event AuthorizationUsed(address indexed authorizer, bytes32 indexed nonce)",
    "event Transfer(address indexed from, address indexed to, uint256 value)",
  ],
};

// Domain configuration for EIP-712
export const DOMAIN_CONFIG = {
  mainnet: {
    wrapper: {
      name: "X402 BSC Wrapper",
      version: "2",
      chainId: 56,
      verifyingContract: "0x6F212f443Ba6BD5aeeF87e37DEe2480F95b75a36",
    },
    usd1: {
      name: "World Liberty Financial USD",
      version: "1",
      chainId: 56,
      verifyingContract: "0x8d0D000Ee44948FC98c9B98A4FA4921476f08B0d",
    },
  },
  testnet: {
    wrapper: {
      name: "X402 BSC Wrapper",
      version: "2",
      chainId: 97,
      verifyingContract: "0x9C21afb2B9C04aD3E31868234AD94D5b895c5e07",
    },
    usd1: {
      name: "World Liberty Financial USD",
      version: "1",
      chainId: 97,
      verifyingContract: "0x004ba8e73b41750084b01edacc08c39662e262af",
    },
  },
};

// Type definitions for EIP-712
export const TYPE_DEFINITIONS = {
  TransferWithAuthorization: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "validAfter", type: "uint256" },
    { name: "validBefore", type: "uint256" },
    { name: "nonce", type: "bytes32" },
  ],
  Permit: [
    { name: "owner", type: "address" },
    { name: "spender", type: "address" },
    { name: "value", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
};

// Get configuration for current network
export function getNetworkConfig() {
  const network = process.env.DEFAULT_NETWORK || "mainnet";
  if (!(network in CONTRACT_CONFIG)) {
    throw new Error(`Invalid network: ${network}`);
  }
  return CONTRACT_CONFIG[network as keyof typeof CONTRACT_CONFIG];
}

// Get domain configuration for current network
export function getDomainConfig() {
  const network = process.env.DEFAULT_NETWORK || "mainnet";
  if (!(network in DOMAIN_CONFIG)) {
    throw new Error(`Invalid network: ${network}`);
  }
  return DOMAIN_CONFIG[network as keyof typeof DOMAIN_CONFIG];
}
