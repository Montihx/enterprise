import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  images: {
    domains: ['shikimori.one', 'kodik.biz'],
  },
};

export default nextConfig;