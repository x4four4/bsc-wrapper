import {
  EIP712_DOMAIN,
  GASLESS_TRANSFER_TYPE,
  NETWORKS,
  PERMIT_DEADLINE,
  PERMIT_TYPE,
  SIGNATURE_VALIDITY,
  USD1_DOMAIN,
} from "@/app/config/constants";
import type { Network } from "@/app/types";
import { ethers } from "ethers";

// Generate a random nonce
export function generateNonce(): string {
  const randomBytes = ethers.randomBytes(32);
  return ethers.hexlify(randomBytes);
}

// Get signer from window.ethereum
async function getSigner() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask not found");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  return await provider.getSigner();
}

// Create EIP-712 signature for gasless transfer
async function signGaslessTransfer(
  from: string,
  to: string,
  amount: string,
  nonce: string,
  network: Network
) {
  console.log("🔏 Creating gasless transfer signature...");

  const signer = await getSigner();
  const amountWei = ethers.parseUnits(amount, 18);
  const currentTime = Math.floor(Date.now() / 1000);
  const validAfter = currentTime - 60; // Valid from 1 minute ago
  const validBefore = currentTime + SIGNATURE_VALIDITY;

  const domain = {
    name: EIP712_DOMAIN.name,
    version: EIP712_DOMAIN.version,
    chainId: network.chainId,
    verifyingContract: network.contracts.wrapper,
  };

  const message = {
    from,
    to,
    value: amountWei.toString(),
    validAfter,
    validBefore,
    nonce,
  };

  console.log("   Domain:", domain);
  console.log("   Message:", message);

  try {
    const signature = await signer.signTypedData(
      domain,
      GASLESS_TRANSFER_TYPE,
      message
    );

    const { v, r, s } = ethers.Signature.from(signature);

    console.log("   ✅ Signature created successfully");

    return {
      signature,
      v,
      r,
      s,
      validAfter,
      validBefore,
      nonce,
    };
  } catch (error) {
    console.error("   ❌ Failed to sign:", error);
    throw error;
  }
}

// Create EIP-2612 permit signature for USD1
async function signPermit(
  owner: string,
  spender: string,
  amount: string,
  network: Network
) {
  console.log("🔏 Creating permit signature...");

  const signer = await getSigner();
  const provider = signer.provider;
  if (!provider) {
    throw new Error("No provider found");
  }

  const amountWei = ethers.parseUnits(amount, 18);
  const currentTime = Math.floor(Date.now() / 1000);
  const deadline = currentTime + PERMIT_DEADLINE;

  // Get nonce from USD1 contract
  const usd1Contract = new ethers.Contract(
    network.contracts.usd1,
    ["function nonces(address owner) view returns (uint256)"],
    provider
  );

  let nonce;
  try {
    nonce = await usd1Contract.nonces(owner);
    console.log("   Current permit nonce:", nonce.toString());
  } catch (error) {
    console.log("   Failed to get nonce, using 0");
    nonce = BigInt(0);
  }

  const domain = {
    ...USD1_DOMAIN,
    chainId: network.chainId,
    verifyingContract: network.contracts.usd1,
  };

  const message = {
    owner,
    spender,
    value: amountWei.toString(),
    nonce: nonce.toString(),
    deadline,
  };

  console.log("   Domain:", domain);
  console.log("   Message:", message);

  try {
    const signature = await signer.signTypedData(domain, PERMIT_TYPE, message);
    const { v, r, s } = ethers.Signature.from(signature);

    console.log("   ✅ Permit signature created successfully");

    return {
      signature,
      v,
      r,
      s,
      deadline,
      nonce: nonce.toString(),
    };
  } catch (error) {
    console.error("   ❌ Failed to sign permit:", error);
    throw error;
  }
}

// Main function to create all necessary signatures
export async function createGaslessSignatures(
  from: string,
  to: string,
  amount: string,
  networkName: string = "mainnet"
) {
  console.log("\n🚀 Creating gasless transfer signatures");
  console.log("   From:", from);
  console.log("   To:", to);
  console.log("   Amount:", amount, "USD1");
  console.log("   Network:", networkName);

  const network = NETWORKS[
    networkName as keyof typeof NETWORKS
  ] as unknown as Network;
  if (!network) {
    throw new Error(`Invalid network: ${networkName}`);
  }

  // Generate nonce for gasless transfer
  const nonce = generateNonce();
  console.log("   Nonce:", nonce);

  // Create gasless transfer signature
  const transferSig = await signGaslessTransfer(
    from,
    to,
    amount,
    nonce,
    network
  );

  // Create permit signature if network supports it
  let permitSig = null;
  if (network.supportsPermit) {
    console.log("\n📝 Network supports permit, creating permit signature...");
    permitSig = await signPermit(
      from,
      network.contracts.wrapper,
      amount,
      network
    );
  } else {
    console.log(
      "\n⚠️ Network doesn't support permit, skipping permit signature"
    );
  }

  const result = {
    from,
    to,
    amount,
    network: networkName,
    transfer: {
      validAfter: transferSig.validAfter,
      validBefore: transferSig.validBefore,
      nonce: transferSig.nonce,
      v: transferSig.v,
      r: transferSig.r,
      s: transferSig.s,
    },
    permit: permitSig
      ? {
          deadline: permitSig.deadline,
          v: permitSig.v,
          r: permitSig.r,
          s: permitSig.s,
        }
      : null,
  };

  console.log("\n✨ All signatures created successfully!");
  return result;
}

// Verify signature (for debugging)
export async function verifySignature(
  from: string,
  to: string,
  amount: string,
  validAfter: number,
  validBefore: number,
  nonce: string,
  signature: string,
  network: Network
) {
  const amountWei = ethers.parseUnits(amount, 18);

  const domain = {
    name: EIP712_DOMAIN.name,
    version: EIP712_DOMAIN.version,
    chainId: network.chainId,
    verifyingContract: network.contracts.wrapper,
  };

  const message = {
    from,
    to,
    value: amountWei.toString(),
    validAfter,
    validBefore,
    nonce,
  };

  const recoveredAddress = ethers.verifyTypedData(
    domain,
    GASLESS_TRANSFER_TYPE,
    message,
    signature
  );

  return recoveredAddress.toLowerCase() === from.toLowerCase();
}

// Format signature for display
export function formatSignature(signature: string): string {
  if (!signature) return "";
  if (signature.length <= 20) return signature;
  return `${signature.substring(0, 10)}...${signature.substring(signature.length - 8)}`;
}

// Check if window.ethereum is available
export function isMetaMaskAvailable(): boolean {
  return typeof window !== "undefined" && !!window.ethereum;
}
