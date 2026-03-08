export type SupportedLanguage = 'es' | 'en' | 'fr' | 'pt';

export const LANGUAGE_STORAGE_KEY = 'jazz-language-v1';
export const LANGUAGE_COOKIE_KEY = 'jazz_lang';

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['es', 'en', 'fr', 'pt'];

export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  es: 'ES',
  en: 'EN',
  fr: 'FR',
  pt: 'PT-BR',
};

export function normalizeLanguage(value?: string | null): SupportedLanguage {
  if (!value) return 'es';

  const normalized = value.toLowerCase();

  if (normalized === 'pt-br' || normalized === 'pt_br') {
    return 'pt';
  }

  if (SUPPORTED_LANGUAGES.includes(normalized as SupportedLanguage)) {
    return normalized as SupportedLanguage;
  }

  return 'es';
}

export function languageToHtmlLang(language: SupportedLanguage): string {
  if (language === 'pt') return 'pt-BR';
  return language;
}

export function languageToStripeLocale(language: SupportedLanguage): 'es' | 'en' | 'fr' | 'pt-BR' {
  if (language === 'pt') return 'pt-BR';
  return language;
}
