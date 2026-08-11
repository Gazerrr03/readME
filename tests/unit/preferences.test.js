import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_PREFERENCES, loadPreferences, savePreferences } from '../../scripts/state/preferences.js';

const memoryStorage = (value = null) => ({
  value,
  getItem() { return this.value; },
  setItem(_key, next) { this.value = next; },
});

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
