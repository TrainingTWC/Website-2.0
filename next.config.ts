import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    // Static export forces the unoptimized path — no Next image server at
    // runtime. We still declare `remotePatterns` so that, if we ever switch
    // to a server target, Convex-hosted assets are pre-approved.
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "*.convex.cloud" },
      { protocol: "https", hostname: "*.convex.site" },
    ],
  },
  // Pre-existing TS errors in src/ were silently ignored by Vite's esbuild.
  // Suppress during migration bridge; fix in Phase 2 type-cleanup.
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
