import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getWritingCoverVariant,
  getWritingTitleTier,
} from '../../scripts/apps/writing-app.js';

test('cover variants are deterministic and stay in the four-variant vocabulary', () => {
  const first = getWritingCoverVariant('flow-canvas-information-overload', 0);
  assert.equal(getWritingCoverVariant('flow-canvas-information-overload', 0), first);
  assert.match(first, /^0[1-4]$/);
  assert.match(getWritingCoverVariant('nonexistent-frequency', 1), /^0[1-4]$/);
});

test('title tiers use Unicode character counts and explicit thresholds', () => {
  assert.equal(getWritingTitleTier('Short title'), 'short');
  assert.equal(getWritingTitleTier('当信息开始替我思考这是一个更长的标题文本示例'), 'medium');
  assert.equal(getWritingTitleTier('When a localized article title becomes deliberately long enough to require the smallest display tier'), 'long');
});
