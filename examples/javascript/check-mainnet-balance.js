/**
 * Check USD1 Balance on BSC Mainnet
 *
 * Usage:
 * node check-mainnet-balance.js [address]
 * or
 * PRIVATE_KEY=0x... node check-mainnet-balance.js
 */

const { ethers } = require("ethers");
require("dotenv").config();

const USD1_ADDRESS = "0x8d0D000Ee44948FC98c9B98A4FA4921476f08B0d";
const WRAPPER_ADDRESS = "0x6F212f443Ba6BD5aeeF87e37DEe2480F95b75a36";
const BSC_MAINNET_RPC = "https://bsc-rpc.publicnode.com";

async function checkBalance(address) {
  console.log("\n💰 BSC Mainnet Balance Check\n");
  console.log("=".repeat(50));

  const provider = new ethers.JsonRpcProvider(BSC_MAINNET_RPC);

  // Check address
  if (!address) {
    if (process.env.PRIVATE_KEY) {
      const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
      address = wallet.address;
      console.log(`📱 Your Wallet: ${address}`);
    } else if (process.argv[2]) {
      address = process.argv[2];
      console.log(`📍 Checking: ${address}`);
    } else {
      console.log("❌ No address provided!");
      console.log("\nUsage:");
      console.log("  node check-mainnet-balance.js 0xYourAddress");
      console.log("  PRIVATE_KEY=0x... node check-mainnet-balance.js");
      return;
    }
  } else {
    console.log(`📍 Address: ${address}`);
  }

  console.log("");

  // USD1 contract
  const usd1 = new ethers.Contract(
    USD1_ADDRESS,
    [
      "function balanceOf(address) view returns (uint256)",
      "function allowance(address owner, address spender) view returns (uint256)",
      "function decimals() view returns (uint8)",
      "function symbol() view returns (string)",
    ],
    provider
  );

  try {
    // Get BNB balance
    const bnbBalance = await provider.getBalance(address);
    console.log(`💎 BNB: ${ethers.formatEther(bnbBalance)} BNB`);

    const bnbPrice = 700; // Approximate
    const bnbValue = Number(ethers.formatEther(bnbBalance)) * bnbPrice;
    console.log(`   ≈ $${bnbValue.toFixed(2)} USD`);

    // Get USD1 balance
    const usd1Balance = await usd1.balanceOf(address);
    const decimals = await usd1.decimals();
    const symbol = await usd1.symbol();

    console.log(
      `\n💵 ${symbol}: ${ethers.formatUnits(usd1Balance, decimals)} ${symbol}`
    );

    // Check allowance for wrapper
    const allowance = await usd1.allowance(address, WRAPPER_ADDRESS);
    console.log(
      `\n🔐 Wrapper Approval: ${ethers.formatUnits(
        allowance,
        decimals
      )} ${symbol}`
    );

    if (allowance > 0n) {
      console.log("   ✅ Wrapper is approved!");
    } else {
      console.log("   ⚠️  Wrapper not approved yet");
    }

    // Gas estimate
    console.log("\n⛽ Gas Costs:");
    const gasPrice = await provider.getFeeData();
    console.log(
      `   Current: ${ethers.formatUnits(gasPrice.gasPrice, "gwei")} gwei`
    );

    const approvalCost = 50000n * gasPrice.gasPrice;
    const transferCost = 150000n * gasPrice.gasPrice;

    console.log(`   Approval: ~${ethers.formatEther(approvalCost)} BNB`);
    console.log(`   Transfer: ~${ethers.formatEther(transferCost)} BNB`);

    // Links
    console.log("\n🔗 Useful Links:");
    console.log(`   Wallet: https://bscscan.com/address/${address}`);
    console.log(`   USD1: https://bscscan.com/token/${USD1_ADDRESS}`);
    console.log(`   Wrapper: https://bscscan.com/address/${WRAPPER_ADDRESS}`);

    // Instructions
    if (usd1Balance === 0n) {
      console.log("\n📋 How to get USD1:");
      console.log("1. Buy on PancakeSwap: https://pancakeswap.finance");
      console.log("2. Bridge from Ethereum");
      console.log("3. Buy on exchanges that support BSC");
    }

    if (bnbBalance < ethers.parseEther("0.001")) {
      console.log(
        "\n⚠️  Low BNB for gas! Get more BNB to pay for transactions."
      );
    }
  } catch (error) {
    console.error("\n❌ Error:", error.message);
  }

  console.log("\n" + "=".repeat(50));
}

// Main
async function main() {
  const address = process.argv[2] || null;
  await checkBalance(address);
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { checkBalance };
