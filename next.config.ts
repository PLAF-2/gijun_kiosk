import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const repoName = process.env.GITHUB_REPOSITORY?.split("/").at(-1) || "gijun_kiosk";
const basePath = isProd ? `/${repoName}` : "";

const nextConfig: NextConfig = {
  distDir: isProd ? ".next" : ".next-dev",
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath,
  assetPrefix: isProd ? `/${repoName}/` : undefined,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
