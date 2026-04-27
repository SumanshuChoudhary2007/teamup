import type { NextConfig } from "next";
import path from "path";

const rootPath = path.resolve(__dirname, '../');

const nextConfig: NextConfig = {
  outputFileTracingRoot: rootPath,
  turbopack: {
    root: rootPath,
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: '**.githubusercontent.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
};

export default nextConfig;
