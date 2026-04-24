'use client';

import { LANGUAGE_LABELS, SUPPORTED_LANGUAGES, SupportedLanguage } from '@/lib/language';
import { useLanguage } from '@/components/providers/language-provider';

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const label = {
    es: 'Selector de idioma',
    en: 'Language selector',
    fr: 'Sélecteur de langue',
    pt: 'Seletor de idioma',
  }[language === 'pt' ? 'es' : language];

  return (
    <div
      className="inline-flex items-center rounded-md border border-[var(--color-jazz-title-accent)]/60 overflow-hidden"
      aria-label={label}
    >
      {SUPPORTED_LANGUAGES.map((currentLanguage) => {
        const isActive = language === currentLanguage;

        return (
          <button
            key={currentLanguage}
            onClick={() => setLanguage(currentLanguage as SupportedLanguage)}
            className={`px-2 py-1 text-[10px] sm:text-xs font-semibold transition-colors ${
              isActive
                ? 'bg-[var(--color-jazz-cta)] text-black'
                : 'bg-transparent text-gray-700 dark:text-gray-200 hover:bg-[var(--color-jazz-title-accent)]/20'
            }`}
            aria-pressed={isActive}
          >
            {LANGUAGE_LABELS[currentLanguage]}
          </button>
        );
      })}
    </div>
  );
}
