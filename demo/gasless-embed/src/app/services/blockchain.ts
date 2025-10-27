import {
  CONTRACT_ABIS,
  getDomainConfig,
  getNetworkConfig,
  TYPE_DEFINITIONS,
} from "@/app/config/contracts";
import { ethers } from "ethers";

// Initialize provider
function getProvider() {
  const config = getNetworkConfig();
  return new ethers.JsonRpcProvider(config.rpcUrl);
}

// Initialize facilitator wallet
function getFacilitatorWallet() {
  const privateKey = process.env.FACILITATOR_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("FACILITATOR_PRIVATE_KEY not configured");
  }

  const provider = getProvider();
  return new ethers.Wallet(privateKey, provider);
}

// Get USD1 contract instance
export function getUSD1Contract(
  signerOrProvider?: ethers.Provider | ethers.Signer
) {
  const config = getNetworkConfig();
  const providerOrSigner = signerOrProvider || getProvider();

  return new ethers.Contract(
    config.contracts.usd1,
    CONTRACT_ABIS.USD1,
    providerOrSigner
  );
}

// Get Wrapper contract instance
export function getWrapperContract(
  signerOrProvider?: ethers.Provider | ethers.Signer
) {
  const config = getNetworkConfig();
  const providerOrSigner = signerOrProvider || getProvider();

  return new ethers.Contract(
    config.contracts.wrapper,
    CONTRACT_ABIS.WRAPPER,
    providerOrSigner
  );
}

// Get user's USD1 balance
export async function getBalance(address: string): Promise<string> {
  try {
    console.log(`📊 Fetching USD1 balance for ${address}`);

    const usd1Contract = getUSD1Contract();
    const balance = await usd1Contract.balanceOf(address);
    const formatted = ethers.formatUnits(balance, 18);

    console.log(`   Balance: ${formatted} USD1`);
    return formatted;
  } catch (error) {
    console.error("Failed to fetch balance:", error);
    throw error;
  }
}

// Check if nonce has been used
export async function isNonceUsed(
  address: string,
  nonce: string
): Promise<boolean> {
  try {
    const wrapperContract = getWrapperContract();
    return await wrapperContract.authorizationState(address, nonce);
  } catch (error) {
    console.error("Error checking nonce:", error);
    return false;
  }
}

// Verify gasless transfer signature
export async function verifyGaslessSignature(
  from: string,
  to: string,
  amount: string,
  validAfter: number,
  validBefore: number,
  nonce: string,
  v: number,
  r: string,
  s: string
): Promise<boolean> {
  try {
    const amountWei = ethers.parseUnits(amount, 18);
    const domainConfig = getDomainConfig();

    const domain = domainConfig.wrapper;
    const message = {
      from,
      to,
      value: amountWei.toString(),
      validAfter,
      validBefore,
      nonce,
    };

    const signature = ethers.Signature.from({ v, r, s }).serialized;
    const recoveredAddress = ethers.verifyTypedData(
      domain,
      { TransferWithAuthorization: TYPE_DEFINITIONS.TransferWithAuthorization },
      message,
      signature
    );

    return recoveredAddress.toLowerCase() === from.toLowerCase();
  } catch (error) {
    console.error("Signature verification failed:", error);
    return false;
  }
}

