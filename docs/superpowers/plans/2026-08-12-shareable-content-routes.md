# Shareable Content Routes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace in-window article and project details with independently loadable, shareable static pages at `writing/<slug>/` and `projects/<slug>/`.

**Architecture:** A small route module owns URL construction and desktop return parsing. A Node generator commits physical GitHub Pages entry documents, while one shared content-page runtime selects an article or project presentation from the existing catalog. Desktop apps retain their archive/ring browsing interfaces but navigate to real content URLs instead of storing detail state.

**Tech Stack:** Vanilla JavaScript ES modules, static HTML/CSS, Node.js file APIs and test runner, Playwright, GitHub Pages.

## Global Constraints

- Content routes are language-neutral: `writing/<slug>/` and `projects/<slug>/`.
- GitHub Pages direct loads and refreshes must work without `404.html` SPA recovery.
- Generated entry pages are committed to the repository and use English static metadata.
- Independent pages do not render desktop, Dock, taskbar, or window chrome.
- Saved locale wins; otherwise match browser language, then fall back to English.
- Explicit returns use `?open=writing` and `?open=projects`, and the query remains after opening.
- Existing unrelated worktree changes must not be staged or reverted.

## File Map

- `scripts/routing/content-routes.js`: validate content identifiers and construct all content/desktop URLs.
- `scripts/generate-content-pages.mjs`: render, write, clean, and freshness-check physical entry documents.
- `content-pages.manifest.json`: generated list of files owned by the content-page generator.
- `scripts/pages/content-page.js`: boot the independent page shell, locale control, content lookup, unavailable state, and focus.
- `scripts/pages/article-page.js`: render an article document and sibling article navigation.
- `scripts/pages/project-page.js`: render a project document and own the wireframe preview lifecycle.
- `styles/content-page.css`: standalone content-page layout and responsive presentation.
- `scripts/state/preferences.js`: expose saved/browser locale resolution used by independent pages.
- `scripts/i18n/dictionaries.js`: add localized independent-page labels.
- `scripts/apps/writing-app.js`: retain only the archive and real article links.
- `scripts/apps/projects-app.js`: retain only the ring and real project links.
- `scripts/main.js`: restore `?open=` desktop targets after boot/reveal.
- `writing/*/index.html`, `projects/*/index.html`: generated physical GitHub Pages entries.
- `tests/unit/content-routes.test.js`: route validation and desktop-target parsing.
- `tests/unit/content-page-generation.test.js`: generator output, metadata, cleanup, and freshness.
- `tests/unit/preferences.test.js`: saved/browser locale precedence.
- `tests/e2e/content-pages.spec.js`: direct loads, refreshes, locale, sibling navigation, return links, semantics, and base-path behavior.
- `tests/static-server.mjs`: serve the repository at both `/` and a `/readME/` project base during browser tests.
- `tests/e2e/apps.spec.js`, `tests/e2e/boot.spec.js`: desktop navigation and `?open=` restoration.

---

### Task 1: Content Route Interface

**Files:**
- Create: `scripts/routing/content-routes.js`
- Create: `tests/unit/content-routes.test.js`

**Interfaces:**
- Produces: `contentPath(kind: 'writing' | 'projects', slug: string): string`
- Produces: `desktopPath(kind: 'writing' | 'projects'): string`
- Produces: `readDesktopTarget(search: string): 'writing' | 'projects' | null`
- Invariant: returned paths are relative to the current site base and never begin with `/`.

- [ ] **Step 1: Write failing route tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { contentPath, desktopPath, readDesktopTarget } from '../../scripts/routing/content-routes.js';

test('builds site-relative content and desktop paths', () => {
  assert.equal(contentPath('writing', 'hello-world'), 'writing/hello-world/');
  assert.equal(contentPath('projects', 'signal-garden'), 'projects/signal-garden/');
  assert.equal(desktopPath('writing'), '?open=writing');
});

test('rejects unsupported kinds and unsafe slugs', () => {
  assert.throws(() => contentPath('photos', 'coast'), /Unsupported content kind/);
  for (const slug of ['', '../admin', 'Two Words', 'double--dash', 'trailing-']) {
    assert.throws(() => contentPath('writing', slug), /Invalid content slug/);
  }
});

