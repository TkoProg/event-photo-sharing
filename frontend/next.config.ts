import type { NextConfig } from "next";

const networkHost = process.env.NETWORK_HOST ?? 'localhost';
const apiPort = process.env.NEXT_PUBLIC_API_PORT ?? '8000';
const uploadHostnames = ['localhost', '127.0.0.1', networkHost];

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    networkHost,
    '*.local',
  ],
  images: {
    remotePatterns: uploadHostnames.map((hostname) => ({
      protocol: 'http',
      hostname,
      port: apiPort,
      pathname: '/uploads/**',
    })),
  },
};

export default nextConfig;
