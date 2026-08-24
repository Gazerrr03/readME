import test from 'node:test';
import assert from 'node:assert/strict';
import {
  loadWallpaperDraft,
  loadWallpaperPreview,
  saveWallpaperDraft,
  saveWallpaperPreview,
} from '../../scripts/environment/background/wallpaper-storage.js';

const memoryStorage = () => {
  const values = new Map();
  return {
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, value); },
    put(key, value) { values.set(key, value); },
  };
};

test('draft and applied preview are separate normalized records', () => {
  const storage = memoryStorage();
  saveWallpaperDraft(storage, 'flow-shards', { speed: 77 });
  assert.equal(loadWallpaperDraft(storage, 'flow-shards').speed, 77);
  assert.equal(loadWallpaperPreview(storage, 'flow-shards'), null);
  saveWallpaperPreview(storage, 'flow-shards', { speed: 31 });
  assert.equal(loadWallpaperDraft(storage, 'flow-shards').speed, 77);
  assert.equal(loadWallpaperPreview(storage, 'flow-shards').speed, 31);
});

test('storage rejects corrupt envelopes and repairs configurations after loading', () => {
  const storage = memoryStorage();
  storage.put('portfolio-os:wallpaper-lab:v1', '{broken');
  storage.put('portfolio-os:wallpaper-preview:v1', JSON.stringify({
    version: 1,
    wallpaperId: 'blue-fluid-halftone',
    config: {},
  }));
  assert.equal(loadWallpaperDraft(storage, 'flow-shards'), null);
  assert.equal(loadWallpaperPreview(storage, 'flow-shards'), null);

  storage.put('portfolio-os:wallpaper-lab:v1', JSON.stringify({
    version: 1,
    drafts: { 'flow-shards': { speed: -20 } },
  }));
  assert.equal(loadWallpaperDraft(storage, 'flow-shards').speed, 0);
});
