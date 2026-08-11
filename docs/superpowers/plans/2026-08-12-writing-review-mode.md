# Writing Review Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local `/writing` review route where Chinese is edited directly, English and Japanese are translated asynchronously, failed translations remain recoverable, and the normal portfolio keeps all existing interactions.

**Architecture:** A versioned field document overlays the existing bundled content through one observable runtime store. The review application persists drafts and translation jobs in IndexedDB, sends preview snapshots through a guarded `BroadcastChannel`, and exports `/content/content.json`; the normal site never loads editor code and only listens for draft messages when `reviewPreview=1` is present.

**Tech Stack:** Vanilla ES modules, DOM APIs, IndexedDB, BroadcastChannel, Fetch API, Node test runner, Playwright.

## Global Constraints

- Chinese (`zh-CN`) is the only directly editable source locale.
- English (`en`) and Japanese (`ja`) remain read-only LLM-derived values in the review route.
- The translation adapter uses same-origin `POST /api/translate`; no API secret is stored or exported by the browser.
- Chinese edits preview and persist without waiting for the translation API.
- A recovery cycle performs one automatic retry; a second failure waits for manual retry.
- Unresolved translations do not block export and retain their last successful or bundled values.
- Normal `/` does not load review UI code or accept review messages without `reviewPreview=1`.
- Inputs use white backgrounds, dark text, visible borders, and blue focus rings.
- Preserve current desktop, window, drag, keyboard, locale, media, and application interactions.
- Add no runtime dependency or frontend framework.
- Work with current user changes and commit only files belonging to the active task.

---

### Task 1: Versioned Content Document And Published Snapshot

**Files:**
- Create: `scripts/content/content-document.js`
- Create: `scripts/content/default-document.js`
- Create: `scripts/content/generate-content-json.mjs`
- Create: `content/content.json`
- Test: `tests/unit/content-document.test.js`

**Interfaces:**
- Consumes: `dictionaries`, `projects`, `articles`, `about`, `channels`, `tracks`, and `photos` from existing modules.
- Produces: `CONTENT_SCHEMA_VERSION`, `validateContentDocument(value)`, `mergeContentDocuments(defaults, published)`, `serializeContentDocument(document)`, `createDefaultContentDocument()`, and `defaultContentDocument`.
- A field is `{ label, kind, group, order, preserveTokens, values: { en, 'zh-CN', ja } }`; `label` is a concise Chinese editor label and every field ID is stable and semantic.

- [ ] **Step 1: Write schema and default-document tests**

```js
test('default content contains localized UI, article, project, about, contact, and media fields', () => {
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
});

test('merge rejects invalid fields and retains their defaults', () => {
  const defaults = createDefaultContentDocument();
  const published = structuredClone(defaults);
  published.fields['ui.site.title'].values.en = '';
  published.fields['projects.signal-garden.description'].values['zh-CN'] = '新描述';
  const result = mergeContentDocuments(defaults, published);
  assert.equal(result.document.fields['ui.site.title'].values.en,
    defaults.fields['ui.site.title'].values.en);
  assert.equal(result.document.fields['projects.signal-garden.description'].values['zh-CN'], '新描述');
  assert.deepEqual(result.invalidFieldIds, ['ui.site.title']);
});

test('serialization is deterministic', () => {
  const document = createDefaultContentDocument();
  assert.equal(serializeContentDocument(document), serializeContentDocument(document));
});
```

- [ ] **Step 2: Run the new test and verify it fails**

Run: `node --test tests/unit/content-document.test.js`

Expected: FAIL because `scripts/content/content-document.js` and `default-document.js` do not exist.

- [ ] **Step 3: Implement validation, merge, stable field extraction, and deterministic serialization**

```js
export const CONTENT_SCHEMA_VERSION = 1;
export const LOCALES = Object.freeze(['en', 'zh-CN', 'ja']);

export function validateContentDocument(value) {
  const errors = [];
  if (!value || value.schemaVersion !== CONTENT_SCHEMA_VERSION) errors.push('schemaVersion');
  if (!value?.fields || typeof value.fields !== 'object' || Array.isArray(value.fields)) {
    errors.push('fields');
  }
  for (const [id, field] of Object.entries(value?.fields ?? {})) {
    if (!field.label || !field.kind || !field.group || !field.values) errors.push(id);
    for (const locale of LOCALES) {
      if (typeof field.values?.[locale] !== 'string' || field.values[locale].length === 0) {
        errors.push(id);
      }
    }
    for (const token of field.preserveTokens ?? []) {
      if (!LOCALES.every((locale) => field.values[locale].includes(token))) errors.push(id);
    }
  }
  return { valid: errors.length === 0, errors: [...new Set(errors)] };
}
```

