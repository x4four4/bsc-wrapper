/**
 * GASLESS TEST WITH PERMIT - X402BSCWrapper
 *
 * This script demonstrates how to make completely gasless transfers
 * where the user only signs messages and a facilitator pays the gas.
 *
 */

const { ethers } = require("ethers");
require("dotenv").config();

// Network configuration
const NETWORK = process.env.NETWORK || "testnet"; // "testnet" or "mainnet"

const CONFIG = {
  testnet: {
    wrapper: "0xb73727c185fc8444a3c31dc5a25556d76f5d8c42",
    usd1: "0x004ba8e73b41750084b01edacc08c39662e262af",
    rpc: "https://data-seed-prebsc-1-s1.binance.org:8545",
    chainId: 97,
    explorer: "https://testnet.bscscan.com",
  },
  mainnet: {
    wrapper: "0x39228EB6452e6880Dee82e55d49468ce6697fB46",
    usd1: "0x8d0D000Ee44948FC98c9B98A4FA4921476f08B0d",
    rpc: "https://bsc-rpc.publicnode.com",
    chainId: 56,
    explorer: "https://bscscan.com",
  },
};

const network = CONFIG[NETWORK];

// Required ABIs
const WRAPPER_ABI = [
  "function transferWithAuthorization(address from, address to, uint256 value, uint256 validAfter, uint256 validBefore, bytes32 nonce, bytes signature)",
  "function getPermitData(address owner, uint256 value, uint256 deadline) view returns (bytes32 domainSeparator, uint256 nonce)",
  "function authorizationState(address, bytes32) view returns (bool)",
];

const USD1_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function nonces(address) view returns (uint256)",
  "function DOMAIN_SEPARATOR() view returns (bytes32)",
  "function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)",
];

