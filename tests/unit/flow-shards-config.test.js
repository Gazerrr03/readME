import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FLOW_SHARDS_CONTROLS,
  FLOW_SHARDS_DEFAULT_CONFIG,
  FLOW_SHARDS_PRESETS,
  mapFlowShardsConfig,
  matchFlowShardsPreset,
  normalizeFlowShardsConfig,
} from '../../scripts/environment/background/wallpapers/flow-shards/config.js';
import { serializeWallpaperConfig } from '../../scripts/environment/background/wallpaper-registry.js';

test('flow config repairs unknown, malformed, and out-of-range values', () => {
  assert.deepEqual(normalizeFlowShardsConfig({
    density: 'huge', speed: -5, glow: 140,
    backgroundColor: 'navy', shardColor: '#abcdef', ignored: true,
  }), {
    ...FLOW_SHARDS_DEFAULT_CONFIG,
    speed: 0,
    glow: 100,
    shardColor: '#ABCDEF',
  });
});

test('density tiers and semantic endpoints map to bounded renderer values', () => {
  assert.equal(mapFlowShardsConfig({ density: 'low' }).simulationSize, 64);
  assert.equal(mapFlowShardsConfig({ density: 'medium' }).simulationSize, 96);
  assert.equal(mapFlowShardsConfig({ density: 'high' }).simulationSize, 128);
  assert.equal(mapFlowShardsConfig({ speed: 0 }).timeScale, 0.25);
  assert.equal(mapFlowShardsConfig({ speed: 100 }).timeScale, 2);
});

test('reference preset matches the original lab palette, density, and motion profile', () => {
  assert.equal(FLOW_SHARDS_DEFAULT_CONFIG.density, 'high');
  assert.equal(FLOW_SHARDS_DEFAULT_CONFIG.backgroundColor, '#000000');
  assert.equal(FLOW_SHARDS_DEFAULT_CONFIG.shardColor, '#FF3C3C');

  const mapped = mapFlowShardsConfig(FLOW_SHARDS_DEFAULT_CONFIG);
  assert.equal(mapped.simulationSize, 128);
  assert.ok(Math.abs(mapped.timeScale - 1) < 0.02);
  assert.ok(Math.abs(mapped.noiseScale - 1) < 0.02);
  assert.ok(Math.abs(mapped.curlStrength - 1) < 0.02);
  assert.ok(Math.abs(mapped.lifeSeconds - 5.55) < 0.05);
  assert.ok(Math.abs(mapped.spawnRadius - 1) < 0.06);
  assert.ok(Math.abs(mapped.baseSize - 1.15) < 0.05);
  assert.ok(Math.abs(mapped.stretch - 1) < 0.06);
  assert.ok(Math.abs(mapped.bloomStrength - 1.43) < 0.02);
  assert.ok(Math.abs(mapped.bloomThreshold - 0.34) < 0.02);
});

test('wallpaper export is deterministic and excludes unknown fields', () => {
  const first = serializeWallpaperConfig('flow-shards', { speed: 42, ignored: true });
  const second = serializeWallpaperConfig('flow-shards', { ignored: false, speed: 42 });
  assert.equal(first, second);
  assert.deepEqual(JSON.parse(first), {
    schemaVersion: 1,
    wallpaperId: 'flow-shards',
    config: normalizeFlowShardsConfig({ speed: 42 }),
  });
});

test('controls preserve the normalized key order and localized UI text', () => {
  assert.deepEqual(FLOW_SHARDS_CONTROLS.map(({ key }) => key), Object.keys(FLOW_SHARDS_DEFAULT_CONFIG));
  assert.equal(FLOW_SHARDS_CONTROLS[0].type, 'select');
  assert.deepEqual(FLOW_SHARDS_CONTROLS.slice(1, 10).map(({ type }) => type), Array(9).fill('range'));
  assert.deepEqual(FLOW_SHARDS_CONTROLS.slice(10).map(({ type }) => type), ['color', 'color']);
  for (const control of FLOW_SHARDS_CONTROLS) {
    for (const field of ['label', 'description']) {
      assert.deepEqual(Object.keys(control[field]), ['en', 'zh-CN', 'ja']);
    }
  }
});

test('preset matching compares normalized semantic config', () => {
  assert.deepEqual(Object.keys(FLOW_SHARDS_PRESETS), ['calm', 'reference', 'intense']);
  assert.equal(matchFlowShardsPreset(FLOW_SHARDS_PRESETS.calm), 'calm');
  assert.equal(matchFlowShardsPreset({ ...FLOW_SHARDS_PRESETS.reference, ignored: true }), 'reference');
  assert.equal(matchFlowShardsPreset({ speed: 1 }), null);
});
