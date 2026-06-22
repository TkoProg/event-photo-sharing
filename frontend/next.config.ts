import type { NextConfig } from "next";

const networkHost = process.env.NETWORK_HOST ?? 'localhost';
const apiPort = process.env.NEXT_PUBLIC_API_PORT ?? '8000';
const uploadHostnames = ['localhost', '127.0.0.1', networkHost];
const uploadProtocols = ['http', 'https'] as const;

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    networkHost,
    '*.local',
  ],
  images: {
    remotePatterns: uploadHostnames.flatMap((hostname) =>
      uploadProtocols.flatMap((protocol) => {
        const ports = protocol === 'https' ? ['', apiPort] : [apiPort];

        return ports.map((port) => ({
          protocol,
          hostname,
          port,
          pathname: '/uploads/**',
        }));
      })
    ),
  },
};

export default nextConfig;
