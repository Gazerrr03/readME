import {
  serializeContentDocument,
  validateContentDocument,
} from '../content/content-document.js';

const UNRESOLVED = new Set(['pending', 'translating', 'waiting-recovery', 'waiting-manual']);

function sameFieldSet(left, right) {
  const leftIds = Object.keys(left.fields ?? {}).sort();
  const rightIds = Object.keys(right.fields ?? {}).sort();
  return leftIds.length === rightIds.length && leftIds.every((id, index) => id === rightIds[index]);
}

export function importContentDocument(fileText, currentDocument) {
  let parsed;
  try {
    parsed = JSON.parse(fileText);
  } catch {
    throw new TypeError('导入文件无效：不是合法 JSON');
  }
  const validation = validateContentDocument(parsed);
  if (!validation.valid || !sameFieldSet(parsed, currentDocument)) {
    throw new TypeError(`导入文件无效：${validation.errors.join(', ') || '字段不完整'}`);
  }
  return structuredClone(parsed);
}

export function createContentExport(document, jobs, defaults, now = () => Date.now()) {
  const exported = structuredClone(document);
  const generatedAt = new Date(now()).toISOString();
  exported.publishedAt = generatedAt;
  const latestByField = new Map();
  jobs.forEach((job) => {
    const previous = latestByField.get(job.fieldId);
    if (!previous || (job.updatedAt ?? 0) >= (previous.updatedAt ?? 0)) {
      latestByField.set(job.fieldId, job);
    }
  });
  const unresolved = [...latestByField.values()]
    .filter((job) => UNRESOLVED.has(job.status))
    .sort((left, right) => left.fieldId.localeCompare(right.fieldId))
    .map((job) => {
      const field = exported.fields[job.fieldId];
      const fallback = defaults.fields[job.fieldId];
      if (!field.values.en) field.values.en = fallback.values.en;
      if (!field.values.ja) field.values.ja = fallback.values.ja;
      return {
        fieldId: job.fieldId,
        sourceRevision: job.sourceRevision ?? job.updatedAt,
        errorCategory: job.errorCategory ?? 'pending',
      };
    });
  const report = {
    schemaVersion: exported.schemaVersion,
    generatedAt,
    unresolved,
  };
  return {
    contentJson: serializeContentDocument(exported),
    reportJson: `${JSON.stringify(report, null, 2)}\n`,
    unresolvedCount: unresolved.length,
  };
}
