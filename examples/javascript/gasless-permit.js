/**
 * Gasless Transfer with Permit Example
 *
 * Shows how to use EIP-2612 permit for completely gasless transactions
 * User only signs messages, facilitator pays all gas
 */

const { ethers } = require("ethers");
require("dotenv").config();

// Configuration
const WRAPPER_ADDRESS = "0x6F212f443Ba6BD5aeeF87e37DEe2480F95b75a36";
const USD1_ADDRESS = "0x8d0D000Ee44948FC98c9B98A4FA4921476f08B0d";
const BSC_RPC = "https://bsc-rpc.publicnode.com";

// ABIs
const WRAPPER_ABI = [
  "function transferWithAuthorization(address from, address to, uint256 value, uint256 validAfter, uint256 validBefore, bytes32 nonce, bytes signature)",
];

const USD1_ABI = [
  "function nonces(address) view returns (uint256)",
  "function DOMAIN_SEPARATOR() view returns (bytes32)",
];

/**
 * User creates signatures (no gas needed)
 */
async function createGaslessSignatures(userWallet, recipient, amount) {
  console.log("\n🖊️ Creating gasless signatures...");

  // Parameters
  const nonce = ethers.hexlify(ethers.randomBytes(32));
  const validAfter = Math.floor(Date.now() / 1000) - 60;
  const validBefore = Math.floor(Date.now() / 1000) + 3600;
  const deadline = Math.floor(Date.now() / 1000) + 3600;

  // Part 1: X402 Authorization Signature
  const x402Domain = {
    name: "X402 BSC Wrapper",
    version: "2",
    chainId: 56,
    verifyingContract: WRAPPER_ADDRESS,
  };

  const x402Types = {
    TransferWithAuthorization: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
      { name: "validAfter", type: "uint256" },
      { name: "validBefore", type: "uint256" },
      { name: "nonce", type: "bytes32" },
    ],
  };

  const x402Message = {
    from: userWallet.address,
    to: recipient,
    value: amount,
    validAfter,
    validBefore,
    nonce,
  };

  const x402Signature = await userWallet.signTypedData(
    x402Domain,
    x402Types,
    x402Message
  );
  console.log("   ✅ X402 signature created");

  // Part 2: EIP-2612 Permit Signature
  const usd1 = new ethers.Contract(USD1_ADDRESS, USD1_ABI, userWallet.provider);
  const permitNonce = await usd1.nonces(userWallet.address);

  const permitDomain = {
    name: "World Liberty Financial USD", // USD1 name
    version: "1",
    chainId: 56,
    verifyingContract: USD1_ADDRESS,
  };

  const permitTypes = {
    Permit: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ],
  };

  const permitMessage = {
    owner: userWallet.address,
    spender: WRAPPER_ADDRESS,
    value: amount,
    nonce: permitNonce,
    deadline,
  };

  const permitSignature = await userWallet.signTypedData(
    permitDomain,
    permitTypes,
    permitMessage
  );
  console.log("   ✅ Permit signature created");

  // Combine signatures: x402(65) + permit(65) + deadline(32) = 162 bytes
  const deadlineHex = ethers.toBeHex(deadline, 32).slice(2);
  const combinedSignature =
    "0x" + x402Signature.slice(2) + permitSignature.slice(2) + deadlineHex;

  console.log(
    `   📦 Combined signature: ${(combinedSignature.length - 2) / 2} bytes`
  );

  return {
    from: userWallet.address,
    to: recipient,
    value: amount,
    validAfter,
    validBefore,
    nonce,
    signature: combinedSignature,
  };
}

/**
 * Facilitator executes transaction (pays gas)
 */
async function executeFacilitatorTransaction(facilitatorWallet, signatureData) {
  console.log("\n🏢 Facilitator executing transaction...");

  const wrapper = new ethers.Contract(
    WRAPPER_ADDRESS,
    WRAPPER_ABI,
    facilitatorWallet
  );

  // Estimate gas
  const gasEstimate = await wrapper.transferWithAuthorization.estimateGas(
    signatureData.from,
    signatureData.to,
    signatureData.value,
    signatureData.validAfter,
    signatureData.validBefore,
    signatureData.nonce,
    signatureData.signature
  );

  console.log(`   ⛽ Estimated gas: ${gasEstimate.toString()} units`);

  // Execute transaction
  const tx = await wrapper.transferWithAuthorization(
    signatureData.from,
    signatureData.to,
    signatureData.value,
    signatureData.validAfter,
    signatureData.validBefore,
    signatureData.nonce,
    signatureData.signature
  );

  console.log(`   📝 Transaction: ${tx.hash}`);

  const receipt = await tx.wait();
  console.log(`   ✅ Confirmed in block ${receipt.blockNumber}`);
  console.log(
    `   💸 Gas paid by facilitator: ${receipt.gasUsed.toString()} units`
  );

  return receipt;
}

/**
 * Main gasless flow demonstration
 */
async function main() {
  // Setup
  const provider = new ethers.JsonRpcProvider(BSC_RPC);

  // User wallet (doesn't need BNB!)
  const userPrivateKey =
    process.env.USER_PRIVATE_KEY || ethers.Wallet.createRandom().privateKey;
  const userWallet = new ethers.Wallet(userPrivateKey, provider);

  // Facilitator wallet (needs BNB for gas)
  const facilitatorPrivateKey =
    process.env.FACILITATOR_PRIVATE_KEY || process.env.PRIVATE_KEY;
  if (!facilitatorPrivateKey) {
    console.error("❌ Set FACILITATOR_PRIVATE_KEY in .env");
    return;
  }
  const facilitatorWallet = new ethers.Wallet(facilitatorPrivateKey, provider);

  console.log("=".repeat(60));
  console.log("GASLESS TRANSFER DEMONSTRATION");
  console.log("=".repeat(60));
  console.log("\n👤 User:", userWallet.address);
  console.log("🏢 Facilitator:", facilitatorWallet.address);

  // Check balances
  const userBNB = await provider.getBalance(userWallet.address);
  const facilitatorBNB = await provider.getBalance(facilitatorWallet.address);

  console.log(
    `\n💎 User BNB: ${ethers.formatEther(userBNB)} (doesn't need any!)`
  );
  console.log(`💎 Facilitator BNB: ${ethers.formatEther(facilitatorBNB)}`);

  if (facilitatorBNB < ethers.parseEther("0.001")) {
    console.error("❌ Facilitator needs BNB for gas!");
    return;
  }

  // Transfer parameters
  const recipient = ethers.getAddress(
    "0x742d35cc6634c0532925a3b844bc9e7595f0beb9"
  );
  const amount = ethers.parseUnits("1.0", 18); // 1 USD1

  console.log(`\n📋 Transfer Details:`);
  console.log(`   To: ${recipient}`);
  console.log(`   Amount: 1.0 USD1`);

  // Step 1: User creates signatures (no gas!)
  const signatureData = await createGaslessSignatures(
    userWallet,
    recipient,
    amount
  );

  console.log("\n✨ User part complete! No gas spent!");
  console.log("   User can now send signature to facilitator...");

  // Step 2: Facilitator executes (pays gas)
  await executeFacilitatorTransaction(facilitatorWallet, signatureData);

  console.log("\n" + "=".repeat(60));
  console.log("✅ GASLESS TRANSFER COMPLETE!");
  console.log("User paid: 0 BNB");
  console.log("Facilitator paid for execution");
  console.log("=".repeat(60));
}

// Run example
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  });
