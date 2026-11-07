'use client';

import { useEffect } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';

export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="section-y flex flex-col items-center text-center">
      <h1 className="font-display text-3xl font-bold italic text-green-900 md:text-4xl">
        Something went wrong
      </h1>
      <p className="mt-3 max-w-md text-ink/80">
        We could not load this page right now. Please try again in a moment.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={reset} icon={<RotateCcw className="size-5" aria-hidden="true" />}>
          Try again
        </Button>
        <Button href="/" variant="secondary">
          Back to Home
        </Button>
      </div>
    </Container>
  );
}