// Execute gasless transfer with permit
export async function executeGaslessTransferWithPermit(
  from: string,
  to: string,
  amount: string,
  transfer: {
    validAfter: number;
    validBefore: number;
    nonce: string;
    v: number;
    r: string;
    s: string;
  },
  permit: {
    deadline: number;
    v: number;
    r: string;
    s: string;
  }
) {
  console.log("\n🚀 Executing gasless transfer with permit");
  console.log("   From:", from);
  console.log("   To:", to);
  console.log("   Amount:", amount, "USD1");

  const facilitatorWallet = getFacilitatorWallet();
  const wrapperContract = getWrapperContract(facilitatorWallet);
  const amountWei = ethers.parseUnits(amount, 18);

  try {
    // Build combined signature (162 bytes total)
    // Transfer signature (65 bytes) + Permit signature (65 bytes) + Deadline (32 bytes)
    const transferSig = ethers.Signature.from({
      v: transfer.v,
      r: transfer.r,
      s: transfer.s,
    }).serialized;

    const permitSig = ethers.Signature.from({
      v: permit.v,
      r: permit.r,
      s: permit.s,
    }).serialized;

    const deadlineBytes = ethers.zeroPadValue(
      ethers.toBeHex(permit.deadline),
      32
    );

    const combinedSignature = ethers.concat([
      transferSig,
      permitSig,
      deadlineBytes,
    ]);

    // Estimate gas
    console.log("\n⛽ Estimating gas...");
    const estimatedGas =
      await wrapperContract.transferWithAuthorization.estimateGas(
        from,
        to,
        amountWei,
        transfer.validAfter,
        transfer.validBefore,
        transfer.nonce,
        combinedSignature
      );

    const gasLimit = (estimatedGas * BigInt(120)) / BigInt(100); // Add 20% buffer
    console.log(`   Estimated gas: ${estimatedGas.toString()}`);
    console.log(`   Gas limit: ${gasLimit.toString()}`);

    // Get gas price
    const feeData = await facilitatorWallet.provider?.getFeeData();
    const gasPrice = feeData?.gasPrice || ethers.parseUnits("3", "gwei");
    const estimatedCost = gasLimit * gasPrice;
    console.log(`   Gas price: ${ethers.formatUnits(gasPrice, "gwei")} gwei`);
    console.log(
      `   Estimated cost: ${ethers.formatUnits(estimatedCost, 18)} BNB`
    );

    // Execute transaction
    console.log("\n📤 Sending transaction...");
    const tx = await wrapperContract.transferWithAuthorization(
      from,
      to,
      amountWei,
      transfer.validAfter,
      transfer.validBefore,
      transfer.nonce,
      combinedSignature,
      {
        gasLimit,
        gasPrice,
      }
    );

    console.log(`   Transaction hash: ${tx.hash}`);
    console.log("   Waiting for confirmation...");

    // Wait for confirmation
    const receipt = await tx.wait();
    console.log(`   ✅ Transaction confirmed in block ${receipt.blockNumber}`);
    console.log(`   Gas used: ${receipt.gasUsed.toString()}`);

    return {
      success: true,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
    };
  } catch (error) {
    const txError = error as Error;
    console.error("❌ Transaction failed:", txError);
    throw txError;
  }
}

// Execute gasless transfer without permit
export async function executeGaslessTransfer(
  from: string,
  to: string,
  amount: string,
  transfer: {
    validAfter: number;
    validBefore: number;
    nonce: string;
    v: number;
    r: string;
    s: string;
  }
) {
  console.log("\n🚀 Executing gasless transfer (no permit)");
  console.log("   From:", from);
  console.log("   To:", to);
  console.log("   Amount:", amount, "USD1");

  const facilitatorWallet = getFacilitatorWallet();
  const wrapperContract = getWrapperContract(facilitatorWallet);
  const amountWei = ethers.parseUnits(amount, 18);

  try {
    // Check allowance first
    const usd1Contract = getUSD1Contract();
    const config = getNetworkConfig();
    const allowance = await usd1Contract.allowance(
      from,
      config.contracts.wrapper
    );
    console.log(
      `   Current allowance: ${ethers.formatUnits(allowance, 18)} USD1`
    );

    if (allowance < amountWei) {
      throw new Error(
        "Insufficient USD1 allowance. Please approve the wrapper contract first."
      );
    }

    // Build signature (65 bytes for transfer without permit)
    const transferSig = ethers.Signature.from({
      v: transfer.v,
      r: transfer.r,
      s: transfer.s,
    }).serialized;

    // Estimate gas
    console.log("\n⛽ Estimating gas...");
    const estimatedGas =
      await wrapperContract.transferWithAuthorization.estimateGas(
        from,
        to,
        amountWei,
        transfer.validAfter,
        transfer.validBefore,
        transfer.nonce,
        transferSig
      );

    const gasLimit = (estimatedGas * BigInt(120)) / BigInt(100); // Add 20% buffer
    console.log(`   Estimated gas: ${estimatedGas.toString()}`);
    console.log(`   Gas limit: ${gasLimit.toString()}`);

    // Get gas price
    const feeData = await facilitatorWallet.provider?.getFeeData();
    const gasPrice = feeData?.gasPrice || ethers.parseUnits("3", "gwei");
    const estimatedCost = gasLimit * gasPrice;
    console.log(`   Gas price: ${ethers.formatUnits(gasPrice, "gwei")} gwei`);
    console.log(
      `   Estimated cost: ${ethers.formatUnits(estimatedCost, 18)} BNB`
    );

    // Execute transaction
    console.log("\n📤 Sending transaction...");
    const tx = await wrapperContract.transferWithAuthorization(
      from,
      to,
      amountWei,
      transfer.validAfter,
      transfer.validBefore,
      transfer.nonce,
      transferSig,
      {
        gasLimit,
        gasPrice,
      }
    );

    console.log(`   Transaction hash: ${tx.hash}`);
    console.log("   Waiting for confirmation...");

    // Wait for confirmation
    const receipt = await tx.wait();
    console.log(`   ✅ Transaction confirmed in block ${receipt.blockNumber}`);
    console.log(`   Gas used: ${receipt.gasUsed.toString()}`);

    return {
      success: true,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
    };
  } catch (error) {
    const txError = error as Error;
    console.error("❌ Transaction failed:", txError);
    throw txError;
  }
}

