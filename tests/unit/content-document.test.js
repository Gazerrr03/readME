import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mergeContentDocuments,
  serializeContentDocument,
  validateContentDocument,
} from '../../scripts/content/content-document.js';
import { createDefaultContentDocument } from '../../scripts/content/default-document.js';

test('default content covers UI, articles, projects, about, contact, and media', () => {
  const document = createDefaultContentDocument();
  for (const id of [
    'ui.site.title',
    'articles.flow-canvas-information-overload.title',
    'projects.signal-garden.description',
    'about.bio',
    'contact.email.address',
    'media.photos.coast.title',
    'media.tracks.tide-study-0200.title',
  ]) assert.ok(document.fields[id], id);
  assert.equal(validateContentDocument(document).valid, true);
});

test('article blocks use locale-independent stable ids', () => {
  const document = createDefaultContentDocument();
  const ids = Object.keys(document.fields).filter((id) => (
    id.startsWith('articles.flow-canvas-information-overload.body.')
  ));
  assert.ok(ids.length > 10);
  assert.ok(ids.includes('articles.flow-canvas-information-overload.body.block-001.text'));
  assert.ok(ids.includes('articles.flow-canvas-information-overload.body.block-002.text'));
});

test('merge rejects invalid fields and retains their defaults', () => {
  const defaults = createDefaultContentDocument();
  const published = structuredClone(defaults);
  published.fields['ui.site.title'].values.en = '';
  published.fields['projects.signal-garden.description'].values['zh-CN'] = '新描述';
  const result = mergeContentDocuments(defaults, published);
  assert.equal(
    result.document.fields['ui.site.title'].values.en,
    defaults.fields['ui.site.title'].values.en,
  );
  assert.equal(
    result.document.fields['projects.signal-garden.description'].values['zh-CN'],
    '新描述',
  );
  assert.deepEqual(result.invalidFieldIds, ['ui.site.title']);
});

test('validation rejects missing labels and changed interpolation tokens', () => {
  const document = createDefaultContentDocument();
  document.fields['ui.projects.count'].label = '';
  document.fields['ui.projects.count'].values.ja = '件';
  const result = validateContentDocument(document);
  assert.equal(result.valid, false);
  assert.deepEqual(result.errors, ['ui.projects.count']);
});

test('serialization sorts field ids and ends with a newline', () => {
  const document = createDefaultContentDocument();
  const serialized = serializeContentDocument(document);
  assert.equal(serialized, serializeContentDocument(document));
  assert.equal(serialized.endsWith('\n'), true);
  const parsed = JSON.parse(serialized);
  assert.deepEqual(Object.keys(parsed.fields), Object.keys(parsed.fields).sort());
});
