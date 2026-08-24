import test from 'node:test';
import assert from 'node:assert/strict';
import { createContentStore } from '../../scripts/content/content-store.js';
import { createDefaultContentDocument } from '../../scripts/content/default-document.js';

test('loads valid published content and notifies once', async () => {
  const published = createDefaultContentDocument();
  published.fields['ui.site.title'].values['zh-CN'] = '新标题';
  const store = createContentStore({
    defaultDocument: createDefaultContentDocument(),
    fetchImpl: async () => ({ ok: true, json: async () => published }),
  });
  let notifications = 0;
  store.subscribe(() => { notifications += 1; });
  await store.loadPublished('/content/content.json');
  assert.equal(store.field('ui.site.title').values['zh-CN'], '新标题');
  assert.equal(store.snapshot.dictionaries['zh-CN']['site.title'], '新标题');
  assert.equal(notifications, 1);
});

test('uses defaults when published fetch fails', async () => {
  const warnings = [];
  const defaults = createDefaultContentDocument();
  const store = createContentStore({
    defaultDocument: defaults,
    fetchImpl: async () => { throw new TypeError('offline'); },
    logger: { warn(...args) { warnings.push(args); } },
  });
  await store.loadPublished('/content/content.json');
  assert.deepEqual(store.document, defaults);
  assert.equal(warnings.length, 1);
});

test('partially invalid published content falls back by field', async () => {
  const published = createDefaultContentDocument();
  published.fields['ui.site.title'].values.en = '';
  published.fields['about.bio'].values['zh-CN'] = '新的自述';
  const store = createContentStore({
    defaultDocument: createDefaultContentDocument(),
    fetchImpl: async () => ({ ok: true, json: async () => published }),
    logger: { warn() {} },
  });
  await store.loadPublished();
  assert.equal(store.snapshot.about.bio['zh-CN'], '新的自述');
  assert.equal(store.snapshot.dictionaries.en['site.title'],
    createDefaultContentDocument().fields['ui.site.title'].values.en);
});

test('replace requires a complete valid document', () => {
  const store = createContentStore({ defaultDocument: createDefaultContentDocument() });
  assert.throws(() => store.replace({
    schemaVersion: 1,
    publishedAt: '2026-08-12T00:00:00.000Z',
    fields: {},
  }), /complete content document/);
});
