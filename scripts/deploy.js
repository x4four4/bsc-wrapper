const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  // Get network name
  const network = hre.network.name;
  console.log("\n🚀 Deploying X402BSCWrapper to", network);
  console.log("=".repeat(60));

  // Get deployer
  const [deployer] = await hre.ethers.getSigners();
  console.log("📱 Deployer:", deployer.address);

  // Check balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance:", hre.ethers.formatEther(balance), "BNB");

  // Get USD1 address from environment
  const USD1_ADDRESS =
    network === "bsc"
      ? process.env.USD1_MAINNET || "0x8d0D000Ee44948FC98c9B98A4FA4921476f08B0d"
      : process.env.USD1_TESTNET ||
        "0x0000000000000000000000000000000000000000";

  if (USD1_ADDRESS === "0x0000000000000000000000000000000000000000") {
    console.error("❌ USD1 address not configured for", network);
    process.exit(1);
  }

  console.log("💵 USD1 Address:", USD1_ADDRESS);

  // Check gas price
  const feeData = await hre.ethers.provider.getFeeData();
  const gasPrice = feeData.gasPrice;
  console.log(
    "⛽ Gas Price:",
    hre.ethers.formatUnits(gasPrice, "gwei"),
    "gwei"
  );

  // Estimate deployment cost
  const estimatedGas = 3000000n; // Conservative estimate
  const estimatedCost = (estimatedGas * gasPrice) / 10n ** 18n;
  console.log(
    "💸 Estimated Cost:",
    Number(estimatedCost * 10000n) / 10000,
    "BNB"
  );

  if (balance < estimatedGas * gasPrice) {
    console.error("❌ Insufficient balance for deployment!");
    process.exit(1);
  }

  // Deploy
  console.log("\n📦 Compiling contracts...");
  await hre.run("compile");

  console.log("🔨 Deploying X402BSCWrapper...");
  const X402BSCWrapper = await hre.ethers.getContractFactory("X402BSCWrapper");

  const wrapper = await X402BSCWrapper.deploy(USD1_ADDRESS, {
    gasPrice: gasPrice,
    gasLimit: estimatedGas,
  });

  console.log("⏳ Waiting for deployment...");
  await wrapper.waitForDeployment();

  const wrapperAddress = await wrapper.getAddress();
  console.log("✅ X402BSCWrapper deployed to:", wrapperAddress);

  // Wait for confirmations
  console.log("⏳ Waiting for confirmations...");
  await wrapper.deploymentTransaction().wait(5);
  console.log("✅ Confirmed!");

  // Save deployment info
  const deploymentInfo = {
    network,
    address: wrapperAddress,
    usd1Address: USD1_ADDRESS,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    transactionHash: wrapper.deploymentTransaction().hash,
    blockNumber: wrapper.deploymentTransaction().blockNumber,
    gasPrice: gasPrice.toString(),
    compiler: "0.8.19",
    optimizer: true,
  };

  // Save deployment artifacts
  const deploymentsDir = path.join(
    __dirname,
    "..",
    "deployments",
    network === "bsc" ? "mainnet" : "testnet"
  );

  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save deployment info
  fs.writeFileSync(
    path.join(deploymentsDir, "deployment-info.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  // Save ABI and address
  const artifact = await hre.artifacts.readArtifact("X402BSCWrapper");
  fs.writeFileSync(
    path.join(deploymentsDir, "X402BSCWrapper.json"),
    JSON.stringify(
      {
        address: wrapperAddress,
        abi: artifact.abi,
        bytecode: artifact.bytecode,
      },
      null,
      2
    )
  );

  console.log("\n📁 Deployment artifacts saved to:", deploymentsDir);

  // Verification reminder
  console.log("\n" + "=".repeat(60));
  console.log("📝 Next Steps:");
  console.log("1. Verify on BscScan:");
  console.log(`   npm run verify:${network === "bsc" ? "mainnet" : "testnet"}`);
  console.log("2. Update .env with contract address:");
  console.log(
    `   WRAPPER_${network.toUpperCase().replace("-", "_")}=${wrapperAddress}`
  );
  console.log("3. Test the deployment:");
  console.log(
    `   npx hardhat run scripts/test-deployment.js --network ${network}`
  );

  console.log("\n✨ Deployment complete!");
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
