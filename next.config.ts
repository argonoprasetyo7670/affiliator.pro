import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '500mb', // Increase body size limit for video uploads
    },
  },
  // Exclude ffmpeg packages from bundling
  serverExternalPackages: ['fluent-ffmpeg', 'ffmpeg-static', '@ffprobe-installer/ffprobe'],
  // Empty turbopack config to silence webpack warning
  turbopack: {},
};

export default nextConfig;
