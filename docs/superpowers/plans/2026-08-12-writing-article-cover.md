# Writing Article Cover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every writing entry open on a full-viewport generated editorial cover, with prose beginning only after the reader scrolls.

**Architecture:** Keep the current vanilla JavaScript writing renderer and derive all cover attributes from existing article data. Add two pure helpers for deterministic cover variation and localized title sizing, reshape the reader into stacked cover and article regions, and let CSS own the blue-and-white generated compositions. Extend existing Node and Playwright tests instead of adding dependencies.

**Tech Stack:** Browser DOM APIs, ES modules, CSS custom properties/gradients/pseudo-elements, Node test runner, Playwright.

## Global Constraints

- The first viewport contains only the cover; article prose begins at or below the writing content scrollport boundary.
- Cover visuals use only the existing `--blue`, `--white`, and color-mixed intermediate values.
- Do not add photography, externally hosted assets, canvas rendering, scroll hijacking, parallax, or new dependencies.
- Keep the writing archive list visually and behaviorally unchanged.
- A given article's cover variant must be deterministic across visits and locales.
- English, Simplified Chinese, and Japanese titles must fit without covering metadata or creating horizontal overflow.
- Reduced-motion mode must stop repeating motion and make entry transitions effectively static.

---

## File Structure

- Modify `scripts/apps/writing-app.js`: derive cover attributes, render the cover and article regions, and preserve navigation behavior.
- Create `tests/unit/writing-cover.test.js`: test the pure cover variant and title-tier contracts.
- Modify `styles/apps.css`: define the full-viewport cover, four generated compositions, article transition, responsive rules, focus states, and reduced-motion rules.
- Modify `tests/e2e/apps.spec.js`: assert reader structure, scroll boundary, navigation reset, and locale updates.
- Modify `tests/verify-writing-reader.mjs`: add geometry checks and capture desktop, mobile, and cover-to-body screenshots.

### Task 1: Deterministic Cover Attributes

**Files:**
- Create: `tests/unit/writing-cover.test.js`
- Modify: `scripts/apps/writing-app.js:1-35`

**Interfaces:**
- Consumes: `article.slug: string`, archive `index: number`, localized `title: string`.
- Produces: `getWritingCoverVariant(slug, index): "01" | "02" | "03" | "04"`.
- Produces: `getWritingTitleTier(title): "short" | "medium" | "long"`.

- [ ] **Step 1: Write the failing unit tests**

Create `tests/unit/writing-cover.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getWritingCoverVariant,
  getWritingTitleTier,
} from '../../scripts/apps/writing-app.js';

test('cover variants are deterministic and stay in the four-variant vocabulary', () => {
  const first = getWritingCoverVariant('flow-canvas-information-overload', 0);
  assert.equal(getWritingCoverVariant('flow-canvas-information-overload', 0), first);
  assert.match(first, /^0[1-4]$/);
  assert.match(getWritingCoverVariant('nonexistent-frequency', 1), /^0[1-4]$/);
});

test('title tiers use Unicode character counts and explicit thresholds', () => {
  assert.equal(getWritingTitleTier('Short title'), 'short');
  assert.equal(getWritingTitleTier('当信息开始替我思考这是一个更长的标题文本示例'), 'medium');
  assert.equal(getWritingTitleTier('When a localized article title becomes deliberately long enough to require the smallest display tier'), 'long');
});
```

- [ ] **Step 2: Run the unit test to verify it fails**

Run: `node --test tests/unit/writing-cover.test.js`

Expected: FAIL because `getWritingCoverVariant` and `getWritingTitleTier` are not exported.

- [ ] **Step 3: Implement the pure helpers**

Add near the top of `scripts/apps/writing-app.js`:

```js
export function getWritingCoverVariant(slug, index) {
  const hash = Array.from(slug).reduce((total, character) => (
    (total * 31 + character.codePointAt(0)) >>> 0
  ), 0);
  return padIndex((hash + index) % 4 + 1);
}

export function getWritingTitleTier(title) {
  const length = Array.from(title.trim()).length;
  if (length >= 48) return 'long';
  if (length >= 22) return 'medium';
  return 'short';
}
```

Keep both functions independent of browser globals so Node can import them directly.

