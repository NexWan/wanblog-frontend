import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Prevent the client-side router from caching force-dynamic pages.
    // Without this, navigating away from /blog and back serves the stale
    // RSC payload (published blogs disappear until a hard reload).
    staleTimes: {
      dynamic: 0,
    },
  },
};

export default nextConfig;
