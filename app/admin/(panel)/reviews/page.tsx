import type { Metadata } from 'next';
import { ReviewsEditor } from '@/components/admin/editors/reviews-editor';

export const metadata: Metadata = { title: 'Reviews' };

export default function Page() {
  return <ReviewsEditor />;
}
