import { getBalance } from "@/app/services/blockchain";
import { ethers } from "ethers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;

    // Validate address
    if (!address || !ethers.isAddress(address)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid address format",
        },
        { status: 400 }
      );
    }

    // Get balance
    const balance = await getBalance(address);

    return NextResponse.json({
      success: true,
      data: {
        address,
        balance,
        formatted: `${parseFloat(balance).toFixed(2)} USD1`,
      },
    });
  } catch (error: unknown) {
    console.error("Failed to fetch balance:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch balance",
      },
      { status: 500 }
    );
  }
}
