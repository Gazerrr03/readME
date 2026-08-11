import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clampGeometry,
  closeWindow,
  createWindowState,
  focusWindow,
  minimizeWindow,
  moveWindow,
  openWindow,
  restoreWindow,
} from '../../scripts/state/window-state.js';

const app = { id: 'projects', defaultSize: { width: 520, height: 360 } };
const secondApp = { id: 'writing', defaultSize: { width: 520, height: 360 } };
const bounds = { x: 0, y: 24, width: 1280, height: 656 };

test('opening the same app focuses one instance', () => {
  const once = openWindow(createWindowState(), app, bounds);
  const twice = openWindow(once, app, bounds);

  assert.equal(twice.windows.length, 1);
  assert.equal(twice.activeId, 'projects');
  assert.ok(twice.windows[0].z > once.windows[0].z);
});

test('new windows use their default size and a 24-pixel cascade', () => {
  const first = openWindow(createWindowState(), app, bounds);
  const second = openWindow(first, secondApp, bounds);

  assert.deepEqual(
    { width: first.windows[0].width, height: first.windows[0].height },
    { width: 520, height: 360 },
  );
  assert.deepEqual(
    { x: second.windows[1].x - first.windows[0].x, y: second.windows[1].y - first.windows[0].y },
    { x: 24, y: 24 },
  );
});

test('minimize, restore, and close preserve valid state', () => {
  const opened = openWindow(createWindowState(), app, bounds);
  const minimized = minimizeWindow(opened, 'projects');
  assert.equal(minimized.windows[0].status, 'minimized');
  assert.equal(minimized.activeId, null);

  const restored = restoreWindow(minimized, 'projects');
  assert.equal(restored.windows[0].status, 'normal');
  assert.equal(restored.activeId, 'projects');

  const closed = closeWindow(restored, 'projects');
  assert.equal(closed.windows.length, 0);
  assert.equal(closed.activeId, null);
});

test('minimizing or closing the active window activates the top remaining window', () => {
  const first = openWindow(createWindowState(), app, bounds);
  const second = openWindow(first, secondApp, bounds);

  assert.equal(minimizeWindow(second, 'writing').activeId, 'projects');
  assert.equal(closeWindow(second, 'writing').activeId, 'projects');
});

test('moving clamps a reachable title bar inside bounds', () => {
  const opened = openWindow(createWindowState(), app, bounds);
  const moved = moveWindow(opened, 'projects', { x: -900, y: 900 }, bounds);

  assert.ok(moved.windows[0].x >= -424);
  assert.ok(moved.windows[0].y <= 656 - 32);
});

test('left clamping preserves controls and a draggable title-bar region', () => {
  assert.deepEqual(
    clampGeometry({ x: -900, y: 100, width: 520, height: 360 }, bounds),
    { x: -424, y: 100, width: 520, height: 360 },
  );
});

test('clampGeometry keeps the size and clamps both axes to reachable limits', () => {
  assert.deepEqual(
    clampGeometry({ x: 1400, y: -100, width: 520, height: 360 }, bounds),
    { x: 1216, y: 24, width: 520, height: 360 },
  );
});

test('every transition returns a new state and windows array without mutating input', () => {
  const opened = openWindow(createWindowState(), app, bounds);
  const snapshot = structuredClone(opened);
  const transitions = [
    focusWindow(opened, 'missing'),
    minimizeWindow(opened, 'missing'),
    restoreWindow(opened, 'missing'),
    closeWindow(opened, 'missing'),
    moveWindow(opened, 'missing', { x: 12, y: 34 }, bounds),
  ];

  transitions.forEach((next) => {
    assert.notStrictEqual(next, opened);
    assert.notStrictEqual(next.windows, opened.windows);
  });
  assert.deepEqual(opened, snapshot);
});
