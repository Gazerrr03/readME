import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getWallpaperDescriptor,
  listWallpaperMetadata,
} from '../../scripts/environment/background/wallpaper-registry.js';

test('registry exposes two unique static metadata records without renderer factories', () => {
  const metadata = listWallpaperMetadata();
  assert.deepEqual(metadata.map(({ id }) => id), ['blue-fluid-halftone', 'flow-shards']);
  assert.equal(new Set(metadata.map(({ id }) => id)).size, metadata.length);
  assert.equal(metadata.some((entry) => 'loadRenderer' in entry), false);
  assert.equal(getWallpaperDescriptor('missing'), null);
});