- [ ] **Step 4: Run the focused and full unit suites**

Run: `node --test tests/unit/writing-cover.test.js`

Expected: 2 tests pass.

Run: `npm run test:unit`

Expected: all unit tests pass.

- [ ] **Step 5: Commit the helper contract**

```bash
git add scripts/apps/writing-app.js tests/unit/writing-cover.test.js
git commit -m "test: define writing cover attributes"
```

### Task 2: Cover And Article DOM Structure

**Files:**
- Modify: `tests/e2e/apps.spec.js:82-113`
- Modify: `scripts/apps/writing-app.js:42-158`

**Interfaces:**
- Consumes: `getWritingCoverVariant`, `getWritingTitleTier`, existing `estimateMinutes`, localized article data, and `host.maximize`/`host.unmaximize`.
- Produces: `[data-writing-cover]`, `[data-writing-cover-index]`, `[data-writing-title-tier]`, `[data-writing-cover-variant]`, `[data-writing-meta]`, `[data-writing-scroll-cue]`, and `[data-writing-article]` DOM hooks.
- Preserves: `[data-writing-reader] h3`, `[data-writing-position]`, `[data-writing-body]`, `[data-writing-back]`, and `[data-writing-goto]` contracts.

- [ ] **Step 1: Add failing reader-structure assertions**

Extend the existing writing test immediately after opening the first entry:

```js
const cover = appWindow.locator('[data-writing-cover]');
const article = appWindow.locator('[data-writing-article]');

await expect(cover).toHaveAttribute('data-writing-cover-variant', /^0[1-4]$/);
await expect(cover).toHaveAttribute('data-writing-title-tier', /^(short|medium|long)$/);
await expect(cover.locator('[data-writing-cover-index]')).toHaveText('01');
await expect(cover.locator('h3')).toHaveText('When Information Starts Thinking for Me');
await expect(cover.locator('[data-writing-meta]')).toContainText('{设计}');
await expect(cover.locator('[data-writing-scroll-cue]')).toHaveAttribute('aria-hidden', 'true');
await expect(article.locator('[data-writing-lead]')).toContainText('August of last year');
```

After clicking a next/previous article, assert that the writing content scroll container has reset:

