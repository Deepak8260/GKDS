import { notFound } from 'next/navigation';

// Anything under /or that is not a real page: show the Odia "page not found" page (with the Odia header and footer).
export default function UnknownOdiaPage() {
  notFound();
}
