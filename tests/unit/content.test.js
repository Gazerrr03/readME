import test from 'node:test';
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import { photos, tracks } from '../../media/catalog.js';
import {
  PROJECT_KINDS,
  about,
  articles,
  channels,
  pick,
  projects,
} from '../../scripts/data/content.js';
import { dictionaries } from '../../scripts/i18n/dictionaries.js';

const LOCALES = ['en', 'zh-CN', 'ja'];

test('dictionaries stay key-symmetric across locales', () => {
  const englishKeys = Object.keys(dictionaries.en).sort();
  for (const locale of ['zh-CN', 'ja']) {
    assert.deepEqual(Object.keys(dictionaries[locale]).sort(), englishKeys);
  }
});

test('every project is fully localized and well-formed', () => {
  const slugs = new Set();
  for (const project of projects) {
    assert.ok(PROJECT_KINDS.includes(project.kind), `${project.slug} kind`);
    assert.ok(Number.isInteger(project.year), `${project.slug} year`);
    assert.ok(!slugs.has(project.slug), `${project.slug} unique`);
    slugs.add(project.slug);
    for (const locale of LOCALES) {
      assert.ok(project.title[locale], `${project.slug} title ${locale}`);
      assert.ok(project.description[locale], `${project.slug} description ${locale}`);
    }
    assert.match(project.url, /^https:\/\//);
    assert.match(project.source, /^https:\/\//);
  }
});

test('every article is localized and well-formed in all locales', () => {
  for (const article of articles) {
    assert.match(article.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(article.tag && article.tag.length > 0, `${article.slug} tag`);
    for (const locale of LOCALES) {
      assert.ok(article.title[locale], `${article.slug} title ${locale}`);
      const body = article.body[locale];
      assert.ok(body.length > 0, `${article.slug} body ${locale} empty`);
      for (const item of body) {
        const wellFormed =
          typeof item === 'string' ||
          (typeof item.h === 'string') ||
          (typeof item.a === 'string' && typeof item.href === 'string');
        assert.ok(wellFormed, `${article.slug} malformed body item (${locale})`);
      }
      assert.ok(body.some((item) => typeof item === 'string'),
        `${article.slug} has prose in ${locale}`);
    }
  }
});

test('about and contact content is complete', () => {
  for (const locale of LOCALES) {
    assert.ok(about.bio[locale]);
    assert.ok(about.timeline.every((entry) => entry.event[locale]));
    assert.ok(about.now.every((entry) => entry.value[locale]));
  }
  assert.ok(about.stack.length > 0);
  assert.deepEqual(channels.map(({ id }) => id), ['email', 'github', 'x', 'rss']);
  for (const channel of channels) assert.ok(channel.address && channel.href);
});

test('every deck track points at a real audio file and is fully localized', async () => {
  const slugs = new Set();
  for (const track of tracks) {
    assert.ok(!slugs.has(track.slug), `${track.slug} unique`);
    slugs.add(track.slug);
    assert.match(track.file, /^media\/music\/.+\.wav$/);
    await access(new URL(`../../${track.file}`, import.meta.url));
    assert.ok(Number.isFinite(track.seconds) && track.seconds > 0, `${track.slug} seconds`);
    assert.ok(track.format, `${track.slug} format`);
    for (const locale of LOCALES) {
      assert.ok(track.title[locale], `${track.slug} title ${locale}`);
    }
  }
});

test('every photo wall item is unique, dated, and fully localized', () => {
  const slugs = new Set();
  for (const photo of photos) {
    assert.ok(!slugs.has(photo.slug), `${photo.slug} unique`);
    slugs.add(photo.slug);
    assert.match(photo.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(photo.pixels.length > 0, `${photo.slug} pixels`);
    for (const locale of LOCALES) {
      assert.ok(photo.title[locale], `${photo.slug} title ${locale}`);
    }
  }
});

test('pick falls back to English for an unknown locale', () => {
  assert.equal(pick(projects[0].title, 'fr'), projects[0].title.en);
  assert.equal(pick(projects[0].title, 'ja'), projects[0].title.ja);
});
