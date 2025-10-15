import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    turbo: {
      rules: {
        "*.svg": {
          loaders: ["@svgr/webpack"],
          as: "*.js",
        },
      },
    },
  },
  // Disable static optimization for pages that use client-side features
  output: "standalone",
  // Ensure all pages are rendered at request time
  trailingSlash: false,
  // Skip static optimization
  skipTrailingSlashRedirect: true,
  // Force dynamic rendering for all pages
  generateBuildId: async () => {
    return "build-" + Date.now();
  },
};

export default nextConfig;
