import { mergeContentDocuments, validateContentDocument } from './content-document.js';
import { defaultContentDocument } from './default-document.js';
import { materializeContent } from './materialize-content.js';

function hasDocumentEnvelope(value) {
  return value
    && value.schemaVersion === defaultContentDocument.schemaVersion
    && typeof value.publishedAt === 'string'
    && value.fields
    && typeof value.fields === 'object'
    && !Array.isArray(value.fields);
}

export function createContentStore({
  defaultDocument = defaultContentDocument,
  fetchImpl = globalThis.fetch,
  logger = console,
} = {}) {
  const defaults = structuredClone(defaultDocument);
  let document = structuredClone(defaults);
  let snapshot = materializeContent(document);
  const listeners = new Set();
  const publish = () => listeners.forEach((listener) => listener(snapshot));

  return {
    get document() { return structuredClone(document); },
    get snapshot() { return snapshot; },
    field(id) { return document.fields[id] ? structuredClone(document.fields[id]) : null; },
    async loadPublished(url = '/content/content.json') {
      try {
        if (typeof fetchImpl !== 'function') throw new TypeError('fetch unavailable');
        const response = await fetchImpl(url);
        if (!response.ok) throw new Error(`content fetch ${response.status}`);
        const published = await response.json();
        if (!hasDocumentEnvelope(published)) throw new TypeError('invalid content envelope');
        const merged = mergeContentDocuments(defaults, published);
        document = merged.document;
        snapshot = materializeContent(document);
        if (merged.invalidFieldIds.length) {
          logger.warn('Invalid content fields; using bundled defaults', merged.invalidFieldIds);
        }
        publish();
      } catch (error) {
        logger.warn('Published content unavailable; using bundled defaults', error?.name ?? 'Error');
      }
      return snapshot;
    },
    replace(next) {
      const validation = validateContentDocument(next);
      const defaultIds = Object.keys(defaults.fields).sort();
      const nextIds = Object.keys(next?.fields ?? {}).sort();
      const isComplete = defaultIds.length === nextIds.length
        && defaultIds.every((id, index) => id === nextIds[index]);
      if (!validation.valid || !isComplete) {
        throw new TypeError('Expected a complete content document');
      }
      document = structuredClone(next);
      snapshot = materializeContent(document);
      publish();
      return snapshot;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