Build field IDs from dictionary keys and semantic collection IDs. Use fixed `block-001`, `block-002`, and so on for the existing non-structural article editor; the route edits block text but does not insert, delete, or reorder blocks. Store visible literal metadata such as article tags, project kinds, project stacks, About stack rows, channel labels/addresses, photo dates, and track formats as three-locale values so every displayed text remains editable.

- [ ] **Step 4: Generate and inspect the published JSON**

Run: `node scripts/content/generate-content-json.mjs`

Expected: `content/content.json` exists, passes `validateContentDocument`, contains all three locales, and uses two-space JSON indentation with a trailing newline.

- [ ] **Step 5: Run focused and existing content tests**

Run: `node --test tests/unit/content-document.test.js tests/unit/content.test.js tests/unit/i18n.test.js`

Expected: PASS.

- [ ] **Step 6: Commit the content contract**

```bash
git add scripts/content/content-document.js scripts/content/default-document.js \
  scripts/content/generate-content-json.mjs content/content.json \
  tests/unit/content-document.test.js
git commit -m "feat: add versioned portfolio content document"
```

### Task 2: Observable Runtime Content Store

**Files:**
- Create: `scripts/content/content-store.js`
- Create: `scripts/content/materialize-content.js`
- Modify: `scripts/i18n/i18n.js`
- Modify: `scripts/main.js`
- Test: `tests/unit/content-store.test.js`
- Modify: `tests/unit/i18n.test.js`

**Interfaces:**
- Consumes: `defaultContentDocument`, `/content/content.json`, and the validators from Task 1.
- Produces: `createContentStore({ defaultDocument, fetchImpl, logger })` with `document`, `snapshot`, `loadPublished(url)`, `replace(document)`, `field(id)`, and `subscribe(listener)`.
- Produces: `materializeContent(document)` returning `{ dictionaries, projects, articles, about, channels, tracks, photos }` in the shapes expected by current renderers.
- Updates `createI18n(initialLocale, dictionarySource, contentStore)` so store changes notify existing i18n subscribers without changing locale.

- [ ] **Step 1: Write store loading, fallback, and subscription tests**

```js
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
  assert.equal(notifications, 1);
});

test('uses defaults when published fetch fails', async () => {
  const defaults = createDefaultContentDocument();
  const store = createContentStore({
    defaultDocument: defaults,
    fetchImpl: async () => { throw new TypeError('offline'); },
    logger: { warn() {} },
  });
  await store.loadPublished('/content/content.json');
  assert.deepEqual(store.document, defaults);
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `node --test tests/unit/content-store.test.js`

Expected: FAIL because the store and materializer do not exist.

- [ ] **Step 3: Implement the store and materializer**

```js
export function createContentStore({ defaultDocument, fetchImpl = fetch, logger = console }) {
  let document = structuredClone(defaultDocument);
  let snapshot = materializeContent(document);
  const listeners = new Set();
  const publish = () => listeners.forEach((listener) => listener(snapshot));
  return {
    get document() { return structuredClone(document); },
    get snapshot() { return snapshot; },
    field(id) { return document.fields[id] ?? null; },
    async loadPublished(url = '/content/content.json') {
      try {
        const response = await fetchImpl(url);
        if (!response.ok) throw new Error(`content fetch ${response.status}`);
        const merged = mergeContentDocuments(defaultDocument, await response.json());
        document = merged.document;
        snapshot = materializeContent(document);
        if (merged.invalidFieldIds.length) logger.warn('Invalid content fields', merged.invalidFieldIds);
        publish();
      } catch (error) {
        logger.warn('Published content unavailable; using bundled defaults', error.name);
      }
      return snapshot;
    },
    replace(next) {
      const validation = validateContentDocument(next);
      if (!validation.valid) throw new TypeError(`Invalid content document: ${validation.errors.join(', ')}`);
      document = structuredClone(next);
      snapshot = materializeContent(document);
      publish();
    },
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
  };
}
```

- [ ] **Step 4: Wire startup and i18n to the store**

In `scripts/main.js`, construct the store, await `loadPublished`, then create i18n and the desktop. Preserve the existing exported `i18n` and `desktop` names. In `scripts/i18n/i18n.js`, resolve dictionaries from `contentStore.snapshot.dictionaries` and forward store changes through the existing subscription channel.

- [ ] **Step 5: Run store, i18n, and smoke tests**

Run: `node --test tests/unit/content-store.test.js tests/unit/i18n.test.js`

Run: `npx playwright test tests/e2e/boot.spec.js tests/e2e/shell.spec.js`

Expected: PASS; `/` still boots and changes locale normally.

- [ ] **Step 6: Commit the runtime store**

```bash
git add scripts/content/content-store.js scripts/content/materialize-content.js \
  scripts/i18n/i18n.js scripts/main.js tests/unit/content-store.test.js tests/unit/i18n.test.js
