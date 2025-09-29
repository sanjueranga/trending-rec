import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
      {
        source: '/api/n8n/:path*',
        destination: 'http://localhost:5678/:path*',
      },
    ];
  },
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || '/api/backend',
  },
};

export default nextConfig;
