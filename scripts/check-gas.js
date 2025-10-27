#!/usr/bin/env node

/**
 * Standalone gas price checker for BSC
 *
 * Usage: node check-gas.js [network]
 * Example: node check-gas.js bsc
 */

const { ethers } = require("ethers");

const NETWORKS = {
  bsc: {
    name: "BSC Mainnet",
    rpc: "https://bsc-rpc.publicnode.com",
    explorer: "https://bscscan.com/gastracker",
  },
  "bsc-testnet": {
    name: "BSC Testnet",
    rpc: "https://bsc-testnet-rpc.publicnode.com",
    explorer: "https://testnet.bscscan.com",
  },
};

async function checkGasPrice(network = "bsc") {
  const config = NETWORKS[network];
  if (!config) {
    console.error(`❌ Network '${network}' not supported`);
    console.log("   Available: bsc, bsc-testnet");
    process.exit(1);
  }

  console.log(`\n🔍 Checking gas price on ${config.name}...`);
  console.log(`   RPC: ${config.rpc}`);

  try {
    const provider = new ethers.JsonRpcProvider(config.rpc);
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice;
    const gasPriceGwei = Number(ethers.formatUnits(gasPrice, "gwei"));

    // Get block number for reference
    const blockNumber = await provider.getBlockNumber();

    console.log(`\n📊 Current Gas Price:`);
    console.log(`   Block: #${blockNumber}`);
    console.log(`   Gas Price: ${gasPriceGwei.toFixed(2)} gwei`);
    console.log(`   Wei: ${gasPrice.toString()}`);

    // Cost estimates for different operations
    console.log(`\n💰 Estimated Costs:`);

    const operations = [
      { name: "Deploy Wrapper", gas: 1500000 },
      { name: "Transfer (wrapper)", gas: 150000 },
      { name: "Approve USD1", gas: 50000 },
      { name: "Simple Transfer", gas: 21000 },
    ];

    const bnbPrice = network === "bsc" ? 600 : 1; // Approximate

    operations.forEach((op) => {
      const costBNB = (op.gas * Number(gasPrice)) / 1e18;
      const costUSD = costBNB * bnbPrice;

      console.log(`   ${op.name}:`);
      console.log(`     Gas: ${op.gas.toLocaleString()} units`);
      console.log(`     Cost: ${costBNB.toFixed(6)} BNB`);
      if (network === "bsc") {
        console.log(`     USD: $${costUSD.toFixed(2)}`);
      }
    });

    // Recommendation
    console.log(`\n📈 Recommendation:`);

    let rating = "";
    let advice = "";

    if (network === "bsc") {
      if (gasPriceGwei <= 3) {
        rating = "⭐⭐⭐⭐⭐ EXCELLENT";
        advice = "Perfect time to deploy!";
      } else if (gasPriceGwei <= 5) {
        rating = "⭐⭐⭐⭐ GOOD";
        advice = "Good time for transactions";
      } else if (gasPriceGwei <= 8) {
        rating = "⭐⭐⭐ MODERATE";
        advice = "Acceptable, but could be better";
      } else if (gasPriceGwei <= 15) {
        rating = "⭐⭐ HIGH";
        advice = "Consider waiting if not urgent";
      } else {
        rating = "⭐ VERY HIGH";
        advice = "Wait for better prices unless critical";
      }
    } else {
      rating = "✅ TESTNET";
      advice = "Free to use - go ahead!";
    }

    console.log(`   Rating: ${rating}`);
    console.log(`   Advice: ${advice}`);

    // Historical context
    console.log(`\n📜 Historical Context:`);
    console.log(`   Typical Low: 3 gwei`);
    console.log(`   Typical Average: 5 gwei`);
    console.log(`   Typical High: 10+ gwei`);

    // Best times
    console.log(`\n⏰ Best Times (Generally):`);
    console.log(`   • Weekends`);
    console.log(`   • 2-6 AM UTC`);
    console.log(`   • During market downturns`);

    console.log(`\n🔗 Gas Tracker: ${config.explorer}`);

    // Auto-refresh option
    if (process.argv.includes("--watch")) {
      console.log(`\n🔄 Refreshing in 30 seconds... (Ctrl+C to stop)`);
      setTimeout(() => checkGasPrice(network), 30000);
    }
  } catch (error) {
    console.error(`\n❌ Error checking gas price:`, error.message);
    console.log(`\n💡 Tips:`);
    console.log(`   • Check your internet connection`);
    console.log(`   • Try a different RPC endpoint`);
    console.log(`   • Visit ${config.explorer} directly`);
    process.exit(1);
  }
}

// Parse arguments
const args = process.argv.slice(2);
const network = args.find((arg) => !arg.startsWith("--")) || "bsc";

// Show help
if (args.includes("--help")) {
  console.log(`
BSC Gas Price Checker

Usage: node check-gas.js [network] [options]

Networks:
  bsc         BSC Mainnet (default)
  bsc-testnet BSC Testnet

Options:
  --watch     Auto-refresh every 30 seconds
  --help      Show this help message

Examples:
  node check-gas.js                    # Check BSC mainnet
  node check-gas.js bsc-testnet       # Check testnet
  node check-gas.js bsc --watch       # Watch mainnet prices
  `);
  process.exit(0);
}

// Run checker
checkGasPrice(network).catch(console.error);
