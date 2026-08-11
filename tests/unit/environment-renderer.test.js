import test from 'node:test';
import assert from 'node:assert/strict';
import { OPEN_HORIZON_MAP } from '../../scripts/environment/open-horizon-map.js';
import { createEnvironmentRenderer } from '../../scripts/environment/environment-renderer.js';

function createHarness() {
  const textCalls = [];
  const context = {
    setTransform() {},
    clearRect() {},
    fillRect() {},
    fillText: (...args) => textCalls.push(args),
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
  };
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
