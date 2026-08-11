import { dictionaries } from './dictionaries.js';

export function createI18n(initialLocale = 'en', dictionarySource = dictionaries) {
  let locale = Object.hasOwn(dictionarySource, initialLocale) ? initialLocale : 'en';
  const listeners = new Set();

  return {
    get locale() {
      return locale;
    },
    t(key) {
      return dictionarySource[locale][key] ?? dictionarySource.en[key] ?? key;
    },
    setLocale(next) {
      if (!Object.hasOwn(dictionarySource, next)) throw new Error(`Unsupported locale: ${next}`);
      if (locale === next) return;
      locale = next;
      listeners.forEach((listener) => listener(locale));
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
