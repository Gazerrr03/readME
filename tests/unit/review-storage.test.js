import test from 'node:test';
import assert from 'node:assert/strict';
import { createReviewStorage } from '../../scripts/writing/review-storage.js';

test('falls back to memory when IndexedDB cannot open', async () => {
  const storage = createReviewStorage({
    indexedDB: { open() { throw new Error('denied'); } },
  });
  const draft = { schemaVersion: 1, fields: { example: { values: { 'zh-CN': '草稿' } } } };
  const jobs = [{ jobId: 'job-1', status: 'waiting-recovery' }];
  await storage.saveDraft(draft);
  await storage.saveJobs(jobs);
  assert.deepEqual(await storage.loadDraft(), draft);
  assert.deepEqual(await storage.loadJobs(), jobs);
  assert.equal(storage.persistent, false);
});

test('clear removes in-memory review data', async () => {
  const storage = createReviewStorage({ indexedDB: null });
  await storage.saveDraft({ fields: {} });
  await storage.saveJobs([{ jobId: 'job-1' }]);
  await storage.clear();
  assert.equal(await storage.loadDraft(), null);
  assert.deepEqual(await storage.loadJobs(), []);
});
