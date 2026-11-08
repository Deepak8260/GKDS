import type { NextConfig } from 'next';
import { securityHeaders } from './lib/security-headers';

const production = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // import only the lucide icons that are used
    optimizePackageImports: ['lucide-react'],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    // A short, sensible set of widths keeps the number of generated image variants (and cache misses) small.
    deviceSizes: [360, 480, 640, 828, 1080, 1280, 1600, 1920],
    // Optimised images are content-addressed by URL + source; cache them for 31 days.
    minimumCacheTTL: 2678400,
    // Only local images are allowed: bundled files (public/assets) and the private-repo proxy.
    localPatterns: [{ pathname: '/api/media/**' }, { pathname: '/assets/**' }],
  },
  async headers() {
    return [
      // security headers (+ CSP in production) on every response
      { source: '/:path*', headers: securityHeaders({ production }) },
      {
        // Bundled brand/photo files change rarely: cache for a week, revalidate in the background.
        // (/_next/static is already served `immutable` by Next.js.)
        source: '/assets/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' }],
      },
    ];
  },
};

export default nextConfig;
