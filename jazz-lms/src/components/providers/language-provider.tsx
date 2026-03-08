'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  LANGUAGE_COOKIE_KEY,
  LANGUAGE_STORAGE_KEY,
  SupportedLanguage,
  languageToHtmlLang,
  normalizeLanguage,
} from '@/lib/language';

interface LanguageContextValue {
  language: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [language, setLanguage] = useState<SupportedLanguage>('es');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const local = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      const cookieValue = document.cookie
        .split('; ')
        .find((entry) => entry.startsWith(`${LANGUAGE_COOKIE_KEY}=`))
        ?.split('=')[1];

      const initialLanguage = normalizeLanguage(local || cookieValue || 'es');
      setLanguage(initialLanguage);
    } finally {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    if (!isReady) return;

    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    document.cookie = `${LANGUAGE_COOKIE_KEY}=${language}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = languageToHtmlLang(language);
  }, [language, isReady]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }

  return context;
}
