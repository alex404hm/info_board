import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pg"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "knpl.imgix.net",
      },
    ],
  },
};

module.exports = {
  allowedDevOrigins: ['setup-const-technologies-bridges.trycloudflare.com'],
}

export default nextConfig;