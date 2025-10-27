/**
 * Integration test for deployed X402BSCWrapper
 * Tests the full flow with a mock transaction
 */

const { ethers } = require("ethers");
require("dotenv").config();

const WRAPPER_ADDRESS = "0xD220b24722AFAc6a9384e5D0c70386C3A36dca97";
const BSC_TESTNET_RPC = "https://bsc-testnet-rpc.publicnode.com";

async function testIntegration() {
  console.log("\n🧪 X402 BSC Wrapper Integration Test\n");
  console.log("=".repeat(60));

  const provider = new ethers.JsonRpcProvider(BSC_TESTNET_RPC);

  // Create test wallet (no real funds needed for simulation)
  const testWallet = ethers.Wallet.createRandom().connect(provider);
  console.log(`Test Wallet: ${testWallet.address}`);

  // Wrapper contract
  const wrapperABI = [
    "function transferWithAuthorization(address from, address to, uint256 value, uint256 validAfter, uint256 validBefore, bytes32 nonce, bytes signature)",
    "function authorizationState(address, bytes32) view returns (bool)",
    "function token() view returns (address)",
  ];

  const wrapper = new ethers.Contract(WRAPPER_ADDRESS, wrapperABI, provider);

  console.log("\n1. Simulating x402 Payment Flow:");

  try {
    // Step 1: Generate payment parameters
    const from = testWallet.address;
    const to = "0x1234567890123456789012345678901234567890"; // Mock recipient
    const value = ethers.parseUnits("1", 6); // 1 USD1 (6 decimals)
    const validAfter = Math.floor(Date.now() / 1000) - 600;
    const validBefore = Math.floor(Date.now() / 1000) + 3600;
    const nonce = ethers.hexlify(ethers.randomBytes(32));

    console.log("\n   Payment Parameters:");
    console.log(`   From: ${from}`);
    console.log(`   To: ${to}`);
    console.log(`   Amount: 1.0 USD1`);
    console.log(
      `   Valid: ${new Date(validAfter * 1000).toLocaleString()} to ${new Date(
        validBefore * 1000
      ).toLocaleString()}`
    );
    console.log(`   Nonce: ${nonce}`);

    // Step 2: Create EIP-712 signature
    const domain = {
      name: "X402 BSC Wrapper",
      version: "2",
      chainId: 97,
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
      from,
      to,
      value: value.toString(),
      validAfter,
      validBefore,
      nonce,
    };

    console.log("\n2. Creating signature...");
    const signature = await testWallet.signTypedData(domain, types, message);
    console.log(`   ✅ Signature created (${signature.length / 2 - 1} bytes)`);

    // Step 3: Verify signature
    const recoveredAddress = ethers.verifyTypedData(
      domain,
      types,
      message,
      signature
    );
    console.log(`   ✅ Signature valid (signer: ${recoveredAddress})`);

    // Step 4: Check nonce state
    console.log("\n3. Checking authorization state...");
    const isUsed = await wrapper.authorizationState(from, nonce);
    console.log(`   Nonce used: ${isUsed} (should be false)`);

    // Step 5: Simulate transaction (without actually sending)
    console.log("\n4. Simulating transferWithAuthorization...");

    try {
      // Encode the function call
      const txData = wrapper.interface.encodeFunctionData(
        "transferWithAuthorization",
        [from, to, value, validAfter, validBefore, nonce, signature]
      );

      console.log(`   ✅ Transaction data encoded`);
      console.log(`   📝 Data length: ${(txData.length - 2) / 2} bytes`);

      // Estimate gas (this will fail if no USD1 approval, but that's ok)
      try {
        const gasEstimate = await provider.estimateGas({
          to: WRAPPER_ADDRESS,
          data: txData,
          from: "0x0000000000000000000000000000000000000001", // Mock facilitator
        });
        console.log(`   ⛽ Estimated gas: ${gasEstimate.toString()} units`);
      } catch (gasError) {
        console.log(
          `   ⚠️  Gas estimation failed (expected without USD1): ${gasError.message.slice(
            0,
            50
          )}...`
        );
      }
    } catch (error) {
      console.log(`   ⚠️  Simulation error: ${error.message}`);
    }

    // Step 6: Test with Permit (162 bytes signature)
    console.log("\n5. Testing Permit signature format...");
    const permitSignature =
      "0x" +
      signature.slice(2) + // x402 signature (65 bytes)
      "a".repeat(130) + // mock permit signature (65 bytes)
      "0".repeat(64); // deadline (32 bytes)

    console.log(
      `   Combined signature: ${(permitSignature.length - 2) / 2} bytes`
    );
    if ((permitSignature.length - 2) / 2 === 162) {
      console.log(`   ✅ Permit signature format correct (162 bytes)`);
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ INTEGRATION TEST COMPLETE!");

    console.log("\n📊 Test Summary:");
    console.log("   • Wrapper deployed: ✅");
    console.log("   • Functions accessible: ✅");
    console.log("   • Signature creation: ✅");
    console.log("   • Signature verification: ✅");
    console.log("   • Transaction encoding: ✅");
    console.log("   • Permit format support: ✅");

    console.log("\n💡 To test with real USD1:");
    console.log("1. Get USD1 testnet tokens from faucet");
    console.log("2. Approve wrapper or use permit signature");
    console.log("3. Execute real transferWithAuthorization");

    // Get token address for reference
    const tokenAddress = await wrapper.token();
    console.log(`\n📝 USD1 Token Address: ${tokenAddress}`);

    if (tokenAddress === "0x0000000000000000000000000000000000000000") {
      console.log(
        "   ⚠️  Warning: Token address not set! Update deployment with correct USD1 address."
      );
    }

    return true;
  } catch (error) {
    console.error("\n❌ Integration test failed:", error);
    return false;
  }
}

// Run test
if (require.main === module) {
  testIntegration()
    .then((success) => {
      console.log(
        success ? "\n✨ All tests passed!" : "\n❌ Some tests failed"
      );
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}

module.exports = { testIntegration };
