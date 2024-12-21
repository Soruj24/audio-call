import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/socket.io/:path*",
        destination: "https://audio-call-eta.vercel.app/socket.io/:path*", // ব্যাকএন্ড URL
      },
    ];
  },
};

export default nextConfig;
