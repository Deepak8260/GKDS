import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    // Optimised images are content-addressed by URL + source; cache them for 31 days.
    minimumCacheTTL: 2678400,
    // Only local images are allowed: bundled files (public/assets) and the private-repo proxy.
    localPatterns: [{ pathname: '/api/media/**' }, { pathname: '/assets/**' }],
  },
  async headers() {
    return [
      {
        // Bundled brand/placeholder files change rarely: cache for a week, revalidate in the background.
        source: '/assets/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' }],
      },
    ];
  },
};

export default nextConfig;
