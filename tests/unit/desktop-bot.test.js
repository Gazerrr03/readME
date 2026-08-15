import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BOT_ANIMATIONS,
  BOT_DRAG_DISTANCE,
  BOT_DRAG_HOLD_MS,
  isHotSpringHour,
} from '../../scripts/desktop.js';

test('hot spring hour covers 01:00 through 02:59 only', () => {
  const at = (hour) => new Date(2026, 7, 12, hour, 30);
  assert.equal(isHotSpringHour(at(0)), false);
  assert.equal(isHotSpringHour(at(1)), true);
  assert.equal(isHotSpringHour(at(2)), true);
  assert.equal(isHotSpringHour(at(3)), false);
  assert.equal(isHotSpringHour(at(14)), false);
});

test('Pen Pen animation atlas keeps an 8 by 9 sprite contract', () => {
  assert.deepEqual(BOT_ANIMATIONS.idle, { row: 0, frames: 6, frameDuration: 180 });
  assert.deepEqual(BOT_ANIMATIONS['running-left'], { row: 2, frames: 8, frameDuration: 95 });
  assert.deepEqual(BOT_ANIMATIONS['running-right'], { row: 1, frames: 8, frameDuration: 95 });
  assert.deepEqual(BOT_ANIMATIONS.review, { row: 8, frames: 6, frameDuration: 180 });
  assert.equal(BOT_DRAG_HOLD_MS, 180);
  assert.equal(BOT_DRAG_DISTANCE, 8);
  assert.equal(new Set(Object.values(BOT_ANIMATIONS).map(({ row }) => row)).size, 9);
});
