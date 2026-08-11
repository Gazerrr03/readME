import test from 'node:test';
import assert from 'node:assert/strict';
import { dictionaries } from '../../scripts/i18n/dictionaries.js';
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

const expectedEnvironmentLabels = {
  en: {
    'environment.localTime': 'LOCAL TIME',
    'environment.weather': 'WEATHER SIGNAL',
    'environment.tideWind': 'TIDE / WIND',
    'environment.conditionEmpty': 'CONDITION / --',
    'environment.locationEmpty': 'LOCATION / --',
    'environment.windEmpty': 'WIND / --',
    'environment.tideEmpty': 'TIDE / --',
    'environment.now': 'NOW',
    'environment.latest': 'LATEST',
    'environment.openProjects': 'Open Projects',
    'environment.openWriting': 'Open Writing',
  },
  'zh-CN': {
    'environment.localTime': '本地时间',
    'environment.weather': '天气信号',
    'environment.tideWind': '潮汐 / 风场',
    'environment.conditionEmpty': '天气 / --',
    'environment.locationEmpty': '地点 / --',
    'environment.windEmpty': '风速 / --',
    'environment.tideEmpty': '潮汐 / --',
    'environment.now': '当前',
    'environment.latest': '最近',
    'environment.openProjects': '打开项目',
    'environment.openWriting': '打开文章',
  },
  ja: {
    'environment.localTime': 'ローカル時刻',
    'environment.weather': '気象信号',
    'environment.tideWind': '潮汐 / 風',
    'environment.conditionEmpty': '天気 / --',
    'environment.locationEmpty': '場所 / --',
    'environment.windEmpty': '風 / --',
    'environment.tideEmpty': '潮汐 / --',
    'environment.now': '現在',
    'environment.latest': '最新',
    'environment.openProjects': 'プロジェクトを開く',
    'environment.openWriting': '文章を開く',
  },
};

test('every locale owns the exact environment labels', () => {
  Object.entries(expectedEnvironmentLabels).forEach(([locale, expected]) => {
    const actual = Object.fromEntries(
      Object.keys(expected).map((key) => [key, dictionaries[locale][key]]),
    );
    assert.deepEqual(actual, expected);
  });
});
