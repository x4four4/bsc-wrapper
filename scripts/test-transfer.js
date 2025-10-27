/**
 * Real Test Script - Transfer with X402BSCWrapper
 *
 * This script allows you to test the wrapper by sending USD1 on BSC Testnet
 */

const { ethers } = require("ethers");
const readline = require("readline");
require("dotenv").config();

// Configuration
const WRAPPER_ADDRESS = "0xb73727c185fc8444a3c31dc5a25556d76f5d8c42"; // Updated testnet deployment

const USD1_TESTNET = "0x004ba8e73b41750084b01edacc08c39662e262af";
const BSC_TESTNET_RPC = "https://data-seed-prebsc-1-s1.binance.org:8545";

// Required ABIs
const WRAPPER_ABI = [
  "function transferWithAuthorization(address from, address to, uint256 value, uint256 validAfter, uint256 validBefore, bytes32 nonce, bytes signature)",
  "function authorizationState(address, bytes32) view returns (bool)",
  "function name() view returns (string)",
  "function version() view returns (string)",
];

const USD1_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
];

// User input interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("🚀 X402 BSC WRAPPER - REAL TRANSFER TEST");
  console.log("=".repeat(60));
  console.log("\n📍 Network: BSC Testnet");
  console.log("📝 Wrapper Contract:", WRAPPER_ADDRESS);
  console.log("💵 USD1 Token:", USD1_TESTNET);

  // Check private key
  if (!process.env.PRIVATE_KEY) {
    console.error("\n❌ ERROR: Configure PRIVATE_KEY in .env file");
    console.log("\n📚 Instructions:");
    console.log("1. Create a .env file in project root");
    console.log("2. Add: PRIVATE_KEY=your_private_key_here");
    console.log("3. NEVER share your private key!");
    rl.close();
    return;
  }

  // Connect to network
  const provider = new ethers.JsonRpcProvider(BSC_TESTNET_RPC);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  console.log("\n👤 Your wallet:", wallet.address);

  // Connect to contracts
  const wrapper = new ethers.Contract(WRAPPER_ADDRESS, WRAPPER_ABI, wallet);
  const usd1 = new ethers.Contract(USD1_TESTNET, USD1_ABI, wallet);

  // Check balances
  console.log("\n💰 Checking balances...");

  const bnbBalance = await provider.getBalance(wallet.address);
  console.log("   BNB:", ethers.formatEther(bnbBalance), "BNB");

  const usd1Balance = await usd1.balanceOf(wallet.address);
  const decimals = await usd1.decimals();
  console.log("   USD1:", ethers.formatUnits(usd1Balance, decimals), "USD1");

  // Initial checks
  if (bnbBalance < ethers.parseEther("0.001")) {
    console.error("\n❌ You need at least 0.001 BNB for gas!");
    console.log(
      "💡 Get testnet BNB at: https://www.bnbchain.org/en/testnet-faucet"
    );
    rl.close();
    return;
  }

  if (usd1Balance === 0n) {
    console.error("\n❌ You don't have USD1 on testnet!");
    console.log("💡 You need to get test USD1 first");
    rl.close();
    return;
  }

  // Menu options
  console.log("\n" + "=".repeat(60));
  console.log("📋 CHOOSE AN OPTION:");
  console.log("=".repeat(60));
  console.log("1. Transfer with Approval (traditional method)");
  console.log("2. Gasless Transfer with Permit (user doesn't pay gas)");
  console.log("3. Check authorization status");
  console.log("4. Exit");

  const choice = await question("\nChoice (1-4): ");

  switch (choice) {
    case "1":
      await traditionalTransfer(wallet, wrapper, usd1, decimals);
      break;
    case "2":
      await gaslessTransfer(wallet, wrapper, usd1, decimals);
      break;
    case "3":
      await checkAuthorization(wallet, wrapper);
      break;
    case "4":
      console.log("\n👋 Goodbye!");
      break;
    default:
      console.log("\n❌ Invalid option!");
  }

  rl.close();
}

