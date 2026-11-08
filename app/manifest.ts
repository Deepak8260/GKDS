import type { MetadataRoute } from 'next';
import { getSite } from '@/lib/content';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const site = await getSite();
  return {
    name: site.name,
    short_name: 'GK Driving School',
    description: site.seo.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#FFFAF3',
    theme_color: '#0B3D1E',
    lang: 'en-IN',
    icons: [
      { src: '/assets/brand/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/assets/brand/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/assets/brand/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
