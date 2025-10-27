import { getNetworkConfig } from "@/app/config/contracts";
import {
  executeGaslessTransfer,
  executeGaslessTransferWithPermit,
  getBalance,
  isNonceUsed,
  verifyGaslessSignature,
} from "@/app/services/blockchain";
import { ethers } from "ethers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("\n📨 Received gasless transfer request");
    console.log("   From:", body.from);
    console.log("   To:", body.to);
    console.log("   Amount:", body.amount);
    console.log("   Network:", body.network);

    // Validate required fields
    if (!body.from || !body.to || !body.amount || !body.transfer) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
        },
        { status: 400 }
      );
    }

    // Validate addresses
    if (!ethers.isAddress(body.from) || !ethers.isAddress(body.to)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid address format",
        },
        { status: 400 }
      );
    }

    // Validate amount
    const amount = parseFloat(body.amount);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid amount",
        },
        { status: 400 }
      );
    }

    if (amount < 0.01) {
      return NextResponse.json(
        {
          success: false,
          error: "Minimum transfer amount is 0.01 USD1",
        },
        { status: 400 }
      );
    }

    // Check if from and to are different
    if (body.from.toLowerCase() === body.to.toLowerCase()) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot transfer to the same address",
        },
        { status: 400 }
      );
    }

    // Verify signature
    console.log("\n🔐 Verifying signature...");
    const isValidSignature = await verifyGaslessSignature(
      body.from,
      body.to,
      body.amount,
      body.transfer.validAfter,
      body.transfer.validBefore,
      body.transfer.nonce,
      body.transfer.v,
      body.transfer.r,
      body.transfer.s
    );

    if (!isValidSignature) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid signature",
        },
        { status: 401 }
      );
    }

    console.log("   ✅ Signature verified");

    // Check if nonce has been used
    console.log("\n🔍 Checking nonce...");
    const nonceUsed = await isNonceUsed(body.from, body.transfer.nonce);
    if (nonceUsed) {
      return NextResponse.json(
        {
          success: false,
          error: "Nonce already used",
        },
        { status: 400 }
      );
    }
    console.log("   ✅ Nonce is fresh");

    // Check user balance
    console.log("\n💰 Checking balance...");
    const balance = await getBalance(body.from);
    const balanceNum = parseFloat(balance);

    if (balanceNum < amount) {
      return NextResponse.json(
        {
          success: false,
          error: "Insufficient USD1 balance",
          data: { balance, required: body.amount },
        },
        { status: 400 }
      );
    }
    console.log(`   ✅ Balance sufficient: ${balance} USD1`);

    // Check time validity
    const currentTime = Math.floor(Date.now() / 1000);
    if (
      currentTime < body.transfer.validAfter ||
      currentTime > body.transfer.validBefore
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Signature has expired",
        },
        { status: 400 }
      );
    }

    // Execute transfer
    let result;
    const config = getNetworkConfig();

    if (body.permit && config.supportsPermit) {
      console.log("\n📝 Executing transfer with permit...");
      result = await executeGaslessTransferWithPermit(
        body.from,
        body.to,
        body.amount,
        body.transfer,
        body.permit
      );
    } else {
      console.log("\n📝 Executing transfer without permit...");
      result = await executeGaslessTransfer(
        body.from,
        body.to,
        body.amount,
        body.transfer
      );
    }

    console.log("\n✅ Transfer successful!");
    console.log("   Transaction hash:", result.txHash);

    return NextResponse.json({
      success: true,
      data: {
        txHash: result.txHash,
        blockNumber: result.blockNumber,
        gasUsed: result.gasUsed,
        from: body.from,
        to: body.to,
        amount: body.amount,
        explorer: `${config.explorer}/tx/${result.txHash}`,
      },
    });
  } catch (error: unknown) {
    console.error("\n❌ Transfer failed:", error);

    let statusCode = 500;
    let errorMessage =
      error instanceof Error ? error.message : "Transfer failed";

    if (errorMessage?.includes("insufficient funds")) {
      errorMessage = "Facilitator has insufficient BNB for gas";
      statusCode = 503;
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: statusCode }
    );
  }
}
