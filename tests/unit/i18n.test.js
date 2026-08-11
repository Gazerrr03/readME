import test from 'node:test';
import assert from 'node:assert/strict';
import { createI18n } from '../../scripts/i18n/i18n.js';

test('defaults to English when no locale is provided', () => {
  const i18n = createI18n();
  assert.equal(i18n.locale, 'en');
  assert.equal(i18n.t('site.title'), 'Two A.M., A Frequency That Does Not Exist');
});

test('switches locale', () => {
  const i18n = createI18n('en');
  i18n.setLocale('zh-CN');
  assert.equal(i18n.t('site.title'), '凌晨两点，不存在的频率');
});

test('falls back to English for a key missing from the active locale', () => {
  const source = {
    en: { 'fallback.only': 'English fallback' },
    ja: {},
  };
  const i18n = createI18n('ja', source);
  assert.equal(i18n.t('fallback.only'), 'English fallback');
});

test('rejects unsupported locales', () => {
  const i18n = createI18n('en');
  assert.throws(() => i18n.setLocale('fr'), /Unsupported locale/);
});

test('does not treat inherited dictionary properties as supported locales', () => {
  assert.equal(createI18n('toString').locale, 'en');
  assert.throws(() => createI18n().setLocale('constructor'), /Unsupported locale/);
});
