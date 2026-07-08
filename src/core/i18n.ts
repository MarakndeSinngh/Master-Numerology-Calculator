import {
  SUPPORTED_LANGUAGES as jsLanguages,
  TRANSLATIONS as jsTranslations,
  detectLanguage as jsDetectLanguage,
  applyLanguageSettings as jsApplyLanguageSettings,
  translate as jsTranslate
} from './i18n.js';

export type SupportedLanguage = 'en' | 'hi' | 'gu' | 'mr' | 'es' | 'fr' | 'ar' | 'zh' | 'ja' | 'pt' | 'ta' | 'te' | 'bn' | 'de' | 'ru';

export interface LanguageConfig {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  dir: 'ltr' | 'rtl';
  fontClass: string;
  googleFontUrl?: string;
}

// Re-export the JS objects casted to the correct TypeScript signatures
export const SUPPORTED_LANGUAGES = jsLanguages as LanguageConfig[];
export const TRANSLATIONS = jsTranslations as Record<SupportedLanguage, Record<string, string>>;
export const detectLanguage = jsDetectLanguage as () => SupportedLanguage;
export const applyLanguageSettings = jsApplyLanguageSettings as (lang: SupportedLanguage) => void;
export const translate = jsTranslate as (
  lang: SupportedLanguage,
  key: string,
  params?: Record<string, any>,
  fallback?: string
) => string;
