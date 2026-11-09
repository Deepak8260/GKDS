import type { Metadata } from 'next';
import { HomePageView, homeMetadata } from '@/components/pages/home-page';

export const generateMetadata = (): Promise<Metadata> => homeMetadata('en');

export default function Page() {
  return <HomePageView locale="en" />;
}
