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

export default nextConfig;

module.exports = {
  allowedDevOrigins: ['10.131.201.164'],
}