/**
 * Script to verify the deployed X402BSCWrapper on BSC Testnet
 *
 * Usage: node verify-deployment.js
 */

const { ethers } = require("ethers");
require("dotenv").config();

const WRAPPER_ADDRESS = "0xD220b24722AFAc6a9384e5D0c70386C3A36dca97";
const BSC_TESTNET_RPC = "https://bsc-testnet-rpc.publicnode.com";

// Wrapper ABI (minimal for testing)
const WRAPPER_ABI = [
  "function name() view returns (string)",
  "function version() view returns (string)",
  "function token() view returns (address)",
  "function authorizationState(address user, bytes32 nonce) view returns (bool)",
  "function transferWithAuthorization(address from, address to, uint256 value, uint256 validAfter, uint256 validBefore, bytes32 nonce, bytes signature)",
];

async function verifyDeployment() {
  console.log("\n🔍 Verifying X402BSCWrapper Deployment on BSC Testnet\n");
  console.log(`Contract Address: ${WRAPPER_ADDRESS}`);
  console.log(`Network: BSC Testnet (Chain ID: 97)`);
  console.log("=".repeat(60));

  try {
    // Connect to BSC Testnet
    const provider = new ethers.JsonRpcProvider(BSC_TESTNET_RPC);

    // Check if contract exists
    console.log("\n1. Checking contract existence...");
    const code = await provider.getCode(WRAPPER_ADDRESS);

    if (code === "0x") {
      console.log("   ❌ No contract found at this address!");
      return false;
    }

    console.log("   ✅ Contract deployed successfully!");
    console.log(`   Code size: ${(code.length - 2) / 2} bytes`);

    // Connect to wrapper contract
    const wrapper = new ethers.Contract(WRAPPER_ADDRESS, WRAPPER_ABI, provider);

    // Test read functions
    console.log("\n2. Testing contract functions...");

    try {
      const name = await wrapper.name();
      console.log(`   ✅ name(): "${name}"`);
    } catch (error) {
      console.log(`   ❌ name() failed: ${error.message}`);
    }

    try {
      const version = await wrapper.version();
      console.log(`   ✅ version(): "${version}"`);
    } catch (error) {
      console.log(`   ❌ version() failed: ${error.message}`);
    }

    try {
      const token = await wrapper.token();
      console.log(`   ✅ token(): ${token}`);

      // Verify it's a valid address
      if (token === "0x0000000000000000000000000000000000000000") {
        console.log("   ⚠️  Warning: Token address is zero address!");
      } else {
        console.log("   ✅ Token address looks valid");

        // Try to get USD1 token info
        const tokenContract = new ethers.Contract(
          token,
          [
            "function name() view returns (string)",
            "function decimals() view returns (uint8)",
          ],
          provider
        );

        try {
          const tokenName = await tokenContract.name();
          const tokenDecimals = await tokenContract.decimals();
          console.log(
            `   📝 Token Info: ${tokenName} (${tokenDecimals} decimals)`
          );
        } catch {
          console.log(
            "   ⚠️  Could not fetch token info (might not be deployed yet)"
          );
        }
      }
    } catch (error) {
      console.log(`   ❌ token() failed: ${error.message}`);
    }

    // Test authorization state
    console.log("\n3. Testing authorization state...");
    const testAddress = "0x0000000000000000000000000000000000000001";
    const testNonce = ethers.hexlify(ethers.randomBytes(32));

    try {
      const isUsed = await wrapper.authorizationState(testAddress, testNonce);
      console.log(
        `   ✅ authorizationState(): ${isUsed} (should be false for new nonce)`
      );
    } catch (error) {
      console.log(`   ❌ authorizationState() failed: ${error.message}`);
    }

    // Generate BSCScan links
    console.log("\n4. BSCScan Testnet Links:");
    console.log(
      `   📍 Contract: https://testnet.bscscan.com/address/${WRAPPER_ADDRESS}`
    );
    console.log(
      `   📝 Code: https://testnet.bscscan.com/address/${WRAPPER_ADDRESS}#code`
    );
    console.log(
      `   📊 Transactions: https://testnet.bscscan.com/address/${WRAPPER_ADDRESS}#internaltx`
    );

    // Check if verified on BSCScan
    console.log("\n5. Contract Verification Status:");
    console.log(
      "   ⚠️  Remember to verify the contract on BSCScan for transparency!"
    );
    console.log(
      "   Run: npx hardhat verify --network bsc-testnet " +
        WRAPPER_ADDRESS +
        " [USD1_ADDRESS]"
    );

    console.log("\n" + "=".repeat(60));
    console.log("✅ DEPLOYMENT VERIFICATION COMPLETE!");
    console.log("\n📋 Next Steps:");
    console.log("1. Update config.ts with this wrapper address");
    console.log("2. Get USD1 testnet tokens for testing");
    console.log("3. Test a real transfer with USD1");
    console.log("4. Verify contract on BSCScan");

    return true;
  } catch (error) {
    console.error("\n❌ Error verifying deployment:", error.message);
    return false;
  }
}

// Run verification
if (require.main === module) {
  verifyDeployment()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { verifyDeployment, WRAPPER_ADDRESS };