test('reads only supported desktop targets', () => {
  assert.equal(readDesktopTarget('?open=projects'), 'projects');
  assert.equal(readDesktopTarget('?skipBoot=1&open=writing'), 'writing');
  assert.equal(readDesktopTarget('?open=settings'), null);
  assert.equal(readDesktopTarget('?open=../writing'), null);
});
```

- [ ] **Step 2: Run the route test and verify the missing-module failure**

Run: `node --test tests/unit/content-routes.test.js`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `scripts/routing/content-routes.js`.

- [ ] **Step 3: Implement the route module**

```js
const CONTENT_KINDS = new Set(['writing', 'projects']);
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function assertKind(kind) {
  if (!CONTENT_KINDS.has(kind)) throw new TypeError(`Unsupported content kind: ${kind}`);
}

function assertSlug(slug) {
  if (typeof slug !== 'string' || !SLUG.test(slug)) {
    throw new TypeError(`Invalid content slug: ${slug}`);
  }
}

export function contentPath(kind, slug) {
  assertKind(kind);
  assertSlug(slug);
  return `${kind}/${slug}/`;
}

export function desktopPath(kind) {
  assertKind(kind);
  return `?open=${kind}`;
}

export function readDesktopTarget(search = '') {
  const kind = new URLSearchParams(search).get('open');
  return CONTENT_KINDS.has(kind) ? kind : null;
}
```

- [ ] **Step 4: Run route and full unit tests**

Run: `node --test tests/unit/content-routes.test.js && npm run test:unit`

Expected: route tests PASS and the complete unit suite reports zero failures.

- [ ] **Step 5: Commit the route interface**

```bash
git add scripts/routing/content-routes.js tests/unit/content-routes.test.js
git commit -m "feat: add content route interface"
```

---

### Task 2: Static Entry Page Generator

**Files:**
- Create: `scripts/generate-content-pages.mjs`
- Create: `tests/unit/content-page-generation.test.js`
- Create: `content-pages.manifest.json`
- Modify: `package.json`
- Generate: `writing/*/index.html`
- Generate: `projects/*/index.html`

**Interfaces:**
- Consumes: `contentPath(kind, slug)` from Task 1.
- Produces: `buildContentEntries(): Array<{ kind, slug, title, description, ogType }>`.
- Produces: `renderEntryPage(entry): string`.
- Produces: `generateContentPages({ root, check }): Promise<{ files: string[] }>`.
- CLI: `node scripts/generate-content-pages.mjs` writes pages; `--check` exits nonzero when committed output is stale.

- [ ] **Step 1: Write failing generator tests using a temporary root**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { articles, projects } from '../../scripts/data/content.js';
import { generateContentPages } from '../../scripts/generate-content-pages.mjs';

test('generates one metadata-rich physical page per content item', async () => {
  const root = await mkdtemp(join(tmpdir(), 'portfolio-pages-'));
  const result = await generateContentPages({ root, check: false });
  assert.equal(result.files.length, articles.length + projects.length);
  const file = join(root, 'writing', articles[0].slug, 'index.html');
  const html = await readFile(file, 'utf8');
  assert.match(html, /<base href="\.\.\/\.\.\/">/);
  assert.match(html, new RegExp(`data-content-slug="${articles[0].slug}"`));
  assert.match(html, /<meta property="og:type" content="article">/);
  await generateContentPages({ root, check: true });
});

test('freshness check rejects modified output', async () => {
  const root = await mkdtemp(join(tmpdir(), 'portfolio-pages-'));
  const { files } = await generateContentPages({ root, check: false });
  await writeFile(join(root, files[0]), 'stale');
  await assert.rejects(generateContentPages({ root, check: true }), /Generated content pages are stale/);
});
```

- [ ] **Step 2: Run the generator test and verify the missing-module failure**

Run: `node --test tests/unit/content-page-generation.test.js`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `scripts/generate-content-pages.mjs`.

- [ ] **Step 3: Implement deterministic entry rendering and guarded cleanup**

Implement `scripts/generate-content-pages.mjs` with these concrete rules:

