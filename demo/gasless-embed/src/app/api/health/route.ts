import { getNetworkConfig } from "@/app/config/contracts";
import { getFacilitatorBalance } from "@/app/services/blockchain";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const facilitatorBalance = await getFacilitatorBalance();
    const config = getNetworkConfig();

    return NextResponse.json({
      success: true,
      status: "ok",
      timestamp: new Date().toISOString(),
      network: process.env.DEFAULT_NETWORK || "mainnet",
      facilitator: {
        balance: `${facilitatorBalance} BNB`,
        hasMinimumBalance: parseFloat(facilitatorBalance) > 0.01,
      },
      contracts: {
        usd1: config.contracts.usd1,
        wrapper: config.contracts.wrapper,
      },
      explorer: config.explorer,
    });
  } catch (error) {
    console.error("Health check failed:", error);

    return NextResponse.json(
      {
        success: false,
        status: "error",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Health check failed",
      },
      { status: 500 }
    );
  }
}
