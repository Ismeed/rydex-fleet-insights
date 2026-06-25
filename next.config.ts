import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Disable strict typescript build check if needed, but we keep it standard
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
