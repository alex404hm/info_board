import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "knpl.imgix.net",
      },
    ],
  },
};

export default nextConfig;
