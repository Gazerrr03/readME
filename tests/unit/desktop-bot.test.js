import test from 'node:test';
import assert from 'node:assert/strict';
import { isHotSpringHour } from '../../scripts/desktop.js';

test('hot spring hour covers 01:00 through 02:59 only', () => {
  const at = (hour) => new Date(2026, 7, 12, hour, 30);
  assert.equal(isHotSpringHour(at(0)), false);
  assert.equal(isHotSpringHour(at(1)), true);
  assert.equal(isHotSpringHour(at(2)), true);
  assert.equal(isHotSpringHour(at(3)), false);
  assert.equal(isHotSpringHour(at(14)), false);
});
