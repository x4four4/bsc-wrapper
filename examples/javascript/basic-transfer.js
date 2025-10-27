/**
 * Basic Transfer Example
 *
 * Shows how to create and execute a transfer using the X402 BSC Wrapper
 */

const { ethers } = require("ethers");
require("dotenv").config();

// Configuration
const WRAPPER_ADDRESS = "0x6F212f443Ba6BD5aeeF87e37DEe2480F95b75a36";
const USD1_ADDRESS = "0x8d0D000Ee44948FC98c9B98A4FA4921476f08B0d";
const BSC_RPC = "https://bsc-rpc.publicnode.com";

// ABIs
const WRAPPER_ABI = [
  "function transferWithAuthorization(address from, address to, uint256 value, uint256 validAfter, uint256 validBefore, bytes32 nonce, bytes signature)",
];

const USD1_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address) view returns (uint256)",
];

async function main() {
  // Setup provider and wallet
  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  console.log("Wallet:", wallet.address);

  // Connect to contracts
  const wrapper = new ethers.Contract(WRAPPER_ADDRESS, WRAPPER_ABI, wallet);
  const usd1 = new ethers.Contract(USD1_ADDRESS, USD1_ABI, wallet);

  // Check balance
  const balance = await usd1.balanceOf(wallet.address);
  console.log("USD1 Balance:", ethers.formatUnits(balance, 18));

  // Transfer parameters
  const recipient = ethers.getAddress(
    "0x742d35cc6634c0532925a3b844bc9e7595f0beb9"
  ); // Example recipient
  const amount = ethers.parseUnits("1.0", 18); // 1 USD1

  // Step 1: Approve wrapper (one-time)
  console.log("\n1. Approving wrapper...");
  const approveTx = await usd1.approve(WRAPPER_ADDRESS, amount);
  await approveTx.wait();
  console.log("   ✅ Approved!");

  // Step 2: Create authorization signature
  console.log("\n2. Creating signature...");

  const nonce = ethers.hexlify(ethers.randomBytes(32));
  const validAfter = Math.floor(Date.now() / 1000) - 60;
  const validBefore = Math.floor(Date.now() / 1000) + 3600;

  const domain = {
    name: "X402 BSC Wrapper",
    version: "2",
    chainId: 56, // BSC Mainnet
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

  // Step 3: Execute transfer
  console.log("\n3. Executing transfer...");

  const tx = await wrapper.transferWithAuthorization(
    wallet.address,
    recipient,
    amount,
    validAfter,
    validBefore,
    nonce,
    signature
  );

  console.log("   Transaction:", tx.hash);
  const receipt = await tx.wait();
  console.log("   ✅ Transfer complete!");
  console.log("   Gas used:", receipt.gasUsed.toString());

  // Check new balance
  const newBalance = await usd1.balanceOf(wallet.address);
  console.log("\nNew Balance:", ethers.formatUnits(newBalance, 18));
}

// Error handling
main()
  .then(() => {
    console.log("\n✨ Success!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  });
