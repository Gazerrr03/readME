import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_PREFERENCES, loadPreferences, savePreferences } from '../../scripts/state/preferences.js';

const memoryStorage = (value = null) => ({
  value,
  getItem() { return this.value; },
  setItem(_key, next) { this.value = next; },
});

const withBlockedLocalStorage = (callback) => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get() {
      throw new DOMException('Storage access is blocked', 'SecurityError');
    },
  });
  try {
    return callback();
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor);
    else delete globalThis.localStorage;
  }
};

test('uses defaults without saved preferences', () => {
  assert.deepEqual(loadPreferences(memoryStorage()), DEFAULT_PREFERENCES);
});

test('repairs invalid fields while preserving valid fields', () => {
  const storage = memoryStorage(JSON.stringify({
    version: 1,
    bootComplete: true,
    layout: 'invalid',
    locale: 'ja',
    audioEnabled: false,
  }));
  assert.deepEqual(loadPreferences(storage), {
    ...DEFAULT_PREFERENCES,
    bootComplete: true,
    locale: 'ja',
  });
});

test('corrupt JSON returns complete defaults', () => {
  assert.deepEqual(loadPreferences(memoryStorage('{broken')), DEFAULT_PREFERENCES);
});

test('save serializes the validated shape', () => {
  const storage = memoryStorage();
  savePreferences(storage, { ...DEFAULT_PREFERENCES, layout: 'macos' });
  assert.equal(JSON.parse(storage.value).layout, 'macos');
});

test('uses defaults when acquiring localStorage is blocked', () => {
  withBlockedLocalStorage(() => {
    assert.deepEqual(loadPreferences(), DEFAULT_PREFERENCES);
  });
});

test('returns validated preferences when acquiring localStorage is blocked during save', () => {
  withBlockedLocalStorage(() => {
    assert.deepEqual(
      savePreferences(undefined, { ...DEFAULT_PREFERENCES, locale: 'ja' }),
      { ...DEFAULT_PREFERENCES, locale: 'ja' },
    );
  });
});