```js
const MANIFEST = 'content-pages.manifest.json';
const OWNED_PATH = /^(writing|projects)\/[a-z0-9]+(?:-[a-z0-9]+)*\/index\.html$/;

export function buildContentEntries() {
  return [
    ...articles.map((article) => ({
      kind: 'writing', slug: article.slug, title: article.title.en,
      description: excerpt(article.body.en.find((item) => typeof item === 'string')),
      ogType: 'article',
    })),
    ...projects.map((project) => ({
      kind: 'projects', slug: project.slug, title: project.title.en,
      description: project.description.en, ogType: 'website',
    })),
  ];
}

export function renderEntryPage(entry) {
  const title = escapeHtml(`${entry.title} - QIZHI`);
  const description = escapeHtml(entry.description);
  return `<!doctype html>\n<html lang="en">\n<head>\n`
    + `  <meta charset="UTF-8">\n  <base href="../../">\n`
    + `  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n`
    + `  <title>${title}</title>\n  <meta name="description" content="${description}">\n`
    + `  <meta property="og:type" content="${entry.ogType}">\n`
    + `  <meta property="og:title" content="${title}">\n`
    + `  <meta property="og:description" content="${description}">\n`
    + `  <link rel="stylesheet" href="styles/tokens.css">\n`
    + `  <link rel="stylesheet" href="styles/content-page.css">\n</head>\n`
    + `<body data-content-kind="${entry.kind}" data-content-slug="${entry.slug}">\n`
    + `  <div data-content-page></div>\n`
    + `  <script type="module" src="scripts/pages/content-page.js"></script>\n`
    + `</body>\n</html>\n`;
}
```

`generateContentPages` must sort entries by `kind/slug`, compare exact bytes in check mode, write the manifest as formatted JSON with a trailing newline, and only remove stale paths that match `OWNED_PATH` and were listed by the previous manifest. Throw `Generated content pages are stale: <paths>` when check mode finds any mismatch.

- [ ] **Step 4: Add generator scripts and create committed entries**

Add to `package.json`:

```json
"generate:pages": "node scripts/generate-content-pages.mjs",
"check:pages": "node scripts/generate-content-pages.mjs --check"
```

Run: `npm run generate:pages`

Expected: a manifest plus one `index.html` under every article and project slug.

- [ ] **Step 5: Run generator, freshness, and unit verification**

Run: `node --test tests/unit/content-page-generation.test.js && npm run check:pages && npm run test:unit`

Expected: all commands exit 0 and the freshness check reports no stale pages.

- [ ] **Step 6: Commit the generator and physical entries**

```bash
git add scripts/generate-content-pages.mjs tests/unit/content-page-generation.test.js package.json content-pages.manifest.json writing projects
git commit -m "feat: generate static content entries"
```

---

### Task 3: Independent Article Page And Locale Shell

**Files:**
- Create: `scripts/pages/content-page.js`
- Create: `scripts/pages/article-page.js`
- Create: `styles/content-page.css`
- Modify: `scripts/state/preferences.js`
- Modify: `scripts/i18n/dictionaries.js`
- Modify: `tests/unit/preferences.test.js`
- Modify: `tests/unit/i18n.test.js`
- Create: `tests/e2e/content-pages.spec.js`

**Interfaces:**
- Produces: `resolvePreferredLocale(storage, browserLanguages): 'en' | 'zh-CN' | 'ja'` in `preferences.js`.
- Produces: `renderArticlePage({ document, i18n, article, articles }): HTMLElement`.
- `content-page.js` is a browser entry module and renders into `[data-content-page]`.

- [ ] **Step 1: Write failing locale precedence tests**

Add to `tests/unit/preferences.test.js`:

```js
test('content locale prefers saved locale, then browser language, then English', () => {
  const saved = memoryStorage(JSON.stringify({ ...DEFAULT_PREFERENCES, locale: 'ja' }));
  assert.equal(resolvePreferredLocale(saved, ['zh-CN']), 'ja');
  assert.equal(resolvePreferredLocale(memoryStorage(), ['zh-HK', 'en-US']), 'zh-CN');
  assert.equal(resolvePreferredLocale(memoryStorage(), ['ja-JP']), 'ja');
  assert.equal(resolvePreferredLocale(memoryStorage(), ['fr-FR']), 'en');
});
```

- [ ] **Step 2: Write a failing direct-article browser test**

Create `tests/e2e/content-pages.spec.js` with a test that navigates to `/writing/${articles[0].slug}/`, then asserts `[data-content-article]`, exactly one `h1`, no `[data-desktop-root]`, an English meta description, `?open=writing` on the return anchor, and the same pathname after reload.

- [ ] **Step 3: Run tests and verify failures**

Run: `node --test tests/unit/preferences.test.js && npx playwright test tests/e2e/content-pages.spec.js`

Expected: unit FAIL because `resolvePreferredLocale` is missing; browser FAIL because the generated entry references a missing content-page module/style.

- [ ] **Step 4: Implement locale resolution and localized page labels**

