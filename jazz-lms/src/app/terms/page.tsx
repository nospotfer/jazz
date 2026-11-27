import type { Metadata } from 'next';
import { TermsOfSale } from '@/components/legal/terms-of-sale';
import { PUBLIC_SITE_ORIGIN, isPublicIndexingEnabled } from '@/lib/seo';

export function generateMetadata(): Metadata {
  const indexable = isPublicIndexingEnabled();
  return {
    title: 'Condiciones de venta y uso',
    description: 'Condiciones de compra y uso del curso La Cultura del Jazz, con garantía de devolución de 30 días.',
    alternates: { canonical: `${PUBLIC_SITE_ORIGIN}/terms` },
    robots: { index: indexable, follow: indexable },
  };
}

export default function TermsPage() {
  return <TermsOfSale />;
}