git commit -m "feat: load portfolio copy through content store"
```

### Task 3: Move Renderers Onto The Shared Snapshot

**Files:**
- Modify: `scripts/window-manager.js`
- Modify: `scripts/desktop.js`
- Modify: `scripts/environment/environment-controller.js`
- Modify: `scripts/apps/about-app.js`
- Modify: `scripts/apps/albums-app.js`
- Modify: `scripts/apps/contact-app.js`
- Modify: `scripts/apps/desktop-folders.js`
- Modify: `scripts/apps/photos-app.js`
- Modify: `scripts/apps/projects-app.js`
- Modify: `scripts/apps/writing-app.js`
- Modify: `scripts/environment/music-deck.js`
- Modify: `scripts/i18n/dictionaries.js`
- Modify: `tests/e2e/apps.spec.js`
- Test: `tests/e2e/content-runtime.spec.js`

**Interfaces:**
- Consumes: `contentStore.snapshot` and `contentStore.subscribe` from Task 2.
- Produces: renderer context `{ app, i18n, content, mount, host }`, where `content()` returns the latest materialized snapshot; content-store changes flow through the i18n subscription channel created in Task 2.
- Produces: new dictionary keys for previously hard-coded human copy such as photo navigation and the boot bot label; protocol glyphs and generated counters remain literals.

- [ ] **Step 1: Write a published-content render regression test**

```js
test('apps render a published content snapshot', async ({ page }) => {
  const published = createDefaultContentDocument();
  published.fields['articles.flow-canvas-information-overload.title'].values['zh-CN'] = '发布后的文章标题';
  await page.route('**/content/content.json', (route) => route.fulfill({ json: published }));
  await page.addInitScript(() => localStorage.setItem('portfolio-os:preferences', JSON.stringify({
    version: 1, bootComplete: true, layout: 'windows', locale: 'zh-CN', audioEnabled: false,
  })));
  await page.goto('/');
  await page.locator('[data-app-icon="writing"]').click();
  await expect(page.locator('[data-app-window="writing"]')).toContainText('发布后的文章标题');
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npx playwright test tests/e2e/content-runtime.spec.js`

Expected: FAIL because renderers still import content directly.

- [ ] **Step 3: Pass the content accessor through desktop, environment, and window contexts**

```js
const content = () => contentStore.snapshot;
windowManager = createWindowManager({
  root: desktopRoot,
  registry: apps,
  i18n,
  content,
  preferences,
  renderers,
});
```

Pass `content` to renderer calls and to desktop/environment construction. The Task 2 i18n bridge emits through existing subscriptions when content changes, so do not add a second store subscription that would render every surface twice. Preserve window state and mounted interaction state; content-driven apps replace only their existing inner content through their local render functions.

- [ ] **Step 4: Replace direct editable-content imports in each renderer**

Use `const { articles } = content()` inside render operations, not once at mount time. Keep structural utilities such as `pick` importable. Update photos, albums, folders, and the environment deck to receive their latest `tracks` or `photos` collection without resetting the selected slug or playback state.

- [ ] **Step 5: Localize remaining hard-coded human-facing labels**

Add symmetric English, Chinese, and Japanese keys for visible `PREV`, `NEXT`, `BOT`, and any other copy found by the literal-string audit. Keep `[OK]`, `[··]`, `TRK`, numeric counters, arrows, and playback glyphs as non-copy runtime tokens.

- [ ] **Step 6: Run content, application, and interaction regressions**

Run: `node --test tests/unit/content.test.js tests/unit/i18n.test.js tests/unit/music-deck.test.js`

Run: `npx playwright test tests/e2e/content-runtime.spec.js tests/e2e/apps.spec.js tests/e2e/desktop.spec.js tests/e2e/windows.spec.js tests/e2e/environment.spec.js`

Expected: PASS with unchanged interaction assertions.

- [ ] **Step 7: Commit renderer integration**

```bash
git add scripts/window-manager.js scripts/desktop.js scripts/environment/environment-controller.js \
  scripts/apps scripts/environment/music-deck.js scripts/i18n/dictionaries.js \
  tests/e2e/content-runtime.spec.js tests/e2e/apps.spec.js
git commit -m "refactor: render editable copy from shared content"
```

### Task 4: IndexedDB Draft Store And Translation Queue

**Files:**
- Create: `scripts/writing/review-storage.js`
- Create: `scripts/writing/translation-client.js`
- Create: `scripts/writing/translation-queue.js`
- Test: `tests/unit/review-storage.test.js`
- Test: `tests/unit/translation-queue.test.js`

**Interfaces:**
- Produces: `createReviewStorage({ indexedDB })` with async `loadDraft()`, `saveDraft(document)`, `loadJobs()`, `saveJobs(jobs)`, and `clear()`.
- Produces: `translateItems(items, { fetchImpl, signal, endpoint = '/api/translate' })`.
- Produces: `createTranslationQueue({ storage, translate, getDocument, replaceDocument, now, hash })` with `enqueue(fieldId)`, `recover(trigger)`, `retry(jobId)`, `retryAll()`, `jobs()`, and `subscribe(listener)`.

- [ ] **Step 1: Write persistence fallback tests**

```js
test('falls back to memory when IndexedDB cannot open', async () => {
  const storage = createReviewStorage({ indexedDB: { open() { throw new Error('denied'); } } });
  await storage.saveDraft({ schemaVersion: 1, fields: {} });
  assert.deepEqual(await storage.loadDraft(), { schemaVersion: 1, fields: {} });
  assert.equal(storage.persistent, false);
});
```

- [ ] **Step 2: Write queue supersession, stale-response, and recovery tests**

```js
function createDeferred() {
  let resolve;
  let reject;
  const promise = new Promise((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });
  return { promise, resolve, reject };
}

test('a late response cannot overwrite a newer Chinese revision', async () => {
  let current = createDefaultContentDocument();
  const storage = createReviewStorage({ indexedDB: null });
  const deferred = createDeferred();
  const queue = createTranslationQueue({ storage, translate: () => deferred.promise,
    getDocument: () => current, replaceDocument: (next) => { current = next; } });
  const first = queue.enqueue('ui.site.title');
  current.fields['ui.site.title'].values['zh-CN'] = '第二版';
  queue.enqueue('ui.site.title');
  deferred.resolve({ en: 'First', ja: '最初' });
  await first;
  assert.notEqual(current.fields['ui.site.title'].values.en, 'First');
});

test('recovery retries once and waits for manual action after the next failure', async () => {
  let current = createDefaultContentDocument();
  const storage = createReviewStorage({ indexedDB: null });
  const queue = createTranslationQueue({ storage, translate: async () => { throw new Error('offline'); },
    getDocument: () => current, replaceDocument() {} });
  await queue.enqueue('ui.site.title');
  await queue.recover('route-open');
  await queue.recover('online');
  assert.equal(queue.jobs()[0].automaticAttempts, 1);
  assert.equal(queue.jobs()[0].status, 'waiting-manual');
});
```

- [ ] **Step 3: Run both tests and verify they fail**

Run: `node --test tests/unit/review-storage.test.js tests/unit/translation-queue.test.js`

Expected: FAIL because the writing persistence modules do not exist.

- [ ] **Step 4: Implement IndexedDB with an in-memory fallback**

Use database `portfolio-writing`, version `1`, and stores `drafts` and `jobs`. Keep exactly one draft record with key `current`; store jobs by stable `jobId`. Expose `persistent` so the UI can display the required warning.

- [ ] **Step 5: Implement the fetch adapter and durable queue**

```js
export async function translateItems(items, {
  fetchImpl = fetch,
  signal,
  endpoint = '/api/translate',
} = {}) {
  const response = await fetchImpl(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ sourceLocale: 'zh-CN', targetLocales: ['en', 'ja'], items }),
    signal,
  });
  if (!response.ok) throw new TranslationError('http');
  return validateTranslationResponse(await response.json(), items);
}
```

Hash source text with `crypto.subtle.digest('SHA-256', ...)` in browsers and an injected deterministic hash in tests. Normalize errors to `offline`, `timeout`, `http`, `invalid-response`, or `token-mismatch`; do not persist response bodies.

- [ ] **Step 6: Run queue and storage tests**

Run: `node --test tests/unit/review-storage.test.js tests/unit/translation-queue.test.js`

Expected: PASS.

- [ ] **Step 7: Commit persistence and queue logic**

```bash
git add scripts/writing/review-storage.js scripts/writing/translation-client.js \
  scripts/writing/translation-queue.js tests/unit/review-storage.test.js \
  tests/unit/translation-queue.test.js