// Get transaction status
export async function getTransactionStatus(txHash: string) {
  try {
    const provider = getProvider();
    const receipt = await provider.getTransactionReceipt(txHash);

    if (!receipt) {
      return {
        status: "pending",
        message: "Transaction is pending",
      };
    }

    if (receipt.status === 0) {
      return {
        status: "failed",
        message: "Transaction failed",
        blockNumber: receipt.blockNumber,
      };
    }

    return {
      status: "success",
      message: "Transaction confirmed",
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
    };
  } catch (error) {
    console.error("Failed to get transaction status:", error);
    throw error;
  }
}

// Estimate gas for transfer
export async function estimateGasForTransfer(
  from: string,
  to: string,
  amount: string,
  hasPermit: boolean
): Promise<{ gasUnits: string; gasPrice: string; totalCost: string }> {
  try {
    const facilitatorWallet = getFacilitatorWallet();
    const wrapperContract = getWrapperContract(facilitatorWallet);
    const amountWei = ethers.parseUnits(amount, 18);

    // Create mock signature data for estimation
    const mockTransfer = {
      validAfter: Math.floor(Date.now() / 1000) - 60,
      validBefore: Math.floor(Date.now() / 1000) + 3600,
      nonce: ethers.hexlify(ethers.randomBytes(32)),
      v: 27,
      r: ethers.hexlify(ethers.randomBytes(32)),
      s: ethers.hexlify(ethers.randomBytes(32)),
    };

    let estimatedGas;
    if (hasPermit) {
      const mockPermit = {
        deadline: Math.floor(Date.now() / 1000) + 3600,
        v: 27,
        r: ethers.hexlify(ethers.randomBytes(32)),
        s: ethers.hexlify(ethers.randomBytes(32)),
      };

      try {
        estimatedGas =
          await wrapperContract.gaslessTransferWithPermit.estimateGas(
            from,
            to,
            amountWei,
            mockTransfer.validAfter,
            mockTransfer.validBefore,
            mockTransfer.nonce,
            mockTransfer.v,
            mockTransfer.r,
            mockTransfer.s,
            mockPermit.deadline,
            mockPermit.v,
            mockPermit.r,
            mockPermit.s
          );
      } catch {
        estimatedGas = BigInt(200000);
      }
    } else {
      try {
        estimatedGas = await wrapperContract.gaslessTransfer.estimateGas(
          from,
          to,
          amountWei,
          mockTransfer.validAfter,
          mockTransfer.validBefore,
          mockTransfer.nonce,
          mockTransfer.v,
          mockTransfer.r,
          mockTransfer.s
        );
      } catch {
        estimatedGas = BigInt(150000); // Default for non-permit transfers
      }
    }

    const gasLimit = (estimatedGas * BigInt(120)) / BigInt(100); // Add 20% buffer

    // Get current gas price
    const feeData = await facilitatorWallet.provider?.getFeeData();
    const gasPrice = feeData?.gasPrice || ethers.parseUnits("3", "gwei");
    const totalCost = gasLimit * gasPrice;

    return {
      gasUnits: gasLimit.toString(),
      gasPrice: ethers.formatUnits(gasPrice, "gwei"),
      totalCost: ethers.formatUnits(totalCost, 18),
    };
  } catch (error) {
    console.error("Failed to estimate gas:", error);
    throw error;
  }
}

// Check facilitator balance
export async function getFacilitatorBalance(): Promise<string> {
  try {
    const facilitatorWallet = getFacilitatorWallet();
    const balance = await facilitatorWallet.provider?.getBalance(
      facilitatorWallet.address
    );
    return ethers.formatUnits(balance || BigInt(0), 18);
  } catch (error) {
    console.error("Failed to get facilitator balance:", error);
    throw error;
  }
}
