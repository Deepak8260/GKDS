import type { Metadata } from 'next';
import { CoursesEditor } from '@/components/admin/editors/courses-editor';

export const metadata: Metadata = { title: 'Courses' };

export default function Page() {
  return <CoursesEditor />;
}
