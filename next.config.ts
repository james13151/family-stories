import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  serverExternalPackages: [
    "@xenova/transformers",
    "onnxruntime-node",
    "@resvg/resvg-js",
    "prisma",
    "@prisma/client",
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: "40mb",
    },
  },
};

export default nextConfig;
