import { TranslationError } from './translation-client.js';

const ACTIVE_STATUSES = new Set(['pending', 'translating', 'waiting-recovery', 'waiting-manual']);
const clone = (value) => structuredClone(value);

async function defaultHash(value) {
  if (globalThis.crypto?.subtle) {
    const bytes = new TextEncoder().encode(value);
    const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  }
  let result = 2166136261;
  for (const character of value) result = Math.imul(result ^ character.charCodeAt(0), 16777619);
  return (result >>> 0).toString(16);
}

function translationFor(result, fieldId) {
  if (Array.isArray(result)) return result.find(({ id }) => id === fieldId)?.values;
  if (result?.translations) return result.translations.find(({ id }) => id === fieldId)?.values;
  return result?.values ?? result;
}

function errorCategory(error) {
  return error instanceof TranslationError ? error.category : 'offline';
}

export function createTranslationQueue({
  storage,
  translate,
  getDocument,
  replaceDocument,
  now = () => Date.now(),
  hash = defaultHash,
}) {
  let queue = [];
  let requestSequence = 0;
  const latestRequest = new Map();
  const listeners = new Set();
  const ready = storage.loadJobs().then((stored) => { queue = stored; });
  const publish = () => listeners.forEach((listener) => listener(clone(queue)));
  const persist = async () => {
    await storage.saveJobs(queue);
    publish();
  };

  const attempt = async (job, mode = 'initial') => {
    if (job.status === 'superseded') return job;
    if (mode === 'automatic') job.automaticAttempts += 1;
    job.status = 'translating';
    job.errorCategory = null;
    job.updatedAt = now();
    await persist();
    try {
      const field = getDocument().fields[job.fieldId];
      const result = await translate([{
        id: job.fieldId,
        text: job.sourceText,
        kind: field.kind,
        preserveTokens: field.preserveTokens,
      }]);
      const values = translationFor(result, job.fieldId);
      if (typeof values?.en !== 'string' || !values.en || typeof values?.ja !== 'string' || !values.ja) {
        throw new TranslationError('invalid-response');
      }
      if (field.preserveTokens.some((token) => !values.en.includes(token) || !values.ja.includes(token))) {
        throw new TranslationError('token-mismatch');
      }
      const current = getDocument();
      const currentHash = await hash(current.fields[job.fieldId].values['zh-CN']);
      const replacedByNewerRequest = latestRequest.has(job.fieldId)
        && latestRequest.get(job.fieldId) !== job.requestToken;
      if (job.status === 'superseded' || replacedByNewerRequest || currentHash !== job.sourceHash) {
        job.status = 'superseded';
      } else {
        current.fields[job.fieldId].values.en = values.en;
        current.fields[job.fieldId].values.ja = values.ja;
        replaceDocument(current);
        job.status = 'complete';
      }
    } catch (error) {
      if (job.status !== 'superseded') {
        job.errorCategory = errorCategory(error);
        job.status = mode === 'initial' ? 'waiting-recovery' : 'waiting-manual';
      }
    }
    job.updatedAt = now();
    await persist();
    return clone(job);
  };

  const enqueue = (fieldId) => {
    const sourceDocument = getDocument();
    const sourceField = sourceDocument.fields[fieldId];
    if (!sourceField) return Promise.reject(new TypeError(`Unknown content field: ${fieldId}`));
    const sourceText = sourceField.values['zh-CN'];
    const requestToken = ++requestSequence;
    latestRequest.set(fieldId, requestToken);
    return (async () => {
      await ready;
      const sourceHash = await hash(sourceText);
      const activeMatch = queue.find((job) => (
        job.fieldId === fieldId && job.sourceHash === sourceHash && ACTIVE_STATUSES.has(job.status)
      ));
      if (activeMatch) return clone(activeMatch);
      queue.forEach((job) => {
        if (job.fieldId === fieldId && ACTIVE_STATUSES.has(job.status)) job.status = 'superseded';
      });
      const sourceRevision = now();
      const job = {
        jobId: `${fieldId}:${sourceRevision}`,
        fieldId,
        sourceText,
        sourceHash,
        sourceRevision,
        requestToken,
        status: 'pending',
        automaticAttempts: 0,
        errorCategory: null,
        createdAt: sourceRevision,
        updatedAt: sourceRevision,
      };
      queue.push(job);
      await persist();
      return attempt(job, 'initial');
    })();
  };

  const retry = async (jobId) => {
    await ready;
    const job = queue.find((candidate) => candidate.jobId === jobId);
    if (!job) throw new TypeError(`Unknown translation job: ${jobId}`);
    const currentHash = await hash(getDocument().fields[job.fieldId].values['zh-CN']);
    if (currentHash !== job.sourceHash) {
      job.status = 'superseded';
      await persist();
      return enqueue(job.fieldId);
    }
    return attempt(job, 'manual');
  };

  return {
    ready,
    enqueue,
    async recover() {
      await ready;
      const eligible = queue.filter((job) => (
        job.status === 'waiting-recovery' && job.automaticAttempts === 0
      ));
      await Promise.all(eligible.map((job) => attempt(job, 'automatic')));
      return clone(queue);
    },
    retry,
    async retryAll() {
      await ready;
      const ids = queue.filter((job) => job.status === 'waiting-manual').map(({ jobId }) => jobId);
      return Promise.all(ids.map(retry));
    },
    jobs() { return clone(queue); },
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
  };
}