git commit -m "feat: persist recoverable translation jobs"
```

### Task 5: Review Route And Editing Workspace

**Files:**
- Create: `writing/index.html`
- Create: `styles/writing-review.css`
- Create: `scripts/writing/editor-view.js`
- Create: `scripts/writing/import-export.js`
- Create: `scripts/writing/main.js`
- Test: `tests/unit/import-export.test.js`
- Test: `tests/e2e/writing-review.spec.js`

**Interfaces:**
- Consumes: content document/store APIs from Tasks 1-2 and persistence/queue APIs from Task 4.
- Produces: `createWritingReviewApp({ root, contentStore, storage, queue, channel = { publish() {} } })`.
- Produces: `importContentDocument(fileText, currentDocument)` and `createContentExport(document, jobs, defaults, now)` returning `{ contentJson, reportJson, unresolvedCount }`.

- [ ] **Step 1: Write atomic import and unresolved export tests**

```js
test('invalid import does not mutate the current document', () => {
  const current = createDefaultContentDocument();
  assert.throws(() => importContentDocument('{"schemaVersion":99}', current));
  assert.equal(current.fields['ui.site.title'].values['zh-CN'], '凌晨两点，不存在的频率');
});

test('export keeps old translations and reports unresolved fields', () => {
  const document = createDefaultContentDocument();
  document.fields['ui.site.title'].values['zh-CN'] = '新中文标题';
  const result = createContentExport(document, [{ fieldId: 'ui.site.title', status: 'waiting-manual',
    errorCategory: 'offline', updatedAt: 1 }], createDefaultContentDocument(), () => 2);
  const exported = JSON.parse(result.contentJson);
  assert.equal(exported.fields['ui.site.title'].values.en,
    createDefaultContentDocument().fields['ui.site.title'].values.en);
  assert.equal(result.unresolvedCount, 1);
});
```

- [ ] **Step 2: Write the initial route e2e test**

```js
test('edits Chinese while generated locales remain read only', async ({ page }) => {
  await page.goto('/writing/');
  await expect(page.locator('[data-writing-review]')).toBeVisible();
  await page.locator('[data-field-search]').fill('站点标题');
  const editor = page.locator('[data-field-id="ui.site.title"]');
  await editor.locator('textarea, input').fill('新的凌晨两点');
  await expect(editor.locator('[data-locale-value="en"]')).toHaveAttribute('readonly', '');
  await expect(page.locator('[data-save-status]')).toContainText('已保存');
});
```

- [ ] **Step 3: Run focused tests and verify they fail**

Run: `node --test tests/unit/import-export.test.js`

Run: `npx playwright test tests/e2e/writing-review.spec.js`

Expected: FAIL because `/writing/` and its modules do not exist.

- [ ] **Step 4: Build the semantic route shell and responsive workspace**

The HTML contains one main landmark with header actions, navigation, editor, task status, and a titled preview iframe. Use buttons with text only for Import, Export, Retry all, and Reset because they are explicit commands; use familiar icon buttons with accessible labels for preview reload and panel close. On widths below `760px`, use an ARIA tablist to switch between editor and preview.

- [ ] **Step 5: Render searchable field groups and Chinese-first fields**

```js
function debounceByKey(delay, callback) {
  const timers = new Map();
  return (key) => {
    clearTimeout(timers.get(key));
    timers.set(key, setTimeout(() => {
      timers.delete(key);
      callback(key);
    }, delay));
  };
}

