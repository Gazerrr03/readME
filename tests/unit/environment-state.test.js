import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ENVIRONMENT_CAPABILITY,
  ENVIRONMENT_MOTION,
  formatEnvironmentClock,
  getEnvironmentCapability,
  getEnvironmentMotionState,
  nextEnvironmentView,
} from '../../scripts/environment/environment-state.js';

test('capability follows active mode, width, pointer, and reduced motion', () => {
  assert.equal(getEnvironmentCapability({ mode: 'windows', width: 390 }), ENVIRONMENT_CAPABILITY.PHONE_STATIC);
  assert.equal(getEnvironmentCapability({ mode: 'windows', width: 834 }), ENVIRONMENT_CAPABILITY.STATIC);
  assert.equal(getEnvironmentCapability({ mode: 'macos', width: 390 }), ENVIRONMENT_CAPABILITY.PHONE_STATIC);
  assert.equal(getEnvironmentCapability({ mode: 'macos', width: 834 }), ENVIRONMENT_CAPABILITY.STATIC);
  assert.equal(getEnvironmentCapability({ mode: 'macos', width: 1440, coarsePointer: true }), ENVIRONMENT_CAPABILITY.STATIC);
  assert.equal(getEnvironmentCapability({ mode: 'macos', width: 1440, reducedMotion: true }), ENVIRONMENT_CAPABILITY.STATIC);
  assert.equal(getEnvironmentCapability({ mode: 'windows', width: 1440 }), ENVIRONMENT_CAPABILITY.ANIMATED);
  assert.equal(getEnvironmentCapability({ mode: 'macos', width: 1440 }), ENVIRONMENT_CAPABILITY.ANIMATED);
});

test('motion enters focus only for an animated visible desktop', () => {
  assert.equal(getEnvironmentMotionState({ capability: 'animated' }), ENVIRONMENT_MOTION.RUNNING);
  assert.equal(getEnvironmentMotionState({ capability: 'animated', hasVisibleWindow: true }), ENVIRONMENT_MOTION.FOCUSED);
  assert.equal(getEnvironmentMotionState({ capability: 'animated', documentHidden: true }), ENVIRONMENT_MOTION.STATIC);
  assert.equal(getEnvironmentMotionState({ capability: 'static' }), ENVIRONMENT_MOTION.STATIC);
});

test('environment reading order is stable', () => {
  assert.equal(nextEnvironmentView('time'), 'weather');
  assert.equal(nextEnvironmentView('weather'), 'tide-wind');
  assert.equal(nextEnvironmentView('tide-wind'), 'time');
  assert.equal(nextEnvironmentView('unknown'), 'time');
});

test('clock formatting keeps a stable 24-hour value and localized date', () => {
  const date = new Date('2026-08-11T02:07:00+08:00');
  assert.equal(formatEnvironmentClock(date, 'en').time, '02:07');
  assert.match(formatEnvironmentClock(date, 'zh-CN').date, /2026/);
  assert.match(formatEnvironmentClock(date, 'ja').date, /2026/);
});
