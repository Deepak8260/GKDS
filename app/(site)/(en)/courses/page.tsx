import type { Metadata } from 'next';
import { CoursesPageView, coursesMetadata } from '@/components/pages/courses-page';

export const generateMetadata = (): Promise<Metadata> => coursesMetadata('en');

export default function Page() {
  return <CoursesPageView locale="en" />;
}
