import { DEFAULT_WALLPAPER_ID, isWallpaperId } from '../environment/background/wallpaper-registry.js';

const STORAGE_KEY = 'portfolio-os:preferences';

export const DEFAULT_PREFERENCES = Object.freeze({
  version: 1,
  bootComplete: false,
  layout: 'auto',
  locale: 'en',
  audioEnabled: false,
  syncFrequency: '60Hz',
  trackingSensitivity: 50,
  doubleClickThreshold: 400,
  pointerAcceleration: true,
  linearDecay: false,
  snapToGrid: true,
  packetDitherRate: 50,
  protocolArchitecture: 'TCP/IP',
  encryptionLevel: true,
  wallpaperId: DEFAULT_WALLPAPER_ID,
});

const layouts = new Set(['auto', 'windows', 'macos']);
const locales = new Set(['en', 'zh-CN', 'ja']);
const syncFrequencies = new Set(['60Hz', '75Hz', '120Hz']);
const protocols = new Set(['TCP/IP', 'UDP', 'LOCAL']);

function numberInRange(value, fallback, min, max) {
  return Number.isFinite(value) && value >= min && value <= max ? value : fallback;
}

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
      syncFrequency: syncFrequencies.has(parsed.syncFrequency)
        ? parsed.syncFrequency : DEFAULT_PREFERENCES.syncFrequency,
      trackingSensitivity: numberInRange(
        parsed.trackingSensitivity, DEFAULT_PREFERENCES.trackingSensitivity, 25, 100,
      ),
      doubleClickThreshold: numberInRange(
        parsed.doubleClickThreshold, DEFAULT_PREFERENCES.doubleClickThreshold, 200, 700,
      ),
      pointerAcceleration: typeof parsed.pointerAcceleration === 'boolean'
        ? parsed.pointerAcceleration : DEFAULT_PREFERENCES.pointerAcceleration,
      linearDecay: typeof parsed.linearDecay === 'boolean'
        ? parsed.linearDecay : DEFAULT_PREFERENCES.linearDecay,
      snapToGrid: typeof parsed.snapToGrid === 'boolean'
        ? parsed.snapToGrid : DEFAULT_PREFERENCES.snapToGrid,
      packetDitherRate: numberInRange(
        parsed.packetDitherRate, DEFAULT_PREFERENCES.packetDitherRate, 0, 100,
      ),
      protocolArchitecture: protocols.has(parsed.protocolArchitecture)
        ? parsed.protocolArchitecture : DEFAULT_PREFERENCES.protocolArchitecture,
      encryptionLevel: typeof parsed.encryptionLevel === 'boolean'
        ? parsed.encryptionLevel : DEFAULT_PREFERENCES.encryptionLevel,
      wallpaperId: isWallpaperId(parsed.wallpaperId)
        ? parsed.wallpaperId : DEFAULT_PREFERENCES.wallpaperId,
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

export function resolvePreferredLocale(storage, browserLanguages = []) {
  try {
    const targetStorage = storage === undefined ? globalThis.localStorage : storage;
    const raw = targetStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.version === 1 && locales.has(parsed.locale)) return parsed.locale;
    }
  } catch {
    // Browser language remains available when storage is blocked or corrupt.
  }

  for (const language of browserLanguages ?? []) {
    const normalized = String(language).toLowerCase();
    if (normalized === 'zh-cn' || normalized.startsWith('zh-')) return 'zh-CN';
    if (normalized === 'ja' || normalized.startsWith('ja-')) return 'ja';
    if (normalized === 'en' || normalized.startsWith('en-')) return 'en';
  }
  return 'en';
}
