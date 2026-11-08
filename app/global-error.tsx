'use client';

import './globals.css';

// Last-resort error screen: replaces the root layout, so it brings its own <html> and <body>.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en-IN">
      <body className="bg-cream font-body text-ink antialiased">
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="font-display text-3xl font-bold text-green-900">Something went wrong</h1>
          <p className="max-w-md text-ink/80">Please try again. If the problem continues, call us and we will help you directly.</p>
          <button
            type="button"
            onClick={reset}
            className="focus-ring min-h-11 rounded-full bg-orange-600 px-6 font-semibold text-white hover:bg-orange-700"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
