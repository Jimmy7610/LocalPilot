// ──────────────────────────────────────────
// LocalPilot — i18n Provider
// ──────────────────────────────────────────

import { createContext, useContext, useMemo } from 'react';
import type { Language } from '@/types';
import type { TranslationKeys } from './en';
import en from './en';
import sv from './sv';

const translations: Record<Language, TranslationKeys> = { en, sv };

const I18nContext = createContext<TranslationKeys>(en);
const LanguageContext = createContext<{
  language: Language;
  setLanguage: (lang: Language) => void;
}>({
  language: 'en',
  setLanguage: () => {},
});

export function I18nProvider({
  language,
  setLanguage,
  children,
}: {
  language: Language;
  setLanguage: (lang: Language) => void;
  children: React.ReactNode;
}) {
  const t = useMemo(() => translations[language], [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      <I18nContext.Provider value={t}>{children}</I18nContext.Provider>
    </LanguageContext.Provider>
  );
}

export function useT(): TranslationKeys {
  return useContext(I18nContext);
}

export function useLanguage() {
  return useContext(LanguageContext);
}
