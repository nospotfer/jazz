import { describe, expect, test } from 'vitest';
import {
  normalizeLanguage,
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
  });
});
