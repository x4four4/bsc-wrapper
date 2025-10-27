import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,
  allowedDevOrigins: ["*", "local-pay-46.localcan.dev", "x444.io"],
};

export default nextConfig;
