import { dictionaries } from './dictionaries.js';

export function createI18n(initialLocale = 'en') {
  let locale = initialLocale in dictionaries ? initialLocale : 'en';
  const listeners = new Set();

  return {
    get locale() {
      return locale;
    },
    t(key) {
      return dictionaries[locale][key] ?? dictionaries.en[key] ?? key;
    },
    setLocale(next) {
      if (!(next in dictionaries)) throw new Error(`Unsupported locale: ${next}`);
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
