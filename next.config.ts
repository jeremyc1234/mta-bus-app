import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'files.mta.info',
        pathname: '/s3fs-public/**',
      },
      {
        protocol: 'https',
        hostname: 'new.mta.info',
        pathname: '/sites/default/files/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/sitemap.xml',
        destination: '/api/sitemap',
      },
    ];
  },
};

export default nextConfig;