const scheduleTranslation = debounceByKey(800, (fieldId) => queue.enqueue(fieldId));
const updateChinese = (fieldId, value) => {
  const next = contentStore.document;
  next.fields[fieldId].values['zh-CN'] = value;
  contentStore.replace(next);
};
const input = createElement(document, field.kind === 'longText' ? 'textarea' : 'input', {
  'data-source-input': '',
  'aria-describedby': `${domId}-status`,
});
input.value = field.values['zh-CN'];
input.addEventListener('input', () => {
  updateChinese(fieldId, input.value);
  void storage.saveDraft(contentStore.document);
  channel.publish(contentStore.document);
  scheduleTranslation(fieldId);
});
```

Default groups are Articles, Projects, About, Contact, Photos, and Albums. Advanced groups are Interface copy and Accessibility labels. Preserve navigation selection and editor scroll while status updates render.

- [ ] **Step 6: Implement import, export, retry, reset, and warnings**

Import validates before `contentStore.replace`. Export downloads `portfolio-content.json` and, only when unresolved jobs exist, `portfolio-content-unresolved.json`. Reset requires a native confirmation and clears only IndexedDB review data. Show an always-visible warning when `storage.persistent === false`.

- [ ] **Step 7: Apply the approved visual system**

Use the approved three-column desktop layout, square corners, restrained neutral editor surfaces, white inputs with `#111827` text, `#64748b` borders, `#2563eb` focus borders, and a visible focus ring. Do not nest editor sections in decorative cards. Ensure long text wraps and no font size scales with viewport width.

