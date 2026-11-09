import type { Metadata } from 'next';
import { HomePageView, homeMetadata } from '@/components/pages/home-page';

export const generateMetadata = (): Promise<Metadata> => homeMetadata('or');

export default function Page() {
  return <HomePageView locale="or" />;
}
