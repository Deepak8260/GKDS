'use client';

import { useEffect } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';

// Written out here (not read from the dictionary) so this always-loaded component stays tiny.
export default function OdiaSiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="section-y flex flex-col items-center text-center">
      <h1 className="font-display text-3xl font-bold text-green-900 md:text-4xl">କିଛି ଭୁଲ୍ ହୋଇଗଲା</h1>
      <p className="mt-3 max-w-md text-ink/80">ବର୍ତ୍ତମାନ ଏହି ପୃଷ୍ଠା ଲୋଡ୍ କରିହେଲା ନାହିଁ। ଦୟାକରି ଟିକେ ପରେ ପୁନର୍ବାର ଚେଷ୍ଟା କରନ୍ତୁ।</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={reset} icon={<RotateCcw className="size-5" aria-hidden="true" />}>
          ପୁନର୍ବାର ଚେଷ୍ଟା କରନ୍ତୁ
        </Button>
        <Button href="/" variant="secondary">
          ମୂଳପୃଷ୍ଠାକୁ ଫେରନ୍ତୁ
        </Button>
      </div>
    </Container>
  );
}
