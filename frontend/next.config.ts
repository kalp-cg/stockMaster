import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  async rewrites() {
    return [
      {
        source: '/favicon.ico',
        destination: '/favicon.svg',
      },
    ];
  },
};

export default nextConfig;
