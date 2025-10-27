import { getNetworkConfig } from "@/app/config/contracts";
import { estimateGasForTransfer } from "@/app/services/blockchain";
import { ethers } from "ethers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.from || !body.to || !body.amount) {
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

    // Get network config
    const config = getNetworkConfig();
    const hasPermit = body.hasPermit !== false && config.supportsPermit;

    // Estimate gas
    const gasEstimate = await estimateGasForTransfer(
      body.from,
      body.to,
      body.amount,
      hasPermit
    );

    return NextResponse.json({
      success: true,
      data: {
        gasUnits: gasEstimate.gasUnits,
        gasPrice: `${gasEstimate.gasPrice} gwei`,
        totalCostBNB: gasEstimate.totalCost,
        totalCostUSD: (parseFloat(gasEstimate.totalCost) * 600).toFixed(2), // Rough estimate
        hasPermit,
        network: process.env.DEFAULT_NETWORK || "mainnet",
      },
    });
  } catch (error) {
    console.error("Failed to estimate gas:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to estimate gas",
      },
      { status: 500 }
    );
  }
}
