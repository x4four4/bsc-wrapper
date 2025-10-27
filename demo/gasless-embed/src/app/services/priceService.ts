import { ethers } from "ethers";

// Cache for price data
let priceCache: {
  bnb: number;
  timestamp: number;
} | null = null;

const CACHE_DURATION = 60000; // 1 minute cache

/**
 * Try multiple price sources for reliability
 */
async function fetchBNBPriceFromCoinGecko(): Promise<number | null> {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd",
      { signal: AbortSignal.timeout(5000) } // 5 second timeout
    );

    if (!response.ok) return null;

    const data = await response.json();
    return data.binancecoin?.usd || null;
  } catch {
    return null;
  }
}

async function fetchBNBPriceFromBinance(): Promise<number | null> {
  try {
    const response = await fetch(
      "https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT",
      { signal: AbortSignal.timeout(5000) }
    );

    if (!response.ok) return null;

    const data = await response.json();
    return parseFloat(data.price) || null;
  } catch {
    return null;
  }
}

/**
 * Fetch BNB price from multiple sources
 */
export async function getBNBPrice(): Promise<number> {
  // Check cache first
  if (priceCache && Date.now() - priceCache.timestamp < CACHE_DURATION) {
    return priceCache.bnb;
  }

  try {
    // Try multiple sources in parallel
    const [geckoPrice, binancePrice] = await Promise.all([
      fetchBNBPriceFromCoinGecko(),
      fetchBNBPriceFromBinance(),
    ]);

    // Use first available price
    const price = geckoPrice || binancePrice || 600;

    // Update cache
    priceCache = {
      bnb: price,
      timestamp: Date.now(),
    };

    return price;
  } catch (error) {
    console.error("Error fetching BNB price:", error);
    return 600; // Fallback price
  }
}

/**
 * Get current gas price from BSC network with fallback RPCs
 */
export async function getCurrentGasPrice(): Promise<bigint> {
  const rpcUrls = [
    "https://bsc-dataseed.binance.org/",
    "https://bsc-dataseed1.binance.org/",
    "https://bsc-dataseed2.binance.org/",
    "https://bsc.publicnode.com",
  ];

  for (const rpcUrl of rpcUrls) {
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      // Set a timeout for the RPC call
      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 3000)
      );

      const feeDataPromise = provider.getFeeData();
      const result = await Promise.race([feeDataPromise, timeoutPromise]);

      if (result && result.gasPrice) {
        return result.gasPrice;
      }
    } catch {
      // Try next RPC
      continue;
    }
  }

  // Default to 3 gwei if all RPCs fail
  return BigInt(3000000000);
}

/**
 * Calculate gas costs for a transaction
 */
export async function calculateGasCosts(gasUsed?: string) {
  try {
    // Get real-time data
    const [bnbPrice, gasPrice] = await Promise.all([
      getBNBPrice(),
      getCurrentGasPrice(),
    ]);

    // Use provided gas used or estimate
    const gasUnits = gasUsed ? BigInt(gasUsed) : BigInt(120000); // Default for permit transfer

    // Calculate costs
    const gasCostWei = gasUnits * gasPrice;
    const gasCostBNB = Number(ethers.formatUnits(gasCostWei, 18));
    const gasCostUSD = gasCostBNB * bnbPrice;

    return {
      gasUnits: gasUnits.toString(),
      gasPrice: ethers.formatUnits(gasPrice, "gwei"),
      gasCostBNB,
      gasCostUSD,
      bnbPrice,
    };
  } catch (error) {
    console.error("Error calculating gas costs:", error);

    // Fallback values
    return {
      gasUnits: "120000",
      gasPrice: "3",
      gasCostBNB: 0.00036,
      gasCostUSD: 0.216,
      bnbPrice: 600,
    };
  }
}
