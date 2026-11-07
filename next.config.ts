import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    // Only local images are allowed: bundled files (public/assets) and the private-repo proxy.
    localPatterns: [{ pathname: '/api/media/**' }, { pathname: '/assets/**' }],
  },
};

export default nextConfig;
