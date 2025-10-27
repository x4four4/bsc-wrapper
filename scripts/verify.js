const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const network = hre.network.name;
  console.log("\n🔍 Verifying X402BSCWrapper on", network);
  console.log("=".repeat(60));

  // Load deployment info
  const deploymentsDir = path.join(
    __dirname,
    "..",
    "deployments",
    network === "bsc" ? "mainnet" : "testnet"
  );
  const deploymentInfoPath = path.join(deploymentsDir, "deployment-info.json");

  if (!fs.existsSync(deploymentInfoPath)) {
    console.error("❌ Deployment info not found!");
    console.error(
      "   Run deploy script first: npm run deploy:" +
        (network === "bsc" ? "mainnet" : "testnet")
    );
    process.exit(1);
  }

  const deploymentInfo = JSON.parse(
    fs.readFileSync(deploymentInfoPath, "utf8")
  );

  console.log("📋 Contract Address:", deploymentInfo.address);
  console.log("💵 USD1 Address:", deploymentInfo.usd1Address);

  // Verify contract
  try {
    console.log("\n⏳ Submitting for verification...");

    await hre.run("verify:verify", {
      address: deploymentInfo.address,
      constructorArguments: [deploymentInfo.usd1Address],
      contract: "contracts/X402BSCWrapper.sol:X402BSCWrapper",
    });

    console.log("✅ Contract verified successfully!");

    // Generate BscScan links
    const explorerUrl =
      network === "bsc"
        ? `https://bscscan.com/address/${deploymentInfo.address}`
        : `https://testnet.bscscan.com/address/${deploymentInfo.address}`;

    console.log("\n🔗 BscScan Links:");
    console.log(`   Contract: ${explorerUrl}`);
    console.log(`   Code: ${explorerUrl}#code`);
    console.log(`   Read: ${explorerUrl}#readContract`);
    console.log(`   Write: ${explorerUrl}#writeContract`);
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("✅ Contract already verified!");
    } else {
      console.error("❌ Verification failed:", error.message);
      console.log("\n💡 Tips:");
      console.log("1. Make sure BSCSCAN_API_KEY is set in .env");
      console.log("2. Wait a few minutes after deployment");
      console.log("3. Check if already verified on BscScan");
    }
  }

  console.log("\n" + "=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
