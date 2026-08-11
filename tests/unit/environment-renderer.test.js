import test from 'node:test';
import assert from 'node:assert/strict';
import { JACKET_MAP } from '../../scripts/environment/jacket-map.js';
import { createEnvironmentRenderer } from '../../scripts/environment/environment-renderer.js';

function createHarness() {
  const textCalls = [];
  const draws = [];
  const context = {
    setTransform() {},
    clearRect() {},
    fillRect() { draws.push([]); },
    fillText: (...args) => {
      textCalls.push(args);
      draws.at(-1)?.push(args);
    },
    save() {},
    restore() {},
    set fillStyle(value) {},
    set font(value) {},
    set globalAlpha(value) {},
    set textBaseline(value) {},
  };
  let pending = null;
  const scheduler = {
    request(callback) { pending = callback; return 1; },
    cancel() { pending = null; },
    flush(time) { const callback = pending; pending = null; callback?.(time); },
    hasPending() { return pending !== null; },
  };
  return {
    canvas: { width: 0, height: 0, style: {}, getContext: () => context },
    scheduler,
    textCalls,
    draws,
  };
}

function createTerrainMap(value = 150) {
  return { width: 20, height: 5, values: Array(100).fill(value) };
}

function createGradientMap() {
  return {
    width: 20,
    height: 5,
    values: Array.from({ length: 100 }, (_, index) => 100 + index),
  };
}

function renderPointer(pointer) {
  const harness = createHarness();
  const renderer = createEnvironmentRenderer({
    canvas: harness.canvas,
    terrainMap: createGradientMap(),
    scheduler: harness.scheduler,
  });
  renderer.resize({ width: 220, height: 70, quietZones: [] });
  renderer.setMotionState('running');
  renderer.setPointer(pointer);
  harness.draws.length = 0;
  for (let time = 100; time <= 600; time += 100) harness.scheduler.flush(time);
  return harness.draws.at(-1);
}

test('generated jacket map carries source attribution and normalized values', () => {
  assert.equal(JACKET_MAP.sourcePage, 'https://music.apple.com/jp/album/%E3%81%A0%E3%81%8B%E3%82%89%E5%83%95%E3%81%AF%E9%9F%B3%E6%A5%BD%E3%82%92%E8%BE%9E%E3%82%81%E3%81%9F/1648876058');
  assert.equal(JACKET_MAP.attribution, 'ヨルシカ『だから僕は音楽を辞めた』jacket artwork (© U&R records / Universal Music LLC)');
  assert.equal(JACKET_MAP.width, 495);
  assert.equal(JACKET_MAP.height, 300);
  assert.equal(JACKET_MAP.values.length, 148500);
  assert.ok(JACKET_MAP.values.every((value) => value >= 0 && value <= 255));
});

test('renderer caps DPR, draws text, pauses in focus, and tears down', () => {
  const harness = createHarness();
  const renderer = createEnvironmentRenderer({
    canvas: harness.canvas,
    terrainMap: JACKET_MAP,
    scheduler: harness.scheduler,
  });
  renderer.resize({ width: 320, height: 180, dpr: 3, quietZones: [] });
  renderer.setMotionState('running');
  harness.scheduler.flush(100);
  assert.equal(harness.canvas.width, 640);
  assert.ok(harness.textCalls.length > 0);
  renderer.setMotionState('focused');
  assert.equal(harness.scheduler.hasPending(), false);
  assert.equal(renderer.getDebugState().motion, 'focused');
  renderer.destroy();
  assert.equal(renderer.getDebugState().destroyed, true);
});

test('pointer ripples the artwork', () => {
  const leftWind = renderPointer({ x: 0, y: 0.5 });
  const rightWind = renderPointer({ x: 1, y: 0.5 });

  assert.notDeepEqual(leftWind, rightWind);
});

test('shimmer animation evolves between frames', () => {
  const harness = createHarness();
  const renderer = createEnvironmentRenderer({
    canvas: harness.canvas,
    terrainMap: createGradientMap(),
    scheduler: harness.scheduler,
  });
  renderer.resize({ width: 220, height: 70, quietZones: [] });
  renderer.setMotionState('running');
  harness.scheduler.flush(100);
  const early = harness.draws.at(-1);
  for (let time = 200; time <= 1000; time += 100) harness.scheduler.flush(time);
  const late = harness.draws.at(-1);

  assert.notDeepEqual(early, late);
});

test('focused pointer input is discarded before animation resumes', () => {
  const control = createHarness();
  const focusedInput = createHarness();
  const createRenderer = (harness) => createEnvironmentRenderer({
    canvas: harness.canvas,
    terrainMap: createTerrainMap(),
    scheduler: harness.scheduler,
  });
  const controlRenderer = createRenderer(control);
  const focusedInputRenderer = createRenderer(focusedInput);

  for (const { renderer } of [
    { renderer: controlRenderer },
    { renderer: focusedInputRenderer },
  ]) {
    renderer.resize({ width: 220, height: 70, quietZones: [] });
    renderer.setMotionState('focused');
  }
  focusedInputRenderer.setPointer({ x: 1, y: 1 });
  controlRenderer.setMotionState('running');
  focusedInputRenderer.setMotionState('running');
  control.draws.length = 0;
  focusedInput.draws.length = 0;
  for (let time = 100; time <= 600; time += 100) {
    control.scheduler.flush(time);
    focusedInput.scheduler.flush(time);
  }

  assert.deepEqual(focusedInput.draws.at(-1), control.draws.at(-1));
});

test('destroy prevents subsequent drawing and scheduling', () => {
  const harness = createHarness();
  const renderer = createEnvironmentRenderer({
    canvas: harness.canvas,
    terrainMap: createTerrainMap(),
    scheduler: harness.scheduler,
  });
  renderer.resize({ width: 220, height: 70, quietZones: [] });
  renderer.destroy();
  const drawCount = harness.draws.length;

  renderer.setMotionState('running');
  renderer.renderStatic();
  renderer.resize({ width: 440, height: 140, quietZones: [] });

  assert.equal(harness.draws.length, drawCount);
  assert.equal(harness.scheduler.hasPending(), false);
});

test('running mode limits drawing to one frame per 100 milliseconds', () => {
  const harness = createHarness();
  const renderer = createEnvironmentRenderer({
    canvas: harness.canvas,
    terrainMap: createTerrainMap(),
    scheduler: harness.scheduler,
  });
  renderer.resize({ width: 220, height: 70, quietZones: [] });
  const beforeRunning = harness.draws.length;
  renderer.setMotionState('running');
  assert.equal(harness.draws.length, beforeRunning);
  harness.scheduler.flush(0);
  const initialDrawCount = harness.draws.length;

  harness.scheduler.flush(50);
  harness.scheduler.flush(99);
  assert.equal(harness.draws.length, initialDrawCount);
  harness.scheduler.flush(100);
  assert.equal(harness.draws.length, initialDrawCount + 1);
  harness.scheduler.flush(150);
  assert.equal(harness.draws.length, initialDrawCount + 1);
  harness.scheduler.flush(200);
  assert.equal(harness.draws.length, initialDrawCount + 2);
});
