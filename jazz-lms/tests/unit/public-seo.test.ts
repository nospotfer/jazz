import { describe, expect, test } from 'vitest';
import { isPublicIndexingEnabled, publicHomeMetadata, publicRobots, publicSitemap } from '@/lib/seo';

describe('public indexing boundaries', () => {
  test.each([
    {}, { VERCEL_ENV: 'preview' }, { VERCEL_ENV: 'development' },
    { VERCEL_ENV: 'production', APP_URL: 'http://127.0.0.1:3007' },
    { VERCEL_ENV: 'production', NEXT_PUBLIC_APP_URL: 'http://localhost:3007' },
    { VERCEL_ENV: 'production', APP_URL: 'https://preview.vercel.app' },
    { VERCEL_ENV: 'production', APP_URL: 'https://www.culturadeljazz.com.attacker.example' },
    { VERCEL_ENV: 'production', APP_URL: 'invalid' },
  ])('preview/local/malformed deployment fails closed: %j', environment => {
    expect(isPublicIndexingEnabled(environment)).toBe(false);
  });
  test('verified production domain is indexable; conflicting public origin is excluded', () => {
    expect(isPublicIndexingEnabled({ VERCEL_ENV: 'production', APP_URL: 'https://culturadeljazz.com', NEXT_PUBLIC_APP_URL: 'https://www.culturadeljazz.com' })).toBe(true);
    expect(isPublicIndexingEnabled({ VERCEL_ENV: 'production', APP_URL: 'https://culturadeljazz.com', NEXT_PUBLIC_APP_URL: 'https://preview.vercel.app' })).toBe(false);
  });
  test('preview robots denies all paths and offers no indexable sitemap entries', () => {
    expect(publicRobots(false)).toEqual({ rules: { userAgent: '*', disallow: '/' } });
    expect(publicSitemap(false)).toEqual([]);
  });
  test('production sitemap contains only canonical public homepage, not accounts or courses', () => {
    expect(publicSitemap(true).map(entry => entry.url)).toEqual(['https://www.culturadeljazz.com/']);
    expect(publicRobots(true)).toMatchObject({ rules: { disallow: expect.arrayContaining(['/auth', '/dashboard', '/admin', '/api', '/*?*']) } });
  });
  test('homepage metadata is shareable without inventing price, refund or credentials', () => {
    const metadata = publicHomeMetadata(true);
    expect(metadata.alternates?.canonical).toBe('https://www.culturadeljazz.com/');
    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(publicHomeMetadata(false).robots).toEqual({ index: false, follow: false });
    expect(metadata.description).toMatch(/15 lecciones/);
    expect(metadata.openGraph).toMatchObject({ url: 'https://www.culturadeljazz.com/', type: 'website' });
  });
});
