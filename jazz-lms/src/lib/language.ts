export type SupportedLanguage = 'es' | 'en' | 'fr' | 'pt';

export const LANGUAGE_STORAGE_KEY = 'jazz-language-v1';
export const LANGUAGE_COOKIE_KEY = 'jazz_lang';
export const DEFAULT_LANGUAGE: SupportedLanguage = 'es';

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['es', 'en', 'fr', 'pt'];

export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  es: 'ES',
  en: 'EN',
  fr: 'FR',
  pt: 'PT-BR',
};

const COUNTRY_LANGUAGE_FALLBACKS: Partial<Record<string, SupportedLanguage>> = {
  US: 'en',
  GB: 'en',
  IE: 'en',
  AU: 'en',
  NZ: 'en',
  CA: 'en',
  FR: 'fr',
  BE: 'fr',
  LU: 'fr',
  MC: 'fr',
  BR: 'pt',
  PT: 'pt',
};

export function matchSupportedLanguageTag(value?: string | null): SupportedLanguage | null {
  if (!value) return null;

  const normalized = value.toLowerCase().trim().replace(/_/g, '-');
  if (!normalized) return null;

  if (normalized === 'pt-br') {
    return 'pt';
  }

  if (SUPPORTED_LANGUAGES.includes(normalized as SupportedLanguage)) {
    return normalized as SupportedLanguage;
  }

  const primaryTag = normalized.split('-')[0];
  if (SUPPORTED_LANGUAGES.includes(primaryTag as SupportedLanguage)) {
    return primaryTag as SupportedLanguage;
  }

  return null;
}

export function detectLanguageFromAcceptLanguage(value?: string | null): SupportedLanguage | null {
  if (!value) return null;

  const ranked = value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry, index) => {
      const [tag, ...params] = entry.split(';').map((part) => part.trim());
      const qualityParam = params.find((param) => param.startsWith('q='));
      const quality = qualityParam ? Number.parseFloat(qualityParam.slice(2)) : 1;

      return {
        tag,
        quality: Number.isFinite(quality) ? quality : 0,
        index,
      };
    })
    .sort((a, b) => {
      if (b.quality === a.quality) {
        return a.index - b.index;
      }

      return b.quality - a.quality;
    });

  for (const item of ranked) {
    const match = matchSupportedLanguageTag(item.tag);
    if (match) {
      return match;
    }
  }

  return null;
}

export function detectLanguageFromCountry(value?: string | null): SupportedLanguage | null {
  const country = value?.trim().toUpperCase();
  if (!country) return null;

  return COUNTRY_LANGUAGE_FALLBACKS[country] ?? null;
}

export function resolvePreferredLanguage(options: {
  acceptLanguageHeader?: string | null;
  countryCode?: string | null;
}): SupportedLanguage {
  const fromAcceptLanguage = detectLanguageFromAcceptLanguage(options.acceptLanguageHeader);
  if (fromAcceptLanguage) {
    return fromAcceptLanguage;
  }

  const fromCountry = detectLanguageFromCountry(options.countryCode);
  if (fromCountry) {
    return fromCountry;
  }

  return DEFAULT_LANGUAGE;
}

export function normalizeLanguage(value?: string | null): SupportedLanguage {
  return matchSupportedLanguageTag(value) ?? DEFAULT_LANGUAGE;
}

export function languageToHtmlLang(language: SupportedLanguage): string {
  if (language === 'pt') return 'pt-BR';
  return language;
}

export function languageToCheckoutLocale(language: SupportedLanguage): 'es' | 'en' | 'fr' | 'pt-BR' {
  if (language === 'pt') return 'pt-BR';
  return language;
}
