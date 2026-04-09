import { describe, expect, test } from 'vitest';
import {
  DEFAULT_LANGUAGE,
  detectLanguageFromAcceptLanguage,
  detectLanguageFromCountry,
  normalizeLanguage,
  resolvePreferredLanguage,
  matchSupportedLanguageTag,
  languageToHtmlLang,
  languageToCheckoutLocale,
  SUPPORTED_LANGUAGES,
  LANGUAGE_LABELS,
  LANGUAGE_STORAGE_KEY,
  LANGUAGE_COOKIE_KEY,
} from '@/lib/language';

describe('normalizeLanguage', () => {
  test('returns es as default for null/undefined/empty', () => {
    expect(normalizeLanguage(null)).toBe('es');
    expect(normalizeLanguage(undefined)).toBe('es');
    expect(normalizeLanguage('')).toBe('es');
  });

  test('normalizes pt-br and pt_br to pt', () => {
    expect(normalizeLanguage('pt-br')).toBe('pt');
    expect(normalizeLanguage('pt-BR')).toBe('pt');
    expect(normalizeLanguage('PT-BR')).toBe('pt');
    expect(normalizeLanguage('pt_br')).toBe('pt');
    expect(normalizeLanguage('PT_BR')).toBe('pt');
  });

  test('accepts supported languages directly', () => {
    expect(normalizeLanguage('es')).toBe('es');
    expect(normalizeLanguage('en')).toBe('en');
    expect(normalizeLanguage('fr')).toBe('fr');
    expect(normalizeLanguage('pt')).toBe('pt');
  });

  test('falls back to es for unsupported languages', () => {
    expect(normalizeLanguage('de')).toBe('es');
    expect(normalizeLanguage('it')).toBe('es');
    expect(normalizeLanguage('zh')).toBe('es');
    expect(normalizeLanguage('random-value')).toBe('es');
  });

  test('is case-insensitive', () => {
    expect(normalizeLanguage('ES')).toBe('es');
    expect(normalizeLanguage('En')).toBe('en');
    expect(normalizeLanguage('FR')).toBe('fr');
  });

  test('normalizes regional language tags', () => {
    expect(normalizeLanguage('en-US')).toBe('en');
    expect(normalizeLanguage('fr-FR')).toBe('fr');
    expect(normalizeLanguage('es-MX')).toBe('es');
    expect(normalizeLanguage('pt-PT')).toBe('pt');
  });
});

describe('matchSupportedLanguageTag', () => {
  test('returns null for unknown values', () => {
    expect(matchSupportedLanguageTag('de-DE')).toBeNull();
    expect(matchSupportedLanguageTag('')).toBeNull();
    expect(matchSupportedLanguageTag(null)).toBeNull();
  });

  test('accepts both language-only and regional tags', () => {
    expect(matchSupportedLanguageTag('en')).toBe('en');
    expect(matchSupportedLanguageTag('en-US')).toBe('en');
    expect(matchSupportedLanguageTag('fr-CA')).toBe('fr');
    expect(matchSupportedLanguageTag('pt-BR')).toBe('pt');
  });
});

describe('detectLanguageFromAcceptLanguage', () => {
  test('returns highest-priority supported language', () => {
    expect(detectLanguageFromAcceptLanguage('fr-FR,fr;q=0.9,en;q=0.8')).toBe('fr');
    expect(detectLanguageFromAcceptLanguage('en-US,en;q=0.9,es;q=0.8')).toBe('en');
    expect(detectLanguageFromAcceptLanguage('de-DE,de;q=0.9,es;q=0.7')).toBe('es');
  });

  test('returns null when no supported language is found', () => {
    expect(detectLanguageFromAcceptLanguage('de-DE,de;q=0.9,it;q=0.8')).toBeNull();
    expect(detectLanguageFromAcceptLanguage(undefined)).toBeNull();
  });
});

describe('detectLanguageFromCountry', () => {
  test('maps supported country fallbacks', () => {
    expect(detectLanguageFromCountry('US')).toBe('en');
    expect(detectLanguageFromCountry('fr')).toBe('fr');
    expect(detectLanguageFromCountry('BR')).toBe('pt');
  });

  test('returns null for unknown countries', () => {
    expect(detectLanguageFromCountry('DE')).toBeNull();
    expect(detectLanguageFromCountry(undefined)).toBeNull();
  });
});

describe('resolvePreferredLanguage', () => {
  test('prefers accept-language over country fallback', () => {
    expect(
      resolvePreferredLanguage({
        acceptLanguageHeader: 'fr-FR,fr;q=0.9,en;q=0.8',
        countryCode: 'US',
      }),
    ).toBe('fr');
  });

  test('uses country fallback when accept-language is unsupported', () => {
    expect(
      resolvePreferredLanguage({
        acceptLanguageHeader: 'de-DE,de;q=0.9',
        countryCode: 'US',
      }),
    ).toBe('en');
  });

  test('falls back to default language when no signal is available', () => {
    expect(
      resolvePreferredLanguage({
        acceptLanguageHeader: null,
        countryCode: null,
      }),
    ).toBe(DEFAULT_LANGUAGE);
  });
});

describe('languageToHtmlLang', () => {
  test('maps pt to pt-BR', () => {
    expect(languageToHtmlLang('pt')).toBe('pt-BR');
  });

  test('returns other languages unchanged', () => {
    expect(languageToHtmlLang('es')).toBe('es');
    expect(languageToHtmlLang('en')).toBe('en');
    expect(languageToHtmlLang('fr')).toBe('fr');
  });
});

describe('languageToCheckoutLocale', () => {
  test('maps pt to pt-BR', () => {
    expect(languageToCheckoutLocale('pt')).toBe('pt-BR');
  });

  test('returns other languages unchanged', () => {
    expect(languageToCheckoutLocale('es')).toBe('es');
    expect(languageToCheckoutLocale('en')).toBe('en');
    expect(languageToCheckoutLocale('fr')).toBe('fr');
  });
});

describe('language constants', () => {
  test('SUPPORTED_LANGUAGES contains all 4 languages', () => {
    expect(SUPPORTED_LANGUAGES).toEqual(['es', 'en', 'fr', 'pt']);
    expect(SUPPORTED_LANGUAGES).toHaveLength(4);
  });

  test('LANGUAGE_LABELS maps all supported languages', () => {
    expect(LANGUAGE_LABELS.es).toBe('ES');
    expect(LANGUAGE_LABELS.en).toBe('EN');
    expect(LANGUAGE_LABELS.fr).toBe('FR');
    expect(LANGUAGE_LABELS.pt).toBe('PT-BR');
  });

  test('storage and cookie keys are defined', () => {
    expect(LANGUAGE_STORAGE_KEY).toBe('jazz-language-v1');
    expect(LANGUAGE_COOKIE_KEY).toBe('jazz_lang');
    expect(DEFAULT_LANGUAGE).toBe('es');
  });
});
