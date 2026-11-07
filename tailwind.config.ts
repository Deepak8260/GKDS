import type { Config } from 'tailwindcss';

/**
 * Design tokens (single source of truth).
 * Colour values live as space-separated RGB channels in app/globals.css
 * (e.g. --color-green-900: 11 61 30) so Tailwind opacity modifiers work (bg-green-900/60).
 */
const channel = (name: string) => `rgb(var(--color-${name}) / <alpha-value>)`;

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        green: {
          50: channel('green-50'),
          100: channel('green-100'),
          700: channel('green-700'),
          800: channel('green-800'),
          900: channel('green-900'),
          950: channel('green-950'),
        },
        orange: {
          50: channel('orange-50'),
          100: channel('orange-100'),
          300: channel('orange-300'),
          500: channel('orange-500'),
          600: channel('orange-600'),
          700: channel('orange-700'),
        },
        cream: channel('cream'),
        ink: channel('ink'),
        muted: channel('muted'),
        line: channel('line'),
        whatsapp: channel('whatsapp'),
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 8px 24px rgba(120, 80, 30, 0.08)',
        'card-lg': '0 16px 40px rgba(120, 80, 30, 0.12)',
        orange: '0 8px 20px rgba(236, 101, 12, 0.32)',
      },
      backgroundImage: {
        // white text on this gradient stays >= 3.2:1 (AA for bold/large labels)
        'brand-orange': 'linear-gradient(90deg, #EC650C 0%, #CF540A 100%)',
        'hero-green':
          'linear-gradient(100deg, rgb(var(--color-green-900)) 0%, #14532D 55%, transparent 100%)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'fade-out': { from: { opacity: '1' }, to: { opacity: '0' } },
        'slide-in': { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
        'slide-out': { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(100%)' } },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        highlight: {
          '0%': { boxShadow: '0 0 0 3px rgba(236,101,12,0.9)' },
          '100%': { boxShadow: '0 0 0 3px rgba(236,101,12,0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out both',
        'fade-out': 'fade-out 0.2s ease-in both',
        'slide-in': 'slide-in 0.25s ease-out both',
        'slide-out': 'slide-out 0.2s ease-in both',
        'fade-up': 'fade-up 0.25s ease-out both',
        highlight: 'highlight 2.4s ease-out forwards',
      },
    },
  },
  plugins: [],
};

export default config;