- [ ] **Step 8: Run focused tests**

Run: `node --test tests/unit/import-export.test.js`

Run: `npx playwright test tests/e2e/writing-review.spec.js`

Expected: PASS for route resolution, field editing, read-only translations, import rejection, export, and responsive tab behavior.

- [ ] **Step 9: Commit the review workspace**

```bash
git add writing/index.html styles/writing-review.css scripts/writing/editor-view.js \
  scripts/writing/import-export.js scripts/writing/main.js tests/unit/import-export.test.js \
  tests/e2e/writing-review.spec.js
git commit -m "feat: add local writing review workspace"
```

### Task 6: Isolated Live Preview Bridge

**Files:**
- Create: `scripts/content/review-preview.js`
- Modify: `scripts/main.js`
- Modify: `scripts/writing/main.js`
- Modify: `tests/e2e/writing-review.spec.js`
- Test: `tests/unit/review-preview.test.js`

**Interfaces:**
- Produces: `createReviewPublisher({ channelFactory, channelName })` with `publish(document)` and `close()`.
- Produces: `connectReviewPreview({ location, contentStore, channelFactory, channelName })`, returning a no-op outside `reviewPreview=1` and a cleanup function inside preview mode.
- Uses a session-specific channel name passed in the iframe query, preventing unrelated tabs from sharing drafts.

- [ ] **Step 1: Write channel guard and replacement tests**