async function traditionalTransfer(wallet, wrapper, usd1, decimals) {
  console.log("\n🔄 TRADITIONAL TRANSFER (with approval)");
  console.log("-".repeat(40));

  // Get recipient
  const recipient = await question("Recipient address: ");
  if (!ethers.isAddress(recipient)) {
    console.error("❌ Invalid address!");
    return;
  }

  // Get amount
  const amountStr = await question("Amount of USD1 to send: ");
  const amount = ethers.parseUnits(amountStr, decimals);

  console.log("\n📦 Preparing transfer...");
  console.log("   From:", wallet.address);
  console.log("   To:", recipient);
  console.log("   Amount:", amountStr, "USD1");

  // Check existing approval
  const currentAllowance = await usd1.allowance(
    wallet.address,
    WRAPPER_ADDRESS
  );

  if (currentAllowance < amount) {
    console.log("\n✏️ Approving wrapper to spend USD1...");
    const approveTx = await usd1.approve(WRAPPER_ADDRESS, amount);
    console.log("   Tx hash:", approveTx.hash);
    await approveTx.wait();
    console.log("   ✅ Approval confirmed!");
  }

  // Create authorization
  const nonce = ethers.hexlify(ethers.randomBytes(32));
  const validAfter = Math.floor(Date.now() / 1000) - 60;
  const validBefore = Math.floor(Date.now() / 1000) + 3600; // Valid for 1 hour

  // Sign message
  console.log("\n🖊️ Signing authorization...");

  const domain = {
    name: await wrapper.name(),
    version: await wrapper.version(),
    chainId: 97, // BSC Testnet
    verifyingContract: WRAPPER_ADDRESS,
  };

  const types = {
    TransferWithAuthorization: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
      { name: "validAfter", type: "uint256" },
      { name: "validBefore", type: "uint256" },
      { name: "nonce", type: "bytes32" },
    ],
  };

  const message = {
    from: wallet.address,
    to: recipient,
    value: amount,
    validAfter,
    validBefore,
    nonce,
  };

  const signature = await wallet.signTypedData(domain, types, message);
  console.log("   ✅ Signature created!");

  // Execute transfer
  console.log("\n🚀 Executing transfer...");

  try {
    const tx = await wrapper.transferWithAuthorization(
      wallet.address,
      recipient,
      amount,
      validAfter,
      validBefore,
      nonce,
      signature
    );

    console.log("   Tx hash:", tx.hash);
    console.log("   ⏳ Waiting for confirmation...");

    const receipt = await tx.wait();
    console.log("\n✅ TRANSFER COMPLETED!");
    console.log("   Block:", receipt.blockNumber);
    console.log("   Gas used:", receipt.gasUsed.toString());
    console.log(
      "   View on BscScan: https://testnet.bscscan.com/tx/" + tx.hash
    );

    // Check new balance
    const newBalance = await usd1.balanceOf(wallet.address);
    console.log(
      "\n💰 New balance:",
      ethers.formatUnits(newBalance, decimals),
      "USD1"
    );
  } catch (error) {
    console.error("\n❌ Transfer error:", error.message);
  }
}

async function gaslessTransfer(wallet, wrapper, usd1, decimals) {
  console.log("\n✨ GASLESS TRANSFER (with Permit)");
  console.log("-".repeat(40));
  console.log("\n⚠️  NOTE: This mode simulates a gasless transfer.");
  console.log("   In production, a facilitator would pay the gas for you.");

  const recipient = await question("\nRecipient address: ");
  if (!ethers.isAddress(recipient)) {
    console.error("❌ Invalid address!");
    return;
  }

  const amountStr = await question("Amount of USD1 to send: ");
  const amount = ethers.parseUnits(amountStr, decimals);

  console.log("\n📦 Preparing gasless transfer...");
  console.log("   This flow allows users without BNB to send USD1!");

  // Parameters
  const nonce = ethers.hexlify(ethers.randomBytes(32));
  const validAfter = Math.floor(Date.now() / 1000) - 60;
  const validBefore = Math.floor(Date.now() / 1000) + 3600;
  const deadline = Math.floor(Date.now() / 1000) + 3600;

  console.log("\n🖊️ Creating signatures (user doesn't pay gas)...");

  // X402 Signature
  const x402Domain = {
    name: "X402 BSC Wrapper",
    version: "2",
    chainId: 97,
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
    from: wallet.address,
    to: recipient,
    value: amount,
    validAfter,
    validBefore,
    nonce,
  };

  const x402Signature = await wallet.signTypedData(
    x402Domain,
    x402Types,
    x402Message
  );

  console.log("   ✅ X402 signature created");
  console.log("\n⚠️  NOTE: For true gasless transfer,");
  console.log("   we would need to create an EIP-2612 Permit signature too.");
  console.log("   Since testnet USD1 may not support Permit,");
  console.log("   we'll use traditional mode for demonstration.");

  // Execute (in production, the facilitator would do this)
  console.log("\n🏢 Simulating facilitator executing transaction...");

  try {
    const tx = await wrapper.transferWithAuthorization(
      wallet.address,
      recipient,
      amount,
      validAfter,
      validBefore,
      nonce,
      x402Signature
    );

    console.log("   Tx hash:", tx.hash);
    const receipt = await tx.wait();

    console.log("\n✅ GASLESS TRANSFER SIMULATED SUCCESSFULLY!");
    console.log("   In production, you wouldn't pay any gas!");
    console.log(
      "   View on BscScan: https://testnet.bscscan.com/tx/" + tx.hash
    );
  } catch (error) {
    if (error.message.includes("InvalidSignatureLength")) {
      console.log("\n⚠️  Testnet USD1 doesn't support full Permit.");
      console.log("   Use option 1 for traditional transfer.");
    } else {
      console.error("\n❌ Error:", error.message);
    }
  }
}

async function checkAuthorization(wallet, wrapper) {
  console.log("\n🔍 CHECK AUTHORIZATION STATUS");
  console.log("-".repeat(40));

  const address = await question("Address to check (Enter to use yours): ");
  const targetAddress = address || wallet.address;

  const nonceInput = await question("Nonce (bytes32 hex): ");

  try {
    const isUsed = await wrapper.authorizationState(targetAddress, nonceInput);
    console.log("\n📊 Status:");
    console.log("   Address:", targetAddress);
    console.log("   Nonce:", nonceInput);
    console.log("   Status:", isUsed ? "✅ ALREADY USED" : "⭕ AVAILABLE");
  } catch (error) {
    console.error("\n❌ Error:", error.message);
  }
}

// Run
main().catch((error) => {
  console.error("\n❌ Fatal error:", error);
  rl.close();
  process.exit(1);
});
