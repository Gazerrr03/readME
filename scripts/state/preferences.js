const STORAGE_KEY = 'portfolio-os:preferences';

export const DEFAULT_PREFERENCES = Object.freeze({
  version: 1,
  bootComplete: false,
  layout: 'auto',
  locale: 'en',
  audioEnabled: false,
});

const layouts = new Set(['auto', 'windows', 'macos']);
const locales = new Set(['en', 'zh-CN', 'ja']);

export function loadPreferences(storage) {
  try {
    const targetStorage = storage === undefined ? globalThis.localStorage : storage;
    const raw = targetStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFERENCES };
    const parsed = JSON.parse(raw);
    if (parsed.version !== 1) return { ...DEFAULT_PREFERENCES };
    return {
      version: 1,
      bootComplete: typeof parsed.bootComplete === 'boolean' ? parsed.bootComplete : false,
      layout: layouts.has(parsed.layout) ? parsed.layout : 'auto',
      locale: locales.has(parsed.locale) ? parsed.locale : 'en',
      audioEnabled: typeof parsed.audioEnabled === 'boolean' ? parsed.audioEnabled : false,
    };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export function savePreferences(storage, preferences) {
  const validated = loadPreferences({ getItem: () => JSON.stringify(preferences) });
  try {
    const targetStorage = storage === undefined ? globalThis.localStorage : storage;
    targetStorage.setItem(STORAGE_KEY, JSON.stringify(validated));
  } catch {
    // In-memory session continues.
  }
  return validated;
}
