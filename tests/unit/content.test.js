import test from 'node:test';
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import { photos, tracks } from '../../media/catalog.js';
import { about } from '../../modules/base-buttons/about/data.js';
import { channels } from '../../modules/base-buttons/contact/data.js';
import {
  PROJECT_KINDS,
  articles,
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
    assert.match(article.edited, /^\d{4}-\d{2}-\d{2}$/, `${article.slug} edited`);
    assert.ok(article.edited >= article.date, `${article.slug} edited not before date`);
    assert.ok(article.tag && article.tag.length > 0, `${article.slug} tag`);
    if (article.notes) {
      for (const locale of LOCALES) {
        assert.ok(article.notes[locale], `${article.slug} notes ${locale}`);
      }
    }
    for (const locale of LOCALES) {
      assert.ok(article.title[locale], `${article.slug} title ${locale}`);
      const body = article.body[locale];
      assert.ok(body.length > 0, `${article.slug} body ${locale} empty`);
      for (const item of body) {
        const wellFormed =
          typeof item === 'string' ||
          (typeof item.h === 'string') ||
          (typeof item.q === 'string') ||
          (typeof item.a === 'string' && typeof item.href === 'string');
        assert.ok(wellFormed, `${article.slug} malformed body item (${locale})`);
      }
      assert.ok(body.some((item) => typeof item === 'string'),
        `${article.slug} has prose in ${locale}`);
    }
  }
});

test('long-form articles carry quote sentences and field notes in all locales', () => {
  const longForm = articles.filter((article) => article.notes);
  assert.ok(longForm.length >= 2, 'expected at least two long-form articles');
  for (const article of longForm) {
    for (const locale of LOCALES) {
      const quotes = article.body[locale].filter((item) => item && item.q);
      assert.ok(quotes.length >= 1, `${article.slug} quotes ${locale}`);
    }
  }
});

test('about and contact content is complete', () => {
  for (const locale of LOCALES) {
    assert.ok(about.role[locale]);
    assert.ok(about.bio[locale]);
    assert.ok(about.experience.every((entry) => entry.label[locale]));
    assert.ok(about.works.every((entry) => entry.meta[locale] && entry.description[locale]));
    assert.ok(about.toolbox.every((line) => line[locale]));
    assert.ok(about.now.every((entry) => entry.key[locale]));
    assert.ok(about.now.every((entry) => entry.value[locale]));
  }
  assert.equal(about.name, 'Qizhi（Gazerrr）');
  assert.deepEqual(about.experience.map(({ name }) => name), ['Tencent IEG']);
  assert.deepEqual(about.works.map(({ name }) => name), ['Flovvas', 'Loom']);
  assert.equal(about.now.find(({ key }) => key.en === 'BUILDING').value.en, 'LOOM');
  assert.deepEqual(channels.map(({ id }) => id), ['email', 'github', 'x', 'rss']);
  for (const channel of channels) assert.ok(channel.address && channel.href);
  assert.equal(channels.find(({ id }) => id === 'rss').href, 'feed.xml');
  assert.equal(channels.find(({ id }) => id === 'rss').address, 'feed.xml');
});

test('every deck track points at a real audio file and is fully localized', async () => {
  const slugs = new Set();
  for (const track of tracks) {
    assert.ok(!slugs.has(track.slug), `${track.slug} unique`);
    slugs.add(track.slug);
    assert.match(track.file, /^media\/music\/.+\.(wav|m4a)$/);
    await access(new URL(`../../${track.file}`, import.meta.url));
    if (track.coverImage) {
      assert.match(track.coverImage, /^media\/covers\/.+\.png$/);
      await access(new URL(`../../${track.coverImage}`, import.meta.url));
    }
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
