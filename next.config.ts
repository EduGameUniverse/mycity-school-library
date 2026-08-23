import type { NextConfig } from "next";

const BAC_ZONE = "https://mission-bac-trigonometry-tower.vercel.app";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/bac/mission-01-trigonometry-tower",
        destination: `${BAC_ZONE}/bac/mission-01-trigonometry-tower`,
      },
      {
        source: "/bac-static/:path*",
        destination: `${BAC_ZONE}/bac-static/:path*`,
      },
      {
        source: "/assets/bac-trigonometry/:path*",
        destination: `${BAC_ZONE}/assets/bac-trigonometry/:path*`,
      },
    ];
  },
};

export default nextConfig;
