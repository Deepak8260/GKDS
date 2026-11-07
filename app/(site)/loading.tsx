import { Container } from '@/components/ui/container';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading page">
      <div className="bg-green-900 py-16 md:py-20">
        <Container className="space-y-4">
          <Skeleton className="h-4 w-40 bg-white/20" />
          <Skeleton className="h-12 w-72 bg-white/20" />
          <Skeleton className="h-5 w-96 max-w-full bg-white/20" />
        </Container>
      </div>
      <Container className="section-y grid gap-6 md:grid-cols-2">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </Container>
    </div>
  );
}
