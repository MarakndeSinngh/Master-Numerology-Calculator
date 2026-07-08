import { translate, SupportedLanguage } from '../core/i18n';

/**
 * Strict translation helper.
 * Translates a key for the given language.
 * Logs a warning in development mode if the translation key is missing.
 */
export const tStrict = (lang: SupportedLanguage, key: string, params?: Record<string, any>): string => {
  const val = translate(lang, key, params, undefined);
  if (val === key || !val) {
    const isDev = (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') || 
                  (import.meta && (import.meta as any).env && (import.meta as any).env.DEV);
    if (isDev) {
      console.warn("Missing translation for key:", key, "in language:", lang);
    }
  }
  return val || key;
};

/**
 * Localized field helper.
 * Resolves a field on an item object using an optional key property.
 * If no key is present or translation is not found, falls back to the raw field value.
 */
export const localizedField = (
  lang: SupportedLanguage,
  item: any,
  fieldName: string,
  customParams?: Record<string, any>
): string => {
  if (!item) return '';
  const key = item[`${fieldName}Key`] || item[`${fieldName}TranslationKey`];
  
  // Build dynamic params for interpolation (e.g. rulerX, rulerY, sum, code)
  const params: Record<string, any> = {
    rulerX: item.rulerX ? translate(lang, `planets.${item.rulerX.toLowerCase()}`, undefined, item.rulerX) : '',
    rulerY: item.rulerY ? translate(lang, `planets.${item.rulerY.toLowerCase()}`, undefined, item.rulerY) : '',
    sum: item.sum !== undefined ? item.sum : '',
    code: item.code !== undefined ? item.code : '',
    name: item.name || '',
    ...customParams
  };

  if (!key) {
    return item[fieldName] || '';
  }

  const specificVal = translate(lang, key, params, undefined);
  if (specificVal && specificVal !== key) {
    return specificVal;
  }

  // Fallback to a general key if specific translation is missing
  const generalKey = `combinations.general.${fieldName}`;
  const generalVal = translate(lang, generalKey, params, undefined);
  if (generalVal && generalVal !== generalKey) {
    return generalVal;
  }

  return item[fieldName] || specificVal || '';
};

/**
 * Localized list helper.
 * Takes a raw list of strings and corresponding translation keys, and translates them.
 * Falls back to the raw list item if the translation key is missing or not translated.
 */
export const localizedList = (
  lang: SupportedLanguage,
  list: string[],
  keys: string[],
  params?: Record<string, any>
): string[] => {
  if (!list) return [];
  return list.map((item, idx) => {
    const key = keys && keys[idx];
    if (!key) return item;
    const val = translate(lang, key, params, undefined);
    return (val && val !== key) ? val : item;
  });
};
