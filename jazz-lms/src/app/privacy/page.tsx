import type { Metadata } from 'next';
import { PrivacyPolicy } from '@/components/legal/privacy-policy';
import { PUBLIC_SITE_ORIGIN, isPublicIndexingEnabled } from '@/lib/seo';

export function generateMetadata(): Metadata {
  const indexable = isPublicIndexingEnabled();
  return {
    title: 'Política de privacidad',
    description: 'Cómo trata La Cultura del Jazz tus datos personales y qué derechos tienes.',
    alternates: { canonical: `${PUBLIC_SITE_ORIGIN}/privacy` },
    robots: { index: indexable, follow: indexable },
  };
}

export default function PrivacyPage() {
  return <PrivacyPolicy />;
}
