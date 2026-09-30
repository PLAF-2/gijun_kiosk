import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const repoName = "gijun_kiosk";
const basePath = isProd ? `/${repoName}` : "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath,
  assetPrefix: isProd ? `/${repoName}/` : undefined,
};

export default nextConfig;
