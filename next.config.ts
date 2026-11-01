import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static site. No server, no backend. Deploy `out/` anywhere.
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  // Cache Components / PPR need a server; they are off for static export.
  cacheComponents: false,
  partialPrefetching: false,
  turbopack: {
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
