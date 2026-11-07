import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';

const display = Playfair_Display({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['600', '700'],
  display: 'swap',
  variable: '--font-display',
});

const body = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-body',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Gopal Krushna Driving Training School | Baleswar, Odisha',
    template: '%s | Gopal Krushna Driving Training School',
  },
  description:
    'Professional car and small-car driving training in Baleswar with certified instructors, real-road practice and licence test guidance. Serving since 1993.',
  applicationName: 'Gopal Krushna Driving Training School',
};

export const viewport: Viewport = {
  themeColor: '#0B3D1E',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${display.variable} ${body.variable}`}>
      <body className="bg-cream font-body text-ink antialiased">{children}</body>
    </html>
  );
}