```js
await expect.poll(() => appWindow.locator('[data-window-content]').evaluate((element) => element.scrollTop)).toBe(0);
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `npx playwright test tests/e2e/apps.spec.js -g "writing opens"`

Expected: FAIL because `[data-writing-cover]` and `[data-writing-article]` do not exist.

- [ ] **Step 3: Replace the masthead with cover markup**

In `renderReader`, set `root.dataset.writingView = 'reader'`, derive the localized title once, and build this structure with `createElement`:

```js
const title = pick(article.title, locale);
const variant = getWritingCoverVariant(article.slug, index);
const tier = getWritingTitleTier(title);
const cover = createElement(document, 'header', {
  'data-writing-cover': '',
  'data-writing-cover-variant': variant,
  'data-writing-title-tier': tier,
});
const toolbar = createElement(document, 'div', { 'data-writing-toolbar': '' });
toolbar.append(
  createElement(document, 'button', { type: 'button', 'data-writing-back': '' }, `← ${i18n.t('nav.back')}`),
  createElement(document, 'span', { 'data-writing-position': '' }, `${padIndex(index + 1)} / ${padIndex(articles.length)}`),
);
cover.append(
  toolbar,
  createElement(document, 'span', { 'data-writing-cover-index': '', 'aria-hidden': 'true' }, padIndex(index + 1)),
  createElement(document, 'h3', {}, title),
  createElement(document, 'p', { 'data-writing-meta': '' },
    `${article.date} / {${article.tag}} / ${i18n.t('writing.minutes').replace('{n}', String(minutes))}`),
  createElement(document, 'span', { 'data-writing-scroll-cue': '', 'aria-hidden': 'true' }),
);
```

Wrap the existing band, body container, closing band, and pagination in:

```js
const articleRegion = createElement(document, 'div', { 'data-writing-article': '' });
articleRegion.append(
  readingBand(document, i18n),
  bodyContainer,
  readingBand(document, i18n),
  pagination,
);
reader.append(cover, articleRegion);
```

In `renderList`, set `root.dataset.writingView = 'archive'`. Keep `mount.scrollTop = 0` in `render()` so opening, locale rerenders, and previous/next navigation all start on the cover.

- [ ] **Step 4: Run the focused Playwright test**

Run: `npx playwright test tests/e2e/apps.spec.js -g "writing opens"`

Expected: PASS for DOM structure and existing navigation behavior; visual boundary assertions are added in Task 3.

- [ ] **Step 5: Commit the reader structure**

```bash
git add scripts/apps/writing-app.js tests/e2e/apps.spec.js
git commit -m "feat: split writing reader into cover and article"
```

### Task 3: Full-Viewport Generated Cover Styling

**Files:**
- Modify: `tests/e2e/apps.spec.js:82-125`
- Modify: `styles/apps.css:354-551, 650-695`

**Interfaces:**
- Consumes: the Task 2 data hooks and the existing `--blue`, `--white`, `--mono`, `--serif`, motion-duration, and easing tokens.
- Produces: a cover whose rendered height is at least the writing scrollport height, four stable generated backgrounds, a protected metadata region, a constrained article column, and a single-column mobile poster.

- [ ] **Step 1: Add failing geometry and overflow assertions**

Add to the writing Playwright test after the cover exists:

```js
const geometry = await appWindow.evaluate((windowElement) => {
  const scrollport = windowElement.querySelector('[data-window-content]');
  const coverElement = windowElement.querySelector('[data-writing-cover]');
  const articleElement = windowElement.querySelector('[data-writing-article]');
  const titleElement = coverElement.querySelector('h3');
  const metaElement = coverElement.querySelector('[data-writing-meta]');
  const title = titleElement.getBoundingClientRect();
  const meta = metaElement.getBoundingClientRect();
  return {
    coverHeight: coverElement.getBoundingClientRect().height,
    scrollportHeight: scrollport.clientHeight,
    articleTop: articleElement.offsetTop,
    horizontalOverflow: scrollport.scrollWidth > scrollport.clientWidth,
    titleMetaOverlap: !(
      title.right <= meta.left || title.left >= meta.right ||
      title.bottom <= meta.top || title.top >= meta.bottom
    ),
  };
});
expect(geometry.coverHeight).toBeGreaterThanOrEqual(geometry.scrollportHeight - 1);
expect(geometry.articleTop).toBeGreaterThanOrEqual(geometry.scrollportHeight - 1);
expect(geometry.horizontalOverflow).toBe(false);
expect(geometry.titleMetaOverlap).toBe(false);
```

- [ ] **Step 2: Run the focused test to verify the geometry fails**

Run: `npx playwright test tests/e2e/apps.spec.js -g "writing opens"`

Expected: FAIL because the unstyled cover does not fill the scrollport.

- [ ] **Step 3: Replace the reader CSS with stacked cover/article styling**

Implement these base contracts in `styles/apps.css`:

```css
[data-app-window='writing'] [data-window-content] { padding: 0; }

[data-writing-app] {
  font-family: var(--mono);
  min-height: 100%;
}

[data-writing-app][data-writing-view='archive'] {
  display: grid;
  gap: 16px;
  padding: 24px;
}

[data-writing-reader] { min-height: 100%; width: 100%; }

[data-writing-cover] {
  background: var(--blue);
  color: var(--white);
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(18rem, 30%);
  grid-template-rows: auto 1fr auto;
  isolation: isolate;
  min-height: 100%;
  overflow: hidden;
  padding: clamp(18px, 3vw, 48px);
  position: relative;
}

[data-writing-article] {
  margin: 0 auto;
  max-width: 68ch;
  padding: clamp(72px, 10vw, 136px) 24px 72px;
}
```

Make `[data-writing-cover]::before` and `::after` non-interactive generated layers and implement the four deterministic compositions with this vocabulary:

```css
[data-writing-cover]::before,
[data-writing-cover]::after {
  content: '';
  inset: 0;
  pointer-events: none;
  position: absolute;
  z-index: -1;
}