async function main() {
  console.log("\n" + "=".repeat(70));
  console.log("🚀 GASLESS TEST WITH PERMIT - X402BSCWrapper");
  console.log("=".repeat(70));
  console.log("\n📍 Network:", NETWORK.toUpperCase());
  console.log("📝 Wrapper:", network.wrapper);
  console.log("💵 USD1:", network.usd1);
  console.log("🔗 Explorer:", network.explorer);

  // Connect provider
  const provider = new ethers.JsonRpcProvider(network.rpc);

  // Check private keys
  const userPrivateKey =
    process.env.USER_PRIVATE_KEY || process.env.PRIVATE_KEY;
  const facilitatorPrivateKey =
    process.env.FACILITATOR_PRIVATE_KEY || process.env.PRIVATE_KEY;

  if (!userPrivateKey || !facilitatorPrivateKey) {
    console.error("\n❌ Configure private keys in .env:");
    console.log("   USER_PRIVATE_KEY=... (user who sends USD1)");
    console.log("   FACILITATOR_PRIVATE_KEY=... (who pays the gas)");
    console.log("\n💡 They can be the same key for testing");
    return;
  }

  // Create wallets
  const userWallet = new ethers.Wallet(userPrivateKey, provider);
  const facilitatorWallet = new ethers.Wallet(facilitatorPrivateKey, provider);

  console.log("\n👤 User (sends USD1):", userWallet.address);
  console.log("🏢 Facilitator (pays gas):", facilitatorWallet.address);

  // Connect contracts
  const wrapperAsUser = new ethers.Contract(
    network.wrapper,
    WRAPPER_ABI,
    userWallet
  );
  const wrapperAsFacilitator = new ethers.Contract(
    network.wrapper,
    WRAPPER_ABI,
    facilitatorWallet
  );
  const usd1 = new ethers.Contract(network.usd1, USD1_ABI, userWallet);

  // Check balances
  console.log("\n💰 Checking balances...");

  const userBNB = await provider.getBalance(userWallet.address);
  const userUSD1 = await usd1.balanceOf(userWallet.address);
  const facilitatorBNB = await provider.getBalance(facilitatorWallet.address);
  const decimals = await usd1.decimals();
  const symbol = await usd1.symbol();

  console.log("\n   User:");
  console.log("   - BNB:", ethers.formatEther(userBNB), "(doesn't need any!)");
  console.log("   - " + symbol + ":", ethers.formatUnits(userUSD1, decimals));

  console.log("\n   Facilitator:");
  console.log(
    "   - BNB:",
    ethers.formatEther(facilitatorBNB),
    "(needs for gas!)"
  );

  // Checks
  if (userUSD1 === 0n) {
    console.error("\n❌ User doesn't have USD1!");
    return;
  }

  if (facilitatorBNB < ethers.parseEther("0.001")) {
    console.error("\n❌ Facilitator needs BNB to pay gas!");
    return;
  }

  // Check if USD1 supports Permit
  console.log("\n🔍 Checking Permit support on USD1...");
  try {
    const domainSeparator = await usd1.DOMAIN_SEPARATOR();
    const userNonce = await usd1.nonces(userWallet.address);
    console.log("   ✅ USD1 supports Permit!");
    console.log("   Domain Separator:", domainSeparator.slice(0, 10) + "...");
    console.log("   User's nonce:", userNonce.toString());
  } catch (error) {
    console.error("\n⚠️  USD1 may not fully support Permit");
    console.log("   Error:", error.message);
    console.log("\n💡 Continuing with demonstration...");
  }

  // Configure transfer
  console.log("\n" + "=".repeat(70));
  console.log("📋 GASLESS TRANSFER DEMONSTRATION");
  console.log("=".repeat(70));

  // You can change these values for testing
  const RECIPIENT = ethers.getAddress(
    "0x742d35cc6634c0532925a3b844bc9e7595f0beb9"
  ); // Test address with correct checksum
  const AMOUNT = ethers.parseUnits("0.01", decimals); // 0.01 USD1

  console.log("\n📦 Transfer Parameters:");
  console.log("   From:", userWallet.address);
  console.log("   To:", RECIPIENT);
  console.log("   Amount:", ethers.formatUnits(AMOUNT, decimals), symbol);

  // STEP 1: User creates signatures (NO GAS SPENT)
  console.log("\n🖊️  STEP 1: User creating signatures...");
  console.log("   (This doesn't spend any gas!)");

  const nonce = ethers.hexlify(ethers.randomBytes(32));
  const validAfter = Math.floor(Date.now() / 1000) - 60;
  const validBefore = Math.floor(Date.now() / 1000) + 3600;
  const deadline = Math.floor(Date.now() / 1000) + 3600;

  // X402 Signature (EIP-3009)
  const x402Domain = {
    name: "X402 BSC Wrapper",
    version: "2",
    chainId: network.chainId,
    verifyingContract: network.wrapper,
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
    to: RECIPIENT,
    value: AMOUNT,
    validAfter,
    validBefore,
    nonce,
  };

  const x402Signature = await userWallet.signTypedData(
    x402Domain,
    x402Types,
    x402Message
  );
  console.log("   ✅ X402 signature created (65 bytes)");

  // Permit Signature (EIP-2612)
  console.log("\n🔑 Creating Permit signature for gasless approval...");

  try {
    // Get Permit info
    const permitData = await wrapperAsUser.getPermitData(
      userWallet.address,
      AMOUNT,
      deadline
    );

    const permitNonce = await usd1.nonces(userWallet.address);

    // USD1 domain for Permit
    const permitDomain = {
      name: await usd1.name(),
      version: "1", // USD1 usually uses version 1
      chainId: network.chainId,
      verifyingContract: network.usd1,
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
      spender: network.wrapper,
      value: AMOUNT,
      nonce: permitNonce,
      deadline,
    };

    const permitSignature = await userWallet.signTypedData(
      permitDomain,
      permitTypes,
      permitMessage
    );

    console.log("   ✅ Permit signature created (65 bytes)");

    // Combine signatures for gasless operation
    const deadlineHex = ethers.toBeHex(deadline, 32).slice(2);
    const combinedSignature =
      x402Signature + permitSignature.slice(2) + deadlineHex;

    console.log("\n📦 Combined Signature:");
    console.log("   Total size:", (combinedSignature.length - 2) / 2, "bytes");
    console.log("   [0-64]: X402 signature");
    console.log("   [65-129]: Permit signature");
    console.log("   [130-161]: Deadline");

    // STEP 2: Facilitator executes (PAYS THE GAS)
    console.log("\n🏢 STEP 2: Facilitator executing transaction...");
    console.log("   (Facilitator pays all the gas!)");

    // Estimate gas first
    try {
      const estimatedGas =
        await wrapperAsFacilitator.transferWithAuthorization.estimateGas(
          userWallet.address,
          RECIPIENT,
          AMOUNT,
          validAfter,
          validBefore,
          nonce,
          combinedSignature
        );

      console.log("\n⛽ Estimated gas:", estimatedGas.toString(), "units");

      const gasPrice = (await provider.getFeeData()).gasPrice;
      const estimatedCost = (estimatedGas * gasPrice) / 10n ** 18n;
      console.log(
        "   Estimated cost:",
        Number(estimatedCost * 10000n) / 10000,
        "BNB"
      );
      console.log("   (Paid by facilitator, not the user!)");

      // Ask if want to execute
      console.log("\n" + "=".repeat(70));
      if (NETWORK === "mainnet") {
        console.log("⚠️  WARNING: This is MAINNET with REAL USD1!");
      }

      const readline = require("readline").createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      readline.question(
        "\n🚀 Execute gasless transfer? (y/n): ",
        async (answer) => {
          if (answer.toLowerCase() === "y") {
            console.log("\n🚀 Executing gasless transfer...");

            const tx = await wrapperAsFacilitator.transferWithAuthorization(
              userWallet.address,
              RECIPIENT,
              AMOUNT,
              validAfter,
              validBefore,
              nonce,
              combinedSignature,
              {
                gasLimit: (estimatedGas * 120n) / 100n, // +20% margin
              }
            );

            console.log("\n✅ GASLESS TRANSACTION SENT!");
            console.log("   Hash:", tx.hash);
            console.log(
              "   View on Explorer:",
              network.explorer + "/tx/" + tx.hash
            );

            console.log("\n⏳ Waiting for confirmation...");
            const receipt = await tx.wait();

            console.log("\n🎉 GASLESS TRANSFER CONFIRMED!");
            console.log("   Block:", receipt.blockNumber);
            console.log("   Gas used:", receipt.gasUsed.toString());

            // Check new balances
            const newUserUSD1 = await usd1.balanceOf(userWallet.address);
            const newUserBNB = await provider.getBalance(userWallet.address);

            console.log("\n💰 User's Final Balances:");
            console.log(
              "   USD1:",
              ethers.formatUnits(newUserUSD1, decimals),
              symbol
            );
            console.log(
              "   BNB:",
              ethers.formatEther(newUserBNB),
              "(didn't change!)"
            );

            console.log("\n✨ SUCCESS!");
            console.log("   User transferred USD1 without spending BNB!");
            console.log("   All gas was paid by the facilitator!");
          } else {
            console.log("\n❌ Cancelled by user");
          }

          readline.close();
        }
      );
    } catch (error) {
      console.error("\n❌ Error estimating/executing:");

      if (error.message.includes("InvalidSignatureLength")) {
        console.log("\n⚠️  Contract received incorrect signature length.");
        console.log("   Expected: 162 bytes for gasless operation");
        console.log("   Check if USD1 properly supports Permit");
      } else if (error.message.includes("insufficient allowance")) {
        console.log("\n⚠️  Permit might not be working.");
        console.log("   User needs to manually approve first");
      } else {
        console.log("   Error:", error.message);
      }

      console.log("\n💡 For fully gasless to work:");
      console.log("   1. USD1 must implement EIP-2612 (Permit)");
      console.log("   2. Wrapper detects 162-byte signature");
      console.log("   3. Executes permit + transferFrom in one transaction");
    }
  } catch (error) {
    console.error("\n❌ Error creating Permit signature:");
    console.log("   ", error.message);

    console.log("\n💡 Alternative: Transfer with pre-approval");
    console.log("   Use test-mainnet.js or test-transfer.js script");
  }
}

// Execute
main().catch((error) => {
  console.error("\n❌ Fatal error:", error);
  process.exit(1);
});
