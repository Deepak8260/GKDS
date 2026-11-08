import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { getSite } from '@/lib/content';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { mediaUrl } from '@/lib/media';
import { SITE_URL } from '@/lib/site-url';
import './globals.css';

// Variable fonts (no explicit weights): one file per style instead of one per weight.
// `preload: false`: only the style a page actually uses is downloaded (Home uses italic only; inner hero titles use upright).
const display = Playfair_Display({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  display: 'swap',
  preload: false,
  variable: '--font-display',
});

const body = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
});

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: 'Gopal Krushna Driving Training School | Baleswar, Odisha',
      template: '%s | Gopal Krushna Driving Training School',
    },
    description:
      'Professional car and small-car driving training in Baleswar with certified instructors, real-road practice and licence test guidance. Serving since 1993.',
    applicationName: 'Gopal Krushna Driving Training School',
    // Browser-tab icon comes from site settings (editable in admin); the Krishna emblem by default.
    icons: {
      icon: [{ url: mediaUrl(site.favicon) }],
      apple: [{ url: '/assets/brand/apple-touch-icon.png', sizes: '180x180' }],
    },
  };
}

export const viewport: Viewport = {
  themeColor: '#0B3D1E',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${display.variable} ${body.variable}`}>
      <body className="bg-cream font-body text-ink antialiased">
        {children}
        {/* only on Vercel: elsewhere their scripts would 404 */}
        {process.env.VERCEL ? (
          <>
            <Analytics />
            <SpeedInsights />
          </>
        ) : null}
      </body>
    </html>
  );
}
