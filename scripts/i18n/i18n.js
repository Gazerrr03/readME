import { dictionaries } from './dictionaries.js';

export function createI18n(initialLocale = 'en', dictionarySource = dictionaries, contentStore = null) {
  const source = () => contentStore?.snapshot.dictionaries ?? dictionarySource;
  let locale = Object.hasOwn(source(), initialLocale) ? initialLocale : 'en';
  const listeners = new Set();
  const notify = () => listeners.forEach((listener) => listener(locale));
  contentStore?.subscribe(notify);

  return {
    get locale() {
      return locale;
    },
    t(key) {
      return source()[locale][key] ?? source().en[key] ?? key;
    },
    setLocale(next) {
      if (!Object.hasOwn(source(), next)) throw new Error(`Unsupported locale: ${next}`);
      if (locale === next) return;
      locale = next;
      notify();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
