/**
 * Add USD1 token to MetaMask
 */
export async function addUSD1ToMetaMask() {
  const USD1_ADDRESS = "0x8d0D000Ee44948FC98c9B98A4FA4921476f08B0d";

  if (!window.ethereum) {
    throw new Error("MetaMask not found");
  }

  try {
    await window.ethereum.request({
      method: "wallet_watchAsset",
      params: {
        type: "ERC20",
        options: {
          address: USD1_ADDRESS,
          symbol: "USD1",
          decimals: 18,
          image: "https://bscscan.com/token/images/wlfi-usd_32.png",
        },
      },
    });

    console.log("USD1 token added to MetaMask");
    return true;
  } catch (error) {
    console.error("Failed to add USD1 token:", error);
    return false;
  }
}
