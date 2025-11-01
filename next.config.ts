import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Next.js 16 upgrade: prefer `skipProxyUrlNormalize` naming.
  skipProxyUrlNormalize: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  poweredByHeader: false,
};

export default nextConfig;
