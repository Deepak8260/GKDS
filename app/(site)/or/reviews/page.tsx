import type { Metadata } from 'next';
import { ReviewsPageView, reviewsMetadata } from '@/components/pages/reviews-page';

export const generateMetadata = (): Promise<Metadata> => reviewsMetadata('or');

export default function Page() {
  return <ReviewsPageView locale="or" />;
}
