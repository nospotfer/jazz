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
  }[language];

  return (
    <div
      className="inline-flex items-center rounded-md border border-yellow-500/50 overflow-hidden"
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
                ? 'bg-yellow-500 text-black'
                : 'bg-transparent text-gray-700 dark:text-gray-200 hover:bg-yellow-500/20'
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