[data-writing-cover-variant='01'] {
  background:
    linear-gradient(90deg, transparent 0 68%, var(--white) 68% 69%, transparent 69%),
    repeating-linear-gradient(0deg, transparent 0 47px, color-mix(in srgb, var(--white) 20%, transparent) 47px 48px),
    var(--blue);
}

[data-writing-cover-variant='02'] {
  background:
    linear-gradient(135deg, var(--white) 0 18%, transparent 18% 100%),
    repeating-linear-gradient(90deg, transparent 0 79px, color-mix(in srgb, var(--white) 18%, transparent) 79px 80px),
    var(--blue);
}

[data-writing-cover-variant='03'] {
  background:
    linear-gradient(0deg, color-mix(in srgb, var(--blue) 88%, var(--white)) 0 34%, transparent 34%),
    repeating-linear-gradient(135deg, transparent 0 15px, color-mix(in srgb, var(--white) 13%, transparent) 15px 16px),
    var(--blue);
}

[data-writing-cover-variant='04'] {
  background:
    linear-gradient(90deg, transparent 0 24%, color-mix(in srgb, var(--white) 12%, transparent) 24% 49%, transparent 49%),
    repeating-linear-gradient(0deg, transparent 0 31px, color-mix(in srgb, var(--white) 16%, transparent) 31px 32px),
    var(--blue);
}

[data-writing-cover-variant='01']::after,
[data-writing-cover-variant='03']::after {
  border: 1px solid color-mix(in srgb, var(--white) 55%, transparent);
  inset: 18% 8% 12% 46%;
  transform: rotate(-6deg);
}

[data-writing-cover-variant='02']::after,
[data-writing-cover-variant='04']::after {
  background: color-mix(in srgb, var(--white) 10%, transparent);
  clip-path: polygon(58% 0, 100% 0, 100% 72%, 78% 72%, 78% 100%, 42% 100%, 42% 46%, 0 46%, 0 18%, 58% 18%);
  inset: 10% 5% 8% 38%;
}
```

Keep the title, toolbar, index, metadata, and scroll cue in the cover's local stacking context with `position: relative; z-index: 1`; do not add a global z-index value.

Use explicit title tiers rather than viewport-width type scaling:

```css
[data-writing-title-tier='short'] h3 { font-size: clamp(64px, 12vh, 132px); }
[data-writing-title-tier='medium'] h3 { font-size: clamp(52px, 9vh, 104px); }
[data-writing-title-tier='long'] h3 { font-size: clamp(42px, 7vh, 78px); }
```

The `clamp()` maximum changes with viewport height, not viewport width. Apply `overflow-wrap: anywhere`, normal letter spacing, tight but non-negative line height, and a `max-width` that protects the metadata grid track.

Place the cover content with explicit grid coordinates and draw the cue without visible instructional copy:

```css
[data-writing-toolbar] { grid-column: 1 / -1; grid-row: 1; }
[data-writing-cover-index] {
  font-family: var(--mono);
  font-size: clamp(180px, 42vh, 440px);
  font-weight: 700;
  line-height: 0.75;
  opacity: 0.12;
  position: absolute;
  right: -0.05em;
  top: 0.2em;
}
[data-writing-cover] h3 {
  align-self: end;
  grid-column: 1;
  grid-row: 2 / 4;
  margin: 0;
  max-width: 12ch;
}
[data-writing-meta] {
  align-self: end;
  grid-column: 2;
  grid-row: 3;
  justify-self: end;
  max-width: 28ch;
  text-align: right;
}
[data-writing-scroll-cue] {
  border: 1px solid currentColor;
  border-radius: 999px;
  bottom: 24px;
  height: 44px;
  left: 50%;
  position: absolute;
  width: 20px;
}
[data-writing-scroll-cue]::after {
  animation: writing-scroll-cue 1.8s var(--ease-out) infinite;
  background: currentColor;
  content: '';
  height: 8px;
  left: 50%;
  position: absolute;
  top: 7px;
  transform: translateX(-50%);
  width: 1px;
}
[data-writing-back] {
  background: transparent;
  border: 1px solid currentColor;
  box-shadow: none;
  color: inherit;
}
@keyframes writing-scroll-cue {
  0%, 100% { opacity: 0.35; transform: translate(-50%, 0); }
  50% { opacity: 1; transform: translate(-50%, 14px); }
}
```

- [ ] **Step 4: Add mobile and reduced-motion rules**

Within the existing `@media (max-width: 760px)` block, use one column and stable vertical zones:

```css
[data-writing-cover] {
  grid-template-columns: 1fr;
  grid-template-rows: auto minmax(0, 1fr) auto auto;
  min-height: 100%;
  padding: 18px;
}

