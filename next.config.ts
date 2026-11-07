import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    // Only local images are allowed: bundled files and the private-repo proxy.
    localPatterns: [
      { pathname: '/api/media/**' },
      { pathname: '/placeholders/**' },
      { pathname: '/brand/**' },
    ],
  },
};

export default nextConfig;