In `preferences.js`, parse the stored version-1 record without converting an absent record into default English. Match exact supported browser locales first, then language prefixes (`zh` to `zh-CN`, `ja` to `ja`, `en` to `en`). Return `en` when no match exists.

Add symmetric keys in all dictionaries:

```js
'content.language': 'Language',
'content.unavailable': 'Content unavailable',
'content.returnWriting': 'Return to Writing',
'content.returnProjects': 'Return to Projects',
'content.project': 'Project',
'content.article': 'Article',
```

Use equivalent Simplified Chinese and Japanese strings and keep the existing dictionary symmetry test passing.

- [ ] **Step 5: Implement the article presentation and shared shell**

Move the current reader behavior into `renderArticlePage`: calculate reading time, render metadata, convert article section records to `h2`, preserve external references, and render previous/next as anchors using `contentPath('writing', sibling.slug)`.

In `content-page.js`:

```js
const kind = document.body.dataset.contentKind;
const slug = document.body.dataset.contentSlug;
const mount = document.querySelector('[data-content-page]');
const locale = resolvePreferredLocale(localStorage, navigator.languages);
const i18n = createI18n(locale);
let disposePresentation = () => {};
let focused = false;

function render() {
  disposePresentation();
  const item = kind === 'writing'
    ? articles.find((entry) => entry.slug === slug)
    : projects.find((entry) => entry.slug === slug);
  const header = renderPageHeader({ document, i18n, kind, onLocaleChange });
  const main = document.createElement('main');
  const presentation = item && kind === 'writing'
    ? { element: renderArticlePage({ document, i18n, article: item, articles }), dispose() {} }
    : item && kind === 'projects'
      ? renderProjectPage({ document, i18n, project: item })
      : renderUnavailable({ document, i18n, kind });
  disposePresentation = presentation.dispose;
  main.append(presentation.element);
  mount.replaceChildren(header, main);
  document.documentElement.lang = i18n.locale;
  document.title = item ? `${pick(item.title, i18n.locale)} - QIZHI` : i18n.t('content.unavailable');
  if (!focused) {
    main.querySelector('h1')?.focus({ preventScroll: true });
    focused = true;
  }
}
```

Implement the private helpers with fixed contracts: `renderPageHeader({ document, i18n, kind, onLocaleChange })` returns a `header` containing a `desktopPath(kind)` anchor and a three-option select; `renderUnavailable({ document, i18n, kind })` returns `{ element, dispose() {} }` with a focusable `h1` and desktop return anchor. `onLocaleChange(locale)` validates the select value through `i18n.setLocale`, saves it through the preferences module, and invokes `render()`.

The locale select updates `loadPreferences(localStorage).locale`, persists through `savePreferences`, calls `i18n.setLocale`, leaves `location` untouched, synchronizes `document.documentElement.lang` and the localized document title, and focuses the initial `h1` once with `preventScroll`.

- [ ] **Step 6: Implement standalone article styling**

Create `styles/content-page.css` with stable responsive geometry: a full-page grid background, `max-width: 1120px` shell, article measure no wider than `760px`, square 1px borders, compact header controls, visible focus outlines, prose/heading spacing, references, reading bands, and a two-column previous/next footer that stacks below `680px`. Do not import desktop window, Dock, or taskbar styles.

- [ ] **Step 7: Regenerate entries and run article verification**

Run: `npm run generate:pages && npm run check:pages && node --test tests/unit/preferences.test.js tests/unit/i18n.test.js && npx playwright test tests/e2e/content-pages.spec.js`

Expected: all commands exit 0; direct article load and reload display one standalone article page.

- [ ] **Step 8: Commit the article page shell**

```bash
git add scripts/pages/content-page.js scripts/pages/article-page.js styles/content-page.css scripts/state/preferences.js scripts/i18n/dictionaries.js tests/unit/preferences.test.js tests/unit/i18n.test.js tests/e2e/content-pages.spec.js writing projects content-pages.manifest.json
git commit -m "feat: add standalone article pages"
```

---

### Task 4: Independent Project Page

**Files:**
- Create: `scripts/pages/project-page.js`
- Modify: `scripts/pages/content-page.js`
- Modify: `styles/content-page.css`
- Modify: `tests/e2e/content-pages.spec.js`

**Interfaces:**
- Consumes: `contentPath` and `desktopPath` from Task 1.
- Produces: `renderProjectPage({ document, i18n, project }): { element: HTMLElement, dispose(): void }`.
- Invariant: rerendering locale disposes the previous wireframe preview before replacing it.

