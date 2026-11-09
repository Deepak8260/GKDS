import type { Metadata } from 'next';
import { AboutPageView, aboutMetadata } from '@/components/pages/about-page';

export const generateMetadata = (): Promise<Metadata> => aboutMetadata('or');

export default function Page() {
  return <AboutPageView locale="or" />;
}
