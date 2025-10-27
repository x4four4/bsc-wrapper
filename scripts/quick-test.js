/**
 * Quick Test - Check if the contract is working
 */

const { ethers } = require("ethers");

async function quickTest() {
  const WRAPPER = "0x9C21afb2B9C04aD3E31868234AD94D5b895c5e07";
  const provider = new ethers.JsonRpcProvider(
    "https://data-seed-prebsc-1-s1.binance.org:8545"
  );

  console.log("\n🔍 QUICK CONTRACT TEST");
  console.log("=".repeat(40));

  const wrapper = new ethers.Contract(
    WRAPPER,
    [
      "function name() view returns (string)",
      "function version() view returns (string)",
      "function token() view returns (address)",
    ],
    provider
  );

  try {
    const name = await wrapper.name();
    const version = await wrapper.version();
    const token = await wrapper.token();

    console.log("✅ Contract is ONLINE!");
    console.log("   Name:", name);
    console.log("   Version:", version);
    console.log("   USD1 Token:", token);
    console.log("\n🔗 View on BscScan:");
    console.log("   https://testnet.bscscan.com/address/" + WRAPPER);
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

quickTest();
