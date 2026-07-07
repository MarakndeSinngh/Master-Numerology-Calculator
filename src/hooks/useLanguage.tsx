import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  SupportedLanguage, 
  SUPPORTED_LANGUAGES, 
  TRANSLATIONS, 
  detectLanguage, 
  applyLanguageSettings 
} from '../core/i18n';

interface LanguageContextType {
  lang: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string, fallback?: string) => string;
  dir: 'ltr' | 'rtl';
  isRtl: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<SupportedLanguage>('en');

  useEffect(() => {
    // Detect initial language
    const initialLang = detectLanguage();
    setLang(initialLang);
    applyLanguageSettings(initialLang);
  }, []);

  const setLanguage = (newLang: SupportedLanguage) => {
    setLang(newLang);
    localStorage.setItem('user-language', newLang);
    applyLanguageSettings(newLang);

    // Sync localized path prefix without full page reload
    const currentHash = window.location.hash || window.location.pathname;
    const cleanHash = currentHash.replace(/\/(en|hi|gu|mr|es|fr|ar)\/?/, '');
    
    // Update hash with lang prefix for SEO mapping
    window.location.hash = `/${newLang}${cleanHash || '/mobile-numerology'}`;
  };

  const t = (key: string, fallback?: string): string => {
    const translationSet = TRANSLATIONS[lang] || TRANSLATIONS['en'];
    return translationSet[key] || TRANSLATIONS['en'][key] || fallback || key;
  };

  const currentConfig = SUPPORTED_LANGUAGES.find(l => l.code === lang) || SUPPORTED_LANGUAGES[0];
  const dir = currentConfig.dir;
  const isRtl = dir === 'rtl';

  return (
    <LanguageContext.Provider value={{ lang, setLanguage, t, dir, isRtl }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
