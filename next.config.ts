import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['files.mta.info'], // Allow images from files.mta.info
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'files.mta.info',
        pathname: '/s3fs-public/**', // Match the specific path structure
      },
    ],
  },
};

export default nextConfig;
