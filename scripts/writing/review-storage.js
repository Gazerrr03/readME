const DATABASE_NAME = 'portfolio-writing';
const DATABASE_VERSION = 1;

const clone = (value) => (value == null ? value : structuredClone(value));

function openDatabase(indexedDB) {
  if (!indexedDB?.open) return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    let request;
    try {
      request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    } catch (error) {
      reject(error);
      return;
    }
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains('drafts')) database.createObjectStore('drafts');
      if (!database.objectStoreNames.contains('jobs')) database.createObjectStore('jobs');
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'));
  });
}

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
  });
}

export function createReviewStorage({ indexedDB = globalThis.indexedDB } = {}) {
  const memory = { draft: null, jobs: [] };
  let persistent = Boolean(indexedDB?.open);
  const database = openDatabase(indexedDB).catch(() => {
    persistent = false;
    return null;
  });

  const useStore = async (name, mode, operation) => {
    const db = await database;
    if (!db) return undefined;
    try {
      const transaction = db.transaction(name, mode);
      const completed = new Promise((resolve, reject) => {
        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed'));
        transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction aborted'));
      });
      const result = await operation(transaction.objectStore(name));
      await completed;
      return result;
    } catch {
      persistent = false;
      return undefined;
    }
  };

  return {
    get persistent() { return persistent; },
    async loadDraft() {
      const stored = await useStore('drafts', 'readonly', (store) => requestResult(store.get('current')));
      return clone(stored ?? memory.draft);
    },
    async saveDraft(document) {
      memory.draft = clone(document);
      await useStore('drafts', 'readwrite', (store) => requestResult(store.put(clone(document), 'current')));
    },
    async loadJobs() {
      const stored = await useStore('jobs', 'readonly', (store) => requestResult(store.get('current')));
      return clone(stored ?? memory.jobs ?? []);
    },
    async saveJobs(jobs) {
      memory.jobs = clone(jobs);
      await useStore('jobs', 'readwrite', (store) => requestResult(store.put(clone(jobs), 'current')));
    },
    async clear() {
      memory.draft = null;
      memory.jobs = [];
      await Promise.all([
        useStore('drafts', 'readwrite', (store) => requestResult(store.clear())),
        useStore('jobs', 'readwrite', (store) => requestResult(store.clear())),
      ]);
    },
  };
}
