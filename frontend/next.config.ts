import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // In monorepo builds (e.g. Vercel experimentalServices), Vercel injects
  // outputFileTracingRoot = /vercel/path0 via modifyConfig. We must match
  // turbopack.root to the same parent directory to avoid the conflict warning.
  turbopack: {
    root: path.resolve(__dirname, "../"),
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "**.githubusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
