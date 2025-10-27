/**
 * Quick Check - BSC Mainnet Contract
 */

const { ethers } = require("ethers");

async function checkMainnet() {
  const WRAPPER = "0x39228EB6452e6880Dee82e55d49468ce6697fB46";
  const USD1 = "0x8d0D000Ee44948FC98c9B98A4FA4921476f08B0d";
  const provider = new ethers.JsonRpcProvider("https://bsc-rpc.publicnode.com");

  console.log("\n" + "=".repeat(60));
  console.log("🔍 BSC MAINNET CONTRACT VERIFICATION");
  console.log("=".repeat(60));

  const wrapper = new ethers.Contract(
    WRAPPER,
    [
      "function name() view returns (string)",
      "function version() view returns (string)",
      "function token() view returns (address)",
    ],
    provider
  );

  const usd1 = new ethers.Contract(
    USD1,
    [
      "function name() view returns (string)",
      "function symbol() view returns (string)",
      "function totalSupply() view returns (uint256)",
      "function decimals() view returns (uint8)",
    ],
    provider
  );

  try {
    // Check Wrapper
    console.log("\n📝 X402 BSC Wrapper:");
    const wrapperName = await wrapper.name();
    const wrapperVersion = await wrapper.version();
    const tokenAddress = await wrapper.token();

    console.log("   ✅ Status: ONLINE");
    console.log("   Name:", wrapperName);
    console.log("   Version:", wrapperVersion);
    console.log("   USD1 Token:", tokenAddress);
    console.log("   Contract:", WRAPPER);

    // Check USD1
    console.log("\n💵 USD1 Token:");
    const tokenName = await usd1.name();
    const tokenSymbol = await usd1.symbol();
    const totalSupply = await usd1.totalSupply();
    const decimals = await usd1.decimals();

    console.log("   Name:", tokenName);
    console.log("   Symbol:", tokenSymbol);
    console.log(
      "   Total Supply:",
      ethers.formatUnits(totalSupply, decimals),
      tokenSymbol
    );
    console.log("   Decimals:", decimals);
    console.log("   Contract:", USD1);

    // Useful links
    console.log("\n🔗 BscScan Links:");
    console.log("   Wrapper: https://bscscan.com/address/" + WRAPPER);
    console.log("   USD1: https://bscscan.com/address/" + USD1);
    console.log("\n📖 Interact with contract:");
    console.log("   https://bscscan.com/address/" + WRAPPER + "#writeContract");

    console.log("\n✅ CONTRACT READY FOR USE ON MAINNET!");
    console.log("\n⚠️  To test:");
    console.log("   1. Configure PRIVATE_KEY in .env");
    console.log("   2. Run: node scripts/test-mainnet.js");
    console.log("   3. You'll need real BNB and USD1!");
  } catch (error) {
    console.error("❌ Error:", error.message);
  }

  console.log("\n" + "=".repeat(60));
}

checkMainnet();