```js
function fakeChannel() {
  const listeners = new Set();
  return {
    addEventListener(type, listener) { if (type === 'message') listeners.add(listener); },
    removeEventListener(type, listener) { if (type === 'message') listeners.delete(listener); },
    emit(data) { listeners.forEach((listener) => listener({ data })); },
    close() {},
  };
}

test('normal site does not create a review channel', () => {
  const contentStore = createContentStore({ defaultDocument: createDefaultContentDocument() });
  let opened = false;
  connectReviewPreview({ location: new URL('https://example.test/'), contentStore,
    channelFactory: () => { opened = true; } });
  assert.equal(opened, false);
});

test('preview validates a message before replacing content', () => {
  const validDocument = createDefaultContentDocument();
  const contentStore = createContentStore({ defaultDocument: validDocument });
  const channel = fakeChannel();
  connectReviewPreview({ location: new URL('https://example.test/?reviewPreview=1&channel=test'),
    contentStore, channelFactory: () => channel });
  channel.emit({ type: 'content-document', document: validDocument });
  assert.deepEqual(contentStore.document, validDocument);
  channel.emit({ type: 'content-document', document: { schemaVersion: 99 } });
  assert.deepEqual(contentStore.document, validDocument);
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `node --test tests/unit/review-preview.test.js`

Expected: FAIL because the preview bridge does not exist.

- [ ] **Step 3: Implement the session-scoped publisher and guarded listener**

Only accept messages with exact `{ type: 'content-document', document }` shape and a valid content document. Do not use `'*'` window messaging. Close channels on `pagehide`. Generate the channel name with `crypto.randomUUID()` in the editor and pass it through `URLSearchParams` to the iframe.

- [ ] **Step 4: Preserve preview interaction state during content updates**

Subscribe renderers to store updates rather than reassigning `iframe.src`. Add an e2e flow that opens Writing inside the preview, edits a Chinese field outside the iframe, asserts the open reader remains open and updated, then verifies window close, drag, ArrowRight navigation, and locale switching still work.

- [ ] **Step 5: Test API failure, recovery, and stale-response behavior through the UI**

Use `page.route('**/api/translate', ...)` to return `503`, verify a durable waiting task, reload `/writing/`, allow the single automatic retry to succeed, and assert English and Japanese preview values update. Add a delayed first response followed by a newer edit and assert the delayed result is ignored.

- [ ] **Step 6: Run bridge and review-mode tests**

Run: `node --test tests/unit/review-preview.test.js tests/unit/translation-queue.test.js`

Run: `npx playwright test tests/e2e/writing-review.spec.js`

Expected: PASS with no iframe reload after source edits.

- [ ] **Step 7: Commit live-preview integration**

```bash
git add scripts/content/review-preview.js scripts/main.js scripts/writing/main.js \
  tests/unit/review-preview.test.js tests/e2e/writing-review.spec.js
git commit -m "feat: preview writing drafts without intercepting interactions"
```

### Task 7: Full Verification And Visual Review

**Files:**
- Modify: `tests/e2e/writing-review.spec.js`
- Create: `docs/writing-review.md`
- Modify only when failures expose feature regressions: files changed in Tasks 1-6.

**Interfaces:**
- Consumes: the complete route, content store, queue, import/export, and preview bridge.
- Produces: documented local workflow and a fully passing regression suite.

- [ ] **Step 1: Add final accessibility and responsive assertions**

```js
test('mobile review mode uses tabs without overlap', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/writing/');
  await expect(page.getByRole('tab', { name: '编辑' })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('tab', { name: '预览' }).click();
  await expect(page.locator('iframe[title="站点交互预览"]')).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  expect(overflow).toBe(false);
});
```

- [ ] **Step 2: Document the local review and publish workflow**

Document these exact actions: open `/writing/`; edit Chinese; inspect task status; use manual Retry all after a second failure; export `portfolio-content.json`; review the unresolved report; replace `content/content.json`; reload `/` to verify published copy. State that `/api/translate` must implement the request/response contract from the design spec.

- [ ] **Step 3: Run all unit tests**

Run: `npm run test:unit`

Expected: PASS.

- [ ] **Step 4: Run all end-to-end tests**

Run: `npm run test:e2e`

Expected: PASS.

- [ ] **Step 5: Capture desktop and mobile screenshots**

Run the Playwright review spec with screenshot capture at `1440x900`, `834x1194`, and `390x844`. Inspect that the iframe is nonblank, the approved white-input contrast is present, text does not overlap, and mobile tabs expose both surfaces.

- [ ] **Step 6: Check for unowned text and malformed output**

Run: `rg -n --pcre2 "textContent\s*=\s*['\"]|createTextNode\(['\"]|aria-label=['\"]|>[^<{]*[A-Za-z\p{Han}\p{Hiragana}\p{Katakana}][^<{]*<" scripts index.html writing --glob '*.js' --glob '*.html'`

Review every match. Move human-facing copy into the document; retain only runtime tokens, generated values, and editor-only fixed Chinese labels. Then run: `git diff --check`.

Expected: no unowned normal-site human copy and no whitespace errors.

- [ ] **Step 7: Commit verification and usage documentation**

```bash
git add tests/e2e/writing-review.spec.js docs/writing-review.md
git commit -m "test: verify writing review workflow"
```

- [ ] **Step 8: Inspect final scope**

Run: `git status --short`

Run: `git diff HEAD~7 --stat`

Expected: only the content contract, content runtime integration, `/writing` review route, tests, and documentation are included; unrelated user files remain untouched.