- [ ] **Step 1: Write a failing direct-project browser test**

Add a test that visits `/projects/${projects[0].slug}/`, asserts one `h1`, project year/kind/status/stack, an attached `[data-content-project-canvas]`, external `OPEN` and `SOURCE` anchors with `target="_blank"`, a `?open=projects` return link, and no desktop root.

- [ ] **Step 2: Run the project test and verify failure**

Run: `npx playwright test tests/e2e/content-pages.spec.js -g "project"`

Expected: FAIL because `content-page.js` has no project presentation.

- [ ] **Step 3: Implement project rendering with preview lifecycle**

`renderProjectPage` must render the existing project metadata and description with a single `h1`, create the canvas with `data-content-project-canvas`, start `createWireframePreview(canvas, project.geometry)`, and return a `dispose` method that disposes it. The shared page renderer stores the active disposer and calls it before every locale rerender and on `pagehide`.

- [ ] **Step 4: Add responsive project layout**

Extend `content-page.css` with a two-column project layout using `minmax(0, 1fr)` tracks, a stable square preview aspect ratio, unframed metadata/content regions, and a single-column layout below `760px`. Reuse existing palette variables and avoid nested cards.

- [ ] **Step 5: Run project and complete content-page tests**

Run: `npx playwright test tests/e2e/content-pages.spec.js && npm run test:unit`

Expected: direct article and project tests pass with zero page errors.

- [ ] **Step 6: Commit the project page**

```bash
git add scripts/pages/project-page.js scripts/pages/content-page.js styles/content-page.css tests/e2e/content-pages.spec.js
git commit -m "feat: add standalone project pages"
```

---

### Task 5: Navigate From And Return To The Desktop

**Files:**
- Modify: `scripts/apps/writing-app.js`
- Modify: `scripts/apps/projects-app.js`
- Modify: `scripts/main.js`
- Modify: `styles/apps.css`
- Modify: `tests/e2e/apps.spec.js`
- Modify: `tests/e2e/boot.spec.js`
- Modify: `tests/e2e/content-pages.spec.js`

**Interfaces:**
- Consumes: `contentPath`, `desktopPath`, and `readDesktopTarget` from Task 1.
- Invariant: Writing has archive state only; Projects has ring state only.
- Invariant: the pending `?open=` target is consumed once per homepage module lifetime but remains in the URL.

- [ ] **Step 1: Replace old in-window expectations with failing navigation tests**

Update `apps.spec.js` so Writing asserts each archive row is an anchor and clicking the first reaches its article pathname. Update Projects so clicking the front anchor reaches its project pathname. Remove assertions for maximized Writing readers and in-window project details.

Add to `boot.spec.js`:

```js
test('open query restores the requested desktop app and survives refresh', async ({ page }) => {
  await page.goto('/?skipBoot=1&open=writing');
  await expect(page.locator('[data-app-window="writing"]')).toBeVisible();
  await expect(page).toHaveURL(/open=writing/);
  await page.reload();
  await expect(page.locator('[data-app-window="writing"]')).toBeVisible();
});
```

Extend content-page tests so explicit return links reach the homepage and open the correct app.

- [ ] **Step 2: Run targeted browser tests and verify old behavior fails**

Run: `npx playwright test tests/e2e/apps.spec.js tests/e2e/boot.spec.js tests/e2e/content-pages.spec.js`

Expected: FAIL because desktop entries still mutate local detail state and `main.js` ignores `open`.

- [ ] **Step 3: Simplify Writing to real archive links**

Remove `openSlug`, reader rendering, host maximize/unmaximize calls, and reader click delegation from `writing-app.js`. Render each row as:

```js
const link = createElement(document, 'a', {
  href: contentPath('writing', entry.slug),
  'data-writing-open': entry.slug,
});
```

Keep locale subscription so archive titles rerender. Remove only reader-specific selectors from `apps.css`; their standalone replacements remain in `content-page.css`.

- [ ] **Step 4: Simplify Projects to navigable ring anchors**

Remove `mode`, `openSlug`, `detailView`, back handling, and in-window detail preview paths. Render ring cards as anchors with `href: contentPath('projects', project.slug)`. In the delegated click handler, call `preventDefault()` when dragging or when a side card must rotate; allow the front anchor's default same-tab navigation.

- [ ] **Step 5: Restore requested desktop apps after reveal**

