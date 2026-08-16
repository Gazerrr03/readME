import test from 'node:test';
import assert from 'node:assert/strict';
import { getMotionConfig } from '../../scripts/environment/background/shader-background.js';

test('running has the strongest motion budget', () => {
  assert.equal(getMotionConfig('running').speed > getMotionConfig('focused').speed, true);
  assert.equal(getMotionConfig('focused').speed > getMotionConfig('static').speed, true);
  assert.equal(getMotionConfig('running').density > getMotionConfig('focused').density, true);
});

test('unknown motion states resolve to static', () => {
  assert.deepEqual(getMotionConfig('unknown'), getMotionConfig('static'));
});
