import test from 'node:test';
import assert from 'node:assert/strict';
import { createI18n } from '../../scripts/i18n/i18n.js';

test('defaults to English and switches locale', () => {
  const i18n = createI18n('en');
  assert.equal(i18n.t('site.title'), 'Two A.M., A Frequency That Does Not Exist');
  i18n.setLocale('zh-CN');
  assert.equal(i18n.t('site.title'), '凌晨两点，不存在的频率');
});

test('falls back to English for an unknown key in a locale', () => {
  const i18n = createI18n('ja');
  assert.equal(i18n.t('protocol.build'), 'BUILD: 882.A');
});

test('rejects unsupported locales', () => {
  const i18n = createI18n('en');
  assert.throws(() => i18n.setLocale('fr'), /Unsupported locale/);
});
