import test from 'node:test';
import assert from 'node:assert/strict';
import { createEnvironmentRenderer } from '../../scripts/environment/environment-renderer.js';
import { QIFENG_SCENE } from '../../scripts/environment/qifeng-scene.js';

function createHarness() {
  const textCalls = [];
  const draws = [];
  const context = {
    setTransform() {},
    fillRect() { draws.push([]); },
    fillText: (...args) => {
      textCalls.push(args);
      draws.at(-1)?.push(args);
    },
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

function createRenderer(harness) {
  return createEnvironmentRenderer({
    canvas: harness.canvas,
    scene: QIFENG_SCENE,
    scheduler: harness.scheduler,
  });
}

function renderPointer(pointer) {
  const harness = createHarness();
  const renderer = createRenderer(harness);
  renderer.resize({ width: 220, height: 70, quietZones: [] });
  renderer.setMotionState('running');
  renderer.setPointer(pointer);
  harness.draws.length = 0;
  for (let time = 100; time <= 600; time += 100) harness.scheduler.flush(time);
  return harness.draws.at(-1);
}

test('image-derived scene carries a title-free grayscale map', () => {
  assert.equal(QIFENG_SCENE.id, 'qifeng-image-ascii');
  assert.equal(QIFENG_SCENE.source, 'assets/image/hq720.jpg');
  assert.equal(QIFENG_SCENE.surface, '#1E40AF');
  assert.equal(QIFENG_SCENE.width, 320);
  assert.equal(QIFENG_SCENE.height, 180);
  assert.equal(QIFENG_SCENE.values.length, 57_600);
  assert.ok(QIFENG_SCENE.values.some((value) => value > 220));
  assert.ok(QIFENG_SCENE.values.some((value) => value > 3 && value < 48));
});

test('renderer caps DPR, draws the scene, pauses in focus, and tears down', () => {
  const harness = createHarness();
  const renderer = createRenderer(harness);
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

test('image scene drift evolves between frames', () => {
  const harness = createHarness();
  const renderer = createRenderer(harness);
  renderer.resize({ width: 220, height: 70, quietZones: [] });
  renderer.setMotionState('running');
  harness.scheduler.flush(100);
  const early = renderer.getDebugState().sceneOffset;
  for (let time = 200; time <= 1000; time += 100) harness.scheduler.flush(time);
  const late = renderer.getDebugState().sceneOffset;

  assert.notEqual(early, late);
});

test('focused pointer input is discarded before animation resumes', () => {
  const control = createHarness();
  const focusedInput = createHarness();
  const controlRenderer = createRenderer(control);
  const focusedInputRenderer = createRenderer(focusedInput);

  for (const renderer of [controlRenderer, focusedInputRenderer]) {
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
  const renderer = createRenderer(harness);
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
  const renderer = createRenderer(harness);
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
