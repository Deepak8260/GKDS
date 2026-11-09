import type { Metadata } from 'next';
import { ContactPageView, contactMetadata } from '@/components/pages/contact-page';

export const generateMetadata = (): Promise<Metadata> => contactMetadata('en');

export default function Page() {
  return <ContactPageView locale="en" />;
}
