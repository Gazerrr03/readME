import test from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultContentDocument } from '../../scripts/content/default-document.js';
import { createReviewStorage } from '../../scripts/writing/review-storage.js';
import { TranslationError, translateItems } from '../../scripts/writing/translation-client.js';
import { createTranslationQueue } from '../../scripts/writing/translation-queue.js';

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });
  return { promise, resolve, reject };
}

test('translation client validates both target locales and preserved tokens', async () => {
  const result = await translateItems([{
    id: 'ui.projects.count',
    text: '{n} 个项目',
    kind: 'shortText',
    preserveTokens: ['{n}'],
  }], {
    fetchImpl: async () => ({ ok: true, json: async () => ({
      translations: [{ id: 'ui.projects.count', values: { en: '{n} ITEMS', ja: '{n} 件' } }],
    }) }),
  });
  assert.deepEqual(result[0].values, { en: '{n} ITEMS', ja: '{n} 件' });

  await assert.rejects(() => translateItems([{
    id: 'ui.projects.count', text: '{n} 个项目', kind: 'shortText', preserveTokens: ['{n}'],
  }], {
    fetchImpl: async () => ({ ok: true, json: async () => ({
      translations: [{ id: 'ui.projects.count', values: { en: 'ITEMS', ja: '{n} 件' } }],
    }) }),
  }), (error) => error instanceof TranslationError && error.category === 'token-mismatch');
});

test('a late response cannot overwrite a newer Chinese revision', async () => {
  let current = createDefaultContentDocument();
  const storage = createReviewStorage({ indexedDB: null });
  const first = deferred();
  const second = deferred();
  const queue = createTranslationQueue({
    storage,
    translate: ([item]) => (item.text === '第二版' ? second.promise : first.promise),
    getDocument: () => structuredClone(current),
    replaceDocument: (next) => { current = next; },
    hash: async (value) => value,
    now: (() => { let time = 0; return () => ++time; })(),
  });
  await queue.ready;

  const firstAttempt = queue.enqueue('ui.site.title');
  current.fields['ui.site.title'].values['zh-CN'] = '第二版';
  const secondAttempt = queue.enqueue('ui.site.title');
  first.resolve([{ id: 'ui.site.title', values: { en: 'First', ja: '最初' } }]);
  await firstAttempt;
  assert.notEqual(current.fields['ui.site.title'].values.en, 'First');

  second.resolve([{ id: 'ui.site.title', values: { en: 'Second', ja: '第二版' } }]);
  await secondAttempt;
  assert.equal(current.fields['ui.site.title'].values.en, 'Second');
  assert.equal(queue.jobs().filter((job) => job.status === 'complete').length, 1);
});

test('recovery retries once and then waits for manual action', async () => {
  let current = createDefaultContentDocument();
  const storage = createReviewStorage({ indexedDB: null });
  let calls = 0;
  const queue = createTranslationQueue({
    storage,
    translate: async () => { calls += 1; throw new TranslationError('offline'); },
    getDocument: () => structuredClone(current),
    replaceDocument: (next) => { current = next; },
    hash: async (value) => value,
    now: (() => { let time = 0; return () => ++time; })(),
  });
  await queue.ready;
  await queue.enqueue('ui.site.title');
  assert.equal(queue.jobs()[0].status, 'waiting-recovery');
  await queue.recover('route-open');
  await queue.recover('online');
  assert.equal(calls, 2);
  assert.equal(queue.jobs()[0].automaticAttempts, 1);
  assert.equal(queue.jobs()[0].status, 'waiting-manual');
});

test('unfinished jobs survive queue recreation', async () => {
  const storage = createReviewStorage({ indexedDB: null });
  const current = createDefaultContentDocument();
  const firstQueue = createTranslationQueue({
    storage,
    translate: async () => { throw new TranslationError('offline'); },
    getDocument: () => structuredClone(current),
    replaceDocument() {},
    hash: async (value) => value,
  });
  await firstQueue.ready;
  await firstQueue.enqueue('ui.site.title');
  const restored = createTranslationQueue({
    storage,
    translate: async () => [],
    getDocument: () => structuredClone(current),
    replaceDocument() {},
    hash: async (value) => value,
  });
  await restored.ready;
  assert.equal(restored.jobs()[0].status, 'waiting-recovery');
});