In `main.js`, compute `let pendingOpen = readDesktopTarget(location.search)` once. At the end of `revealDesktop`, consume it once:

```js
const target = pendingOpen;
pendingOpen = null;
if (target) requestAnimationFrame(() => openApp(target));
```

Do not remove or rewrite the query. Ensure both normal boot completion and `skipBoot=1` use `revealDesktop` so the behavior is shared.

- [ ] **Step 6: Run desktop/content navigation tests**

Run: `npx playwright test tests/e2e/apps.spec.js tests/e2e/boot.spec.js tests/e2e/content-pages.spec.js`

Expected: all targeted tests pass; no old detail selectors remain in desktop windows.

- [ ] **Step 7: Commit desktop navigation**

```bash
git add scripts/apps/writing-app.js scripts/apps/projects-app.js scripts/main.js styles/apps.css tests/e2e/apps.spec.js tests/e2e/boot.spec.js tests/e2e/content-pages.spec.js
git commit -m "feat: navigate desktop content to shareable pages"
```

---

### Task 6: GitHub Pages, Accessibility, And Final Verification

**Files:**
- Modify: `tests/e2e/content-pages.spec.js`
- Create: `tests/static-server.mjs`
- Modify: `playwright.config.js`
- Modify: `package.json`
- Regenerate: `content-pages.manifest.json`, `writing/*/index.html`, `projects/*/index.html`

**Interfaces:**
- Consumes all previous task interfaces.
- Produces: `npm test` plus `npm run check:pages` as the completion gate.

- [ ] **Step 1: Add remaining failing browser coverage**

Cover these observable outcomes in `content-pages.spec.js`:

```js
await expect(page.locator('main')).toHaveCount(1);
await expect(page.locator('h1')).toHaveCount(1);
await expect(page.locator('[data-content-language]')).toHaveAccessibleName('Language');
await page.locator('[data-content-language]').selectOption('zh-CN');
await expect(page).toHaveURL(originalUrl);
await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
await page.locator('[data-content-next]').click();
await expect(page).toHaveURL(new RegExp(`/writing/${articles[1].slug}/$`));
```

Also assert direct reload, browser Back to the desktop, 390x844 and 200% zoom containment, reduced-motion project preview behavior, and a `/readME/`-prefixed fixture server path that resolves styles/modules and sibling navigation.

- [ ] **Step 2: Add freshness to the default test command**

Update `package.json`:

```json
"test": "npm run check:pages && npm run test:unit && npm run test:e2e"
```

Create `tests/static-server.mjs` as the Playwright web server. It must map both `/path` and `/readME/path` to the same repository file, resolve directory requests to `index.html`, reject decoded paths that escape the repository root, and return correct MIME types for HTML, JavaScript, CSS, JSON, WAV, JPEG, and PNG files. Change `playwright.config.js` to run:

```js
webServer: {
  command: 'node tests/static-server.mjs',
  port: 4173,
  reuseExistingServer: true,
},
```

The server listens on `127.0.0.1:4173` and strips exactly one leading `/readME/` before resolving the requested file. This makes `/readME/writing/<slug>/` exercise the same committed output GitHub Pages will serve.

- [ ] **Step 3: Run the generator and static checks**

Run: `npm run generate:pages && npm run check:pages && git diff --check`

Expected: generation succeeds, freshness succeeds, and diff check prints no errors.

- [ ] **Step 4: Run the complete automated suite**

Run: `npm test`

Expected: all unit and Playwright tests pass with zero failures.

- [ ] **Step 5: Perform visual and network verification**

Start or reuse the static server, then capture article and project pages at 1440x900, 390x844, and 200% browser zoom. Verify the page canvas is nonblank, the single `h1`, header controls, project preview, article prose, and previous/next controls do not overlap or overflow. Request one generated HTML, `styles/content-page.css`, `scripts/pages/content-page.js`, and an existing media asset and confirm HTTP 200 responses.

- [ ] **Step 6: Commit final coverage and generated output**

```bash
git add package.json playwright.config.js tests/static-server.mjs tests/e2e/content-pages.spec.js content-pages.manifest.json writing projects
git commit -m "test: verify shareable content routes"
```

- [ ] **Step 7: Audit the delivered history and working tree**

Run: `git log --oneline --max-count=8 && git status --short && git diff HEAD~6..HEAD --check`

Expected: route, generator, article, project, desktop navigation, and verification commits are present; no unrelated files are staged; diff check exits 0.
