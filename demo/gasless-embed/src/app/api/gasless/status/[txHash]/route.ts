import { getNetworkConfig } from "@/app/config/contracts";
import { getTransactionStatus } from "@/app/services/blockchain";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ txHash: string }> }
) {
  try {
    const { txHash } = await params;

    // Validate transaction hash
    if (!txHash || !/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid transaction hash format",
        },
        { status: 400 }
      );
    }

    // Get transaction status
    const status = await getTransactionStatus(txHash);
    const config = getNetworkConfig();

    return NextResponse.json({
      success: true,
      data: {
        txHash,
        status: status.status,
        message: status.message,
        blockNumber: status.blockNumber,
        gasUsed: status.gasUsed,
        explorer: `${config.explorer}/tx/${txHash}`,
      },
    });
  } catch (error: unknown) {
    console.error("Failed to get transaction status:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get transaction status",
      },
      { status: 500 }
    );
  }
}
