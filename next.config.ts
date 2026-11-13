import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Самодостаточная сборка для Docker (.next/standalone)
  output: "standalone",
  async redirects() {
    // Старые служебные адреса Tilda
    return [
      { source: "/members/login", destination: "/login", permanent: true },
      { source: "/managing-subscriptions", destination: "/app/billing", permanent: true },
      { source: "/pay-page-:plan", destination: "/tarification", permanent: true },
      { source: "/request-page-biznes", destination: "/tarification", permanent: true },
    ];
  },
};

export default nextConfig;
