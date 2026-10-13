import type { Metadata, MetadataRoute } from 'next';

export const PUBLIC_SITE_ORIGIN = 'https://www.culturadeljazz.com';
export const PUBLIC_SITE_TITLE = 'La Cultura del Jazz';
export const PUBLIC_SITE_DESCRIPTION = 'Descubre el jazz con Enric Vázquez Ramonich. Un curso online de 15 lecciones para aprender a escuchar, entender y disfrutar la música. Primera lección gratis al registrarte.';

type DeploymentEnvironment = {
  VERCEL_ENV?: string;
  APP_URL?: string;
  NEXT_PUBLIC_APP_URL?: string;
};

/** Only the verified production domain is indexable; previews and local copies fail closed. */
export function isPublicIndexingEnabled(environment: DeploymentEnvironment = {
  VERCEL_ENV: process.env.VERCEL_ENV, APP_URL: process.env.APP_URL, NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
}) {
  if (environment.VERCEL_ENV !== 'production') return false;
  for (const value of [environment.APP_URL, environment.NEXT_PUBLIC_APP_URL]) {
    if (!value?.trim()) continue;
    try {
      const url = new URL(value);
      if (url.protocol !== 'https:' || !['culturadeljazz.com', 'www.culturadeljazz.com'].includes(url.hostname) || url.port || url.username || url.password) return false;
    } catch { return false; }
  }
  return true;
}

export function publicHomeMetadata(indexable = isPublicIndexingEnabled()): Metadata {
  return {
    title: { absolute: PUBLIC_SITE_TITLE },
    description: PUBLIC_SITE_DESCRIPTION,
    alternates: { canonical: `${PUBLIC_SITE_ORIGIN}/` },
    robots: { index: indexable, follow: indexable },
    openGraph: {
      type: 'website', locale: 'es_ES', url: `${PUBLIC_SITE_ORIGIN}/`,
      siteName: PUBLIC_SITE_TITLE, title: PUBLIC_SITE_TITLE, description: PUBLIC_SITE_DESCRIPTION,
      images: [{ url: '/images/Logo.jpeg', width: 750, height: 422, alt: PUBLIC_SITE_TITLE }],
    },
    twitter: {
      card: 'summary_large_image', title: PUBLIC_SITE_TITLE, description: PUBLIC_SITE_DESCRIPTION,
      images: ['/images/Logo.jpeg'],
    },
  };
}

export function publicRobots(indexable = isPublicIndexingEnabled()): MetadataRoute.Robots {
  if (!indexable) return { rules: { userAgent: '*', disallow: '/' } };
  return {
    rules: {
      userAgent: '*', allow: '/',
      disallow: ['/auth', '/admin', '/dashboard', '/courses', '/redeem', '/api', '/*?*'],
    },
    sitemap: `${PUBLIC_SITE_ORIGIN}/sitemap.xml`,
  };
}

export function publicSitemap(indexable = isPublicIndexingEnabled()): MetadataRoute.Sitemap {
  return indexable ? [{ url: `${PUBLIC_SITE_ORIGIN}/`, changeFrequency: 'monthly', priority: 1 }] : [];
}