[data-writing-cover] h3 { align-self: end; max-width: 100%; }
[data-writing-meta] { justify-self: start; margin-top: 18px; max-width: 100%; }
[data-writing-article] { padding: 64px 18px 48px; }
```

Use smaller explicit tier values in this breakpoint and ensure metadata wraps rather than truncates. In `@media (prefers-reduced-motion: reduce)`, remove the scroll-cue animation and set cover-entry transition durations to `1ms`.

- [ ] **Step 5: Run focused desktop and mobile checks**

Run: `npx playwright test tests/e2e/apps.spec.js -g "writing opens" --project=chromium`

Expected: desktop geometry and navigation pass.

Run the same page with Playwright's existing mobile viewport through the verification script after Task 4; no horizontal overflow or title/metadata overlap is allowed.

- [ ] **Step 6: Commit the cover visual system**

```bash
git add styles/apps.css tests/e2e/apps.spec.js
git commit -m "feat: add generated editorial article covers"
```

### Task 4: Cross-Locale Visual Verification

**Files:**
- Modify: `tests/verify-writing-reader.mjs:1-125`
- Modify: `tests/e2e/apps.spec.js:82-130`

**Interfaces:**
- Consumes: the cover DOM and CSS contracts from Tasks 2 and 3.
- Produces: repeatable screenshots and geometry reports for English desktop, Chinese desktop, Japanese structure, narrow mobile, cover-to-body transition, and reduced motion.

- [ ] **Step 1: Extend the verification helper**

Add a reusable geometry evaluator:

```js
async function coverGeometry(window_) {
  return window_.evaluate((windowElement) => {
    const scrollport = windowElement.querySelector('[data-window-content]');
    const cover = windowElement.querySelector('[data-writing-cover]');
    const article = windowElement.querySelector('[data-writing-article]');
    const title = cover.querySelector('h3').getBoundingClientRect();
    const meta = cover.querySelector('[data-writing-meta]').getBoundingClientRect();
    return {
      bodyBelowFold: article.offsetTop >= scrollport.clientHeight - 1,
      noHorizontalOverflow: scrollport.scrollWidth <= scrollport.clientWidth,
      noTitleMetaOverlap: title.bottom <= meta.top || title.right <= meta.left,
    };
  });
}
```

Check all three booleans for English and Chinese. Keep existing content, section, link, and locale assertions.

- [ ] **Step 2: Update screenshot states**

Save these captures under `screenshots/`:

- `writing-reader-cover-en.png` at scroll position zero.
- `writing-reader-cover-zh.png` at scroll position zero.
- `writing-reader-cover-mobile.png` in a `390x844` context.
- `writing-reader-transition.png` after scrolling `[data-writing-article]` into view.
- Existing section and reference screenshots after their targets are scrolled into view.

Use `page.emulateMedia({ reducedMotion: 'reduce' })` for one pass and assert the scroll cue has `animation-name: none`.

- [ ] **Step 3: Run the structured visual verifier**

Start the existing static server used by Playwright if it is not already running, then run:

```bash
node tests/verify-writing-reader.mjs
```

Expected: every printed check passes and all five cover-related screenshots are nonblank.

- [ ] **Step 4: Run the full regression suite**

Run: `npm test`

Expected: all unit and Playwright tests pass with no article, archive, locale, window-state, or navigation regressions.

- [ ] **Step 5: Inspect final screenshots**

Open the English desktop, Chinese desktop, and mobile cover captures. Confirm that the title is the dominant object, the generated patterns remain secondary, the lower-right metadata is readable, the first viewport contains no prose, and the article transition has intentional whitespace.

- [ ] **Step 6: Commit verification coverage**

```bash
git add tests/verify-writing-reader.mjs tests/e2e/apps.spec.js
git commit -m "test: verify article cover layouts"
```
