import test from 'node:test';
import assert from 'node:assert/strict';
import { OPEN_HORIZON_MAP } from '../../scripts/environment/open-horizon-map.js';
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

function renderPointer(pointer) {
  const harness = createHarness();
  const renderer = createEnvironmentRenderer({
    canvas: harness.canvas,
    terrainMap: createTerrainMap(),
    scheduler: harness.scheduler,
  });
  renderer.resize({ width: 220, height: 70, quietZones: [] });
  renderer.setMotionState('running');
  renderer.setPointer(pointer);
  harness.draws.length = 0;
  for (let time = 100; time <= 600; time += 100) harness.scheduler.flush(time);
  return harness.draws.at(-1);
}

test('generated terrain map carries source attribution and normalized values', () => {
  assert.equal(OPEN_HORIZON_MAP.sourcePage, 'https://unsplash.com/photos/KMn4VEeEPR8');
  assert.equal(OPEN_HORIZON_MAP.attribution, 'Photo by Sean Oulashin on Unsplash');
  assert.equal(OPEN_HORIZON_MAP.width, 120);
  assert.equal(OPEN_HORIZON_MAP.height, 42);
  assert.equal(OPEN_HORIZON_MAP.values.length, 5040);
  assert.ok(OPEN_HORIZON_MAP.values.every((value) => value >= 0 && value <= 255));
});

test('renderer caps DPR, draws text, pauses in focus, and tears down', () => {
  const harness = createHarness();
  const renderer = createEnvironmentRenderer({
    canvas: harness.canvas,
    terrainMap: OPEN_HORIZON_MAP,
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

test('pointer changes wind direction and character density', () => {
  const leftWind = renderPointer({ x: 0, y: 1 });
  const rightWind = renderPointer({ x: 1, y: 1 });
  const sparse = renderPointer({ x: 0.5, y: 0 });
  const dense = renderPointer({ x: 0.5, y: 1 });

  assert.notDeepEqual(leftWind, rightWind);
  assert.ok(dense.length > sparse.length);
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

  assert.equal(harness.draws.length, drawCount);
  assert.equal(harness.scheduler.hasPending(), false);
});
