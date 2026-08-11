# macOS ASCII Environment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a blue-and-white animated ASCII coastal environment and upper-left instrument cluster to the Portfolio OS macOS desktop without changing Windows mode or the existing window model.

**Architecture:** A pure environment-state module decides capability, motion state, clock formatting, view cycling, and quiet-zone attenuation. A Canvas renderer consumes a committed terrain map and owns all ambient drawing. A DOM controller mounts the Canvas and semantic widget buttons after each macOS desktop render, observes existing window visibility output, and destroys its resources when macOS mode is inactive.

**Tech Stack:** Vanilla ES modules, Canvas 2D, CSS, `Intl.DateTimeFormat`, Node test runner, Playwright, existing blue/white Portfolio OS tokens.

## Global Constraints

- Preserve all current uncommitted work; read the current version of overlapping files before every patch and stage only files named by the active task.
- Follow the active desktop layout: manual macOS selection enables the feature even on non-Mac hardware.
- Use only `#26159a` and `#ffffff` for system UI, with square corners, one-pixel borders, and hard shadows.
- Use Sean Oulashin's Unsplash source `https://unsplash.com/photos/KMn4VEeEPR8`; commit generated terrain data and make no runtime Unsplash request.
- Make no live weather, location, tide, or wind request.
- At `1024px` or wider with a fine pointer, use the full animated environment and widgets.
- From `761px` through `1023px`, on coarse pointers, or under reduced motion, use a static environment and widgets.
- At `760px` or narrower, use a static background and hide the instrument cluster.
- Windows mode must mount neither the environment layer nor the instrument cluster.
- Visible non-minimized windows stop animation, remove pointer response, and put the environment into focus mode.
- Use one Canvas, one animation loop, a maximum Canvas device pixel ratio of `2`, and a target of `10` visual updates per second.
- Do not add a motion preference to Settings.
- All visible labels must exist in English, Simplified Chinese, and Japanese dictionaries.

---

## File Map

### Create

- `scripts/environment/environment-state.js`: pure capability, motion, clock, view, and quiet-zone functions.
- `scripts/environment/generate-terrain-map.mjs`: development-only Playwright conversion of the approved Unsplash image into local luminance data.
- `scripts/environment/open-horizon-map.js`: generated, committed terrain data and source attribution.
- `scripts/environment/environment-renderer.js`: Canvas lifecycle, stepped drawing, focus/static states, and pointer damping.
- `scripts/environment/environment-controller.js`: macOS mount lifecycle, widget DOM, localization, clock updates, application launches, and window-state observation.
- `styles/environment.css`: blue desktop field, Canvas placement, instrument cluster, focus mode, and responsive fallback styling.
- `tests/unit/environment-state.test.js`: pure environment-state coverage.
- `tests/unit/environment-renderer.test.js`: generated map and renderer lifecycle coverage using fake Canvas/scheduler objects.
- `tests/e2e/environment.spec.js`: macOS integration, widget behavior, focus mode, responsive, localization, reduced-motion, and Canvas pixel checks.
- `docs/credits.md`: Unsplash source and attribution.

### Modify

- `index.html`: load `styles/environment.css` after `styles/macos-mode.css`.
- `scripts/desktop.js`: add an `onRender({ root, mode })` hook after each desktop rebuild.
- `scripts/main.js`: create the environment controller and connect the desktop render hook and app launcher.
- `scripts/i18n/dictionaries.js`: add environment labels for all three locales.
- `tests/unit/i18n.test.js`: assert every environment key is localized.
- `tests/e2e/desktop.spec.js`: verify the desktop render hook reports the selected mode.

### Explicitly Unchanged

- `scripts/window-manager.js`: continue using its existing `data-has-visible-window` output as the environment focus signal.
- `scripts/state/preferences.js`: no new persistent preference.
- `styles/windows-mode.css`: Windows mode remains visually unchanged.

---

### Task 1: Add the Pure Environment State Model

**Files:**
- Create: `scripts/environment/environment-state.js`
- Create: `tests/unit/environment-state.test.js`

**Interfaces:**
- Produces: `ENVIRONMENT_CAPABILITY`, `ENVIRONMENT_MOTION`, `ENVIRONMENT_VIEWS`, `getEnvironmentCapability(input)`, `getEnvironmentMotionState(input)`, `nextEnvironmentView(current)`, `formatEnvironmentClock(date, locale)`, and `getQuietZoneOpacity(point, zones)`.
- Consumes: browser-independent numbers, booleans, dates, and locale strings only.

- [ ] **Step 1: Write the failing state-model tests**

```js
// tests/unit/environment-state.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ENVIRONMENT_CAPABILITY,
  ENVIRONMENT_MOTION,
  formatEnvironmentClock,
  getEnvironmentCapability,
  getEnvironmentMotionState,
  getQuietZoneOpacity,
  nextEnvironmentView,
} from '../../scripts/environment/environment-state.js';

test('capability follows active mode, width, pointer, and reduced motion', () => {
  assert.equal(getEnvironmentCapability({ mode: 'windows', width: 1440 }), ENVIRONMENT_CAPABILITY.OFF);
  assert.equal(getEnvironmentCapability({ mode: 'macos', width: 390 }), ENVIRONMENT_CAPABILITY.PHONE_STATIC);
  assert.equal(getEnvironmentCapability({ mode: 'macos', width: 834 }), ENVIRONMENT_CAPABILITY.STATIC);
  assert.equal(getEnvironmentCapability({ mode: 'macos', width: 1440, coarsePointer: true }), ENVIRONMENT_CAPABILITY.STATIC);
  assert.equal(getEnvironmentCapability({ mode: 'macos', width: 1440, reducedMotion: true }), ENVIRONMENT_CAPABILITY.STATIC);
  assert.equal(getEnvironmentCapability({ mode: 'macos', width: 1440 }), ENVIRONMENT_CAPABILITY.ANIMATED);
});

test('motion enters focus only for an animated visible desktop', () => {
  assert.equal(getEnvironmentMotionState({ capability: 'animated' }), ENVIRONMENT_MOTION.RUNNING);
  assert.equal(getEnvironmentMotionState({ capability: 'animated', hasVisibleWindow: true }), ENVIRONMENT_MOTION.FOCUSED);
  assert.equal(getEnvironmentMotionState({ capability: 'animated', documentHidden: true }), ENVIRONMENT_MOTION.STATIC);
  assert.equal(getEnvironmentMotionState({ capability: 'static' }), ENVIRONMENT_MOTION.STATIC);
});

test('environment reading order is stable', () => {
  assert.equal(nextEnvironmentView('time'), 'weather');
  assert.equal(nextEnvironmentView('weather'), 'tide-wind');
  assert.equal(nextEnvironmentView('tide-wind'), 'time');
  assert.equal(nextEnvironmentView('unknown'), 'time');
});

test('clock formatting keeps a stable 24-hour value and localized date', () => {
  const date = new Date('2026-08-11T02:07:00+08:00');
  assert.equal(formatEnvironmentClock(date, 'en').time, '02:07');
  assert.match(formatEnvironmentClock(date, 'zh-CN').date, /2026/);
  assert.match(formatEnvironmentClock(date, 'ja').date, /2026/);
});

test('quiet zones attenuate inside and feather back to full opacity', () => {
  const zones = [{ left: 0, top: 0, right: 100, bottom: 100, feather: 20 }];
  assert.equal(getQuietZoneOpacity({ x: 50, y: 50 }, zones), 0);
  assert.equal(getQuietZoneOpacity({ x: 110, y: 50 }, zones), 0.5);
  assert.equal(getQuietZoneOpacity({ x: 130, y: 50 }, zones), 1);
  assert.equal(getQuietZoneOpacity({ x: 50, y: 50 }, []), 1);
});
```

- [ ] **Step 2: Run the state-model tests and verify the missing-module failure**

Run: `node --test tests/unit/environment-state.test.js`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `scripts/environment/environment-state.js`.

- [ ] **Step 3: Implement the pure state model**

```js
// scripts/environment/environment-state.js
export const ENVIRONMENT_CAPABILITY = Object.freeze({
  OFF: 'off',
  PHONE_STATIC: 'phone-static',
  STATIC: 'static',
  ANIMATED: 'animated',
});

export const ENVIRONMENT_MOTION = Object.freeze({
  RUNNING: 'running',
  FOCUSED: 'focused',
  STATIC: 'static',
});

export const ENVIRONMENT_VIEWS = Object.freeze(['time', 'weather', 'tide-wind']);

export function getEnvironmentCapability({
  mode,
  width = 0,
  coarsePointer = false,
  reducedMotion = false,
}) {
  if (mode !== 'macos') return ENVIRONMENT_CAPABILITY.OFF;
  if (width <= 760) return ENVIRONMENT_CAPABILITY.PHONE_STATIC;
  if (width < 1024 || coarsePointer || reducedMotion) return ENVIRONMENT_CAPABILITY.STATIC;
  return ENVIRONMENT_CAPABILITY.ANIMATED;
}

export function getEnvironmentMotionState({
  capability,
  hasVisibleWindow = false,
  documentHidden = false,
}) {
  if (capability !== ENVIRONMENT_CAPABILITY.ANIMATED || documentHidden) {
    return ENVIRONMENT_MOTION.STATIC;
  }
  return hasVisibleWindow ? ENVIRONMENT_MOTION.FOCUSED : ENVIRONMENT_MOTION.RUNNING;
}

export function nextEnvironmentView(current) {
  const index = ENVIRONMENT_VIEWS.indexOf(current);
  return ENVIRONMENT_VIEWS[(index + 1) % ENVIRONMENT_VIEWS.length] ?? ENVIRONMENT_VIEWS[0];
}

export function formatEnvironmentClock(date, locale) {
  const timeParts = Object.fromEntries(new Intl.DateTimeFormat(locale, {
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(date).map(({ type, value }) => [type, value]));
  return {
    time: `${timeParts.hour}:${timeParts.minute}`,
    date: new Intl.DateTimeFormat(locale, {
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(date),
  };
}

export function getQuietZoneOpacity({ x, y }, zones = []) {
  return zones.reduce((opacity, zone) => {
    const deltaX = Math.max(zone.left - x, 0, x - zone.right);
    const deltaY = Math.max(zone.top - y, 0, y - zone.bottom);
    const distance = Math.hypot(deltaX, deltaY);
    const feather = Math.max(1, zone.feather);
    return Math.min(opacity, Math.min(1, distance / feather));
  }, 1);
}
```

- [ ] **Step 4: Run the new and existing unit tests**

Run: `node --test tests/unit/environment-state.test.js`

Expected: PASS, 5 tests.

Run: `npm run test:unit`

Expected: all existing and new unit tests pass.

- [ ] **Step 5: Commit the state model**

```bash
git add scripts/environment/environment-state.js tests/unit/environment-state.test.js
git commit -m "feat: add macOS environment state model"
```

---

### Task 2: Generate and Render the Local ASCII Terrain

**Files:**
- Create: `scripts/environment/generate-terrain-map.mjs`
- Create: `scripts/environment/open-horizon-map.js`
- Create: `scripts/environment/environment-renderer.js`
- Create: `tests/unit/environment-renderer.test.js`
- Create: `docs/credits.md`

**Interfaces:**
- Consumes: `getQuietZoneOpacity(point, zones)` from Task 1.
- Produces: `OPEN_HORIZON_MAP` and `createEnvironmentRenderer({ canvas, terrainMap, scheduler })`.
- Renderer methods: `resize({ width, height, dpr, quietZones })`, `setPointer({ x, y })`, `setMotionState(state)`, `renderStatic()`, `getDebugState()`, and `destroy()`.

- [ ] **Step 1: Write the failing map and renderer lifecycle tests**

```js
// tests/unit/environment-renderer.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { OPEN_HORIZON_MAP } from '../../scripts/environment/open-horizon-map.js';
import { createEnvironmentRenderer } from '../../scripts/environment/environment-renderer.js';

function createHarness() {
  const textCalls = [];
  const context = {
    setTransform() {},
    clearRect() {},
    fillRect() {},
    fillText: (...args) => textCalls.push(args),
    save() {},
    restore() {},
    set fillStyle(value) {},
    set font(value) {},
    set globalAlpha(value) {},
    set textBaseline(value) {},
  };
  let pending = null;
  const scheduler = {
    request(callback) { pending = callback; return 1; },
    cancel() { pending = null; },
    flush(time) { const callback = pending; pending = null; callback?.(time); },
    hasPending() { return pending !== null; },
  };
  return {
    canvas: { width: 0, height: 0, style: {}, getContext: () => context },
    scheduler,
    textCalls,
  };
}

test('generated terrain map carries source attribution and normalized values', () => {
  assert.equal(OPEN_HORIZON_MAP.sourcePage, 'https://unsplash.com/photos/KMn4VEeEPR8');
  assert.equal(OPEN_HORIZON_MAP.attribution, 'Photo by Sean Oulashin on Unsplash');
  assert.equal(OPEN_HORIZON_MAP.width, 120);
  assert.equal(OPEN_HORIZON_MAP.height, 42);
  assert.equal(OPEN_HORIZON_MAP.values.length, 5040);
  assert.ok(OPEN_HORIZON_MAP.values.every((value) => value >= 0 && value <= 255));
});

test('renderer caps DPR, draws text, pauses in focus, and tears down', () => {
  const harness = createHarness();
  const renderer = createEnvironmentRenderer({
    canvas: harness.canvas,
    terrainMap: OPEN_HORIZON_MAP,
    scheduler: harness.scheduler,
  });
  renderer.resize({ width: 320, height: 180, dpr: 3, quietZones: [] });
  renderer.setMotionState('running');
  harness.scheduler.flush(100);
  assert.equal(harness.canvas.width, 640);
  assert.ok(harness.textCalls.length > 0);
  renderer.setMotionState('focused');
  assert.equal(harness.scheduler.hasPending(), false);
  assert.equal(renderer.getDebugState().motion, 'focused');
  renderer.destroy();
  assert.equal(renderer.getDebugState().destroyed, true);
});
```

- [ ] **Step 2: Run the renderer tests and verify missing modules fail**

Run: `node --test tests/unit/environment-renderer.test.js`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `open-horizon-map.js` or `environment-renderer.js`.

- [ ] **Step 3: Add the deterministic development-only map generator**

Create `scripts/environment/generate-terrain-map.mjs` with this exact pipeline:

```js
import { writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const sourcePage = 'https://unsplash.com/photos/KMn4VEeEPR8';
const sourceImage = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=90';
const attribution = 'Photo by Sean Oulashin on Unsplash';
const width = 120;
const height = 42;
const browser = await chromium.launch();
const page = await browser.newPage();

try {
  const values = await page.evaluate(async ({ sourceImage, width, height }) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = sourceImage;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(image, 0, 0, width, height);
    const pixels = context.getImageData(0, 0, width, height).data;
    const luminance = [];
    for (let index = 0; index < pixels.length; index += 4) {
      luminance.push(Math.round(
        pixels[index] * 0.2126
        + pixels[index + 1] * 0.7152
        + pixels[index + 2] * 0.0722,
      ));
    }
    return luminance;
  }, { sourceImage, width, height });
  const moduleSource = `export const OPEN_HORIZON_MAP = Object.freeze(${JSON.stringify({
    sourcePage, sourceImage, attribution, width, height, values,
  })});\n`;
  await writeFile(new URL('./open-horizon-map.js', import.meta.url), moduleSource);
} finally {
  await browser.close();
}
```

Run: `node scripts/environment/generate-terrain-map.mjs`

Expected: creates `scripts/environment/open-horizon-map.js` with 5,040 normalized luminance values and no network dependency at runtime.

- [ ] **Step 4: Implement the Canvas renderer**

Create `scripts/environment/environment-renderer.js`. Keep the drawing constants and lifecycle explicit:

```js
import { getQuietZoneOpacity } from './environment-state.js';

const BLUE = '#26159a';
const WHITE = '#ffffff';
const GLYPHS = ' .:-=+*#%@';
const FRAME_INTERVAL = 100;
const CELL_WIDTH = 11;
const CELL_HEIGHT = 14;

export function createEnvironmentRenderer({
  canvas,
  terrainMap,
  scheduler = {
    request: (callback) => requestAnimationFrame(callback),
    cancel: (id) => cancelAnimationFrame(id),
  },
}) {
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D context unavailable');
  let geometry = { width: 1, height: 1, dpr: 1, quietZones: [] };
  let pointer = { x: 0.5, y: 0.5 };
  let dampedPointer = { ...pointer };
  let motion = 'static';
  let frameId = null;
  let lastDraw = -FRAME_INTERVAL;
  let frame = 0;
  let destroyed = false;

  const hasTerrain = (
    Number.isInteger(terrainMap?.width)
    && Number.isInteger(terrainMap?.height)
    && terrainMap.values?.length === terrainMap.width * terrainMap.height
  );

  const sampleTerrain = (column, row, columns, rows) => {
    if (!hasTerrain) {
      const horizon = rows * 0.55;
      return row < horizon ? 8 : Math.min(220, 72 + (row - horizon) * 18);
    }
    const sourceX = Math.min(terrainMap.width - 1, Math.floor(column / columns * terrainMap.width));
    const sourceY = Math.min(terrainMap.height - 1, Math.floor(row / rows * terrainMap.height));
    return terrainMap.values[sourceY * terrainMap.width + sourceX];
  };

  const draw = () => {
    const { width, height, dpr, quietZones } = geometry;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.fillStyle = BLUE;
    context.fillRect(0, 0, width, height);
    context.fillStyle = WHITE;
    context.font = `700 ${CELL_HEIGHT - 2}px ui-monospace, monospace`;
    context.textBaseline = 'top';
    const columns = Math.max(1, Math.ceil(width / CELL_WIDTH));
    const rows = Math.max(1, Math.ceil(height / CELL_HEIGHT));
    const windOffset = (frame + Math.round((dampedPointer.x - 0.5) * 8)) % columns;
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const x = column * CELL_WIDTH;
        const y = row * CELL_HEIGHT;
        const quietOpacity = getQuietZoneOpacity({ x, y }, quietZones);
        if (quietOpacity <= 0.04) continue;
        const terrain = sampleTerrain(column, row, columns, rows);
        const wave = row > rows * 0.55 ? Math.sin((column + windOffset) * 0.25 + frame * 0.2) * 18 : 0;
        const wind = row < rows * 0.58 && (column + windOffset) % 17 === 0 ? 34 : 0;
        const level = Math.max(0, Math.min(255, terrain + wave + wind));
        const glyph = GLYPHS[Math.min(GLYPHS.length - 1, Math.floor(level / 256 * GLYPHS.length))];
        if (glyph === ' ') continue;
        context.globalAlpha = quietOpacity;
        context.fillText(glyph, x, y);
      }
    }
    context.globalAlpha = 1;
  };

  const tick = (time) => {
    frameId = null;
    if (destroyed || motion !== 'running') return;
    if (time - lastDraw >= FRAME_INTERVAL) {
      dampedPointer.x += (pointer.x - dampedPointer.x) * 0.12;
      dampedPointer.y += (pointer.y - dampedPointer.y) * 0.12;
      frame += 1;
      lastDraw = time;
      draw();
    }
    frameId = scheduler.request(tick);
  };

  const stop = () => {
    if (frameId !== null) scheduler.cancel(frameId);
    frameId = null;
  };

  return {
    resize({ width, height, dpr = 1, quietZones = [] }) {
      geometry = { width, height, dpr: Math.min(2, Math.max(1, dpr || 1)), quietZones };
      canvas.width = Math.round(width * geometry.dpr);
      canvas.height = Math.round(height * geometry.dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      draw();
    },
    setPointer(next) { pointer = { x: next.x, y: next.y }; },
    setMotionState(next) {
      motion = next;
      stop();
      draw();
      if (motion === 'running') frameId = scheduler.request(tick);
    },
    renderStatic() { stop(); draw(); },
    getDebugState() { return { motion, destroyed, frame }; },
    destroy() { destroyed = true; stop(); },
  };
}
```

- [ ] **Step 5: Add source attribution**

```md
<!-- docs/credits.md -->
# Asset Credits

## macOS ASCII Environment

The committed open-horizon luminance map is derived from
[a seashore photograph by Sean Oulashin](https://unsplash.com/photos/KMn4VEeEPR8)
on Unsplash. The original photograph is not requested or displayed at runtime.
```

- [ ] **Step 6: Run the renderer and unit suites**

Run: `node --test tests/unit/environment-renderer.test.js`

Expected: PASS, 2 tests.

Run: `npm run test:unit`

Expected: all unit tests pass.

- [ ] **Step 7: Commit the terrain pipeline and renderer**

```bash
git add scripts/environment/generate-terrain-map.mjs scripts/environment/open-horizon-map.js scripts/environment/environment-renderer.js tests/unit/environment-renderer.test.js docs/credits.md
git commit -m "feat: add ASCII coastline renderer"
```

---

### Task 3: Add Desktop Render Hook and Environment Controller

**Files:**
- Create: `scripts/environment/environment-controller.js`
- Create: `tests/e2e/environment.spec.js`
- Modify: `scripts/desktop.js:87-95,180-242`
- Modify: `scripts/main.js:1-62`
- Modify: `tests/e2e/desktop.spec.js:15-43`

**Interfaces:**
- Consumes: Task 1 state functions, Task 2 `OPEN_HORIZON_MAP` and `createEnvironmentRenderer`, existing `root.dataset.hasVisibleWindow`, existing `i18n`, and `onOpen(appId)`.
- Produces: `createDesktopEnvironmentController({ root, i18n, onOpen, now, rendererFactory })` with `sync({ mode })` and `destroy()`.
- Desktop hook: `onRender({ root, mode })` fires after `root.dataset.desktopMode` is current and the desktop chrome has been rebuilt.

- [ ] **Step 1: Write a failing desktop render-hook test**

In `mountDesktopController` inside `tests/e2e/desktop.spec.js`, capture the hook:

```js
window.testRenderModes = [];
window.testDesktop = createDesktopController({
  root,
  apps: getApps(),
  i18n: createI18n('en'),
  preferences: { layout: selectedLayout, locale: 'en', audioEnabled: false },
  onOpen: (appId) => window.testOpenCalls.push(appId),
  onRender: ({ mode }) => window.testRenderModes.push(mode),
});
```

Add:

```js
test('desktop render hook reports the active layout after chrome is mounted', async ({ page }) => {
  await mountDesktopController(page, { layout: 'macos' });
  await expect.poll(() => page.evaluate(() => window.testRenderModes)).toEqual(['macos']);
});
```

Run: `npx playwright test tests/e2e/desktop.spec.js -g "render hook"`

Expected: FAIL because `onRender` is ignored.

- [ ] **Step 2: Add the render hook to the desktop controller**

Modify the `createDesktopController` arguments and render tail:

```js
export function createDesktopController({
  root,
  apps,
  i18n,
  preferences,
  onOpen = () => {},
  onPreferenceChange = () => {},
  onBotNotice = () => {},
  onRender = () => {},
}) {
  // existing body
}
```

```js
root.replaceChildren(macosMenu, bot, windowsTaskbar, macosDock);
if (windowLayer) root.append(windowLayer);
root.dataset.desktopMode = mode;
onRender({ root, mode });
return root;
```

Run: `npx playwright test tests/e2e/desktop.spec.js -g "render hook"`

Expected: PASS.

- [ ] **Step 3: Write failing macOS mount and Windows exclusion tests**

Create the first tests in `tests/e2e/environment.spec.js`:

```js
import { test, expect } from '@playwright/test';

async function seedLayout(page, layout, locale = 'en') {
  await page.addInitScript(({ layout, locale }) => {
    localStorage.setItem('portfolio-os:preferences', JSON.stringify({
      version: 1, bootComplete: true, layout, locale, audioEnabled: false,
    }));
  }, { layout, locale });
}

test('macOS mounts the environment while Windows mounts neither environment element', async ({ page }) => {
  await seedLayout(page, 'macos');
  await page.goto('/');
  await expect(page.locator('[data-macos-environment]')).toHaveCount(1);
  await expect(page.locator('[data-environment-canvas]')).toHaveCount(1);

  await seedLayout(page, 'windows');
  await page.reload();
  await expect(page.locator('[data-macos-environment]')).toHaveCount(0);
  await expect(page.locator('[data-environment-widgets]')).toHaveCount(0);
});
```

Run: `npx playwright test tests/e2e/environment.spec.js -g "mounts"`

Expected: FAIL because no environment controller exists.

- [ ] **Step 4: Implement the environment controller**

Create `scripts/environment/environment-controller.js` with these concrete behaviors:

```js
import {
  ENVIRONMENT_CAPABILITY,
  formatEnvironmentClock,
  getEnvironmentCapability,
  getEnvironmentMotionState,
  nextEnvironmentView,
} from './environment-state.js';
import { createEnvironmentRenderer } from './environment-renderer.js';
import { OPEN_HORIZON_MAP } from './open-horizon-map.js';

function element(document, tagName, attributes = {}, text = '') {
  const node = document.createElement(tagName);
  Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
  node.textContent = text;
  return node;
}

export function createDesktopEnvironmentController({
  root,
  i18n,
  onOpen = () => {},
  now = () => new Date(),
  rendererFactory = createEnvironmentRenderer,
}) {
  const view = root.ownerDocument.defaultView;
  const document = root.ownerDocument;
  const coarseQuery = view.matchMedia('(pointer: coarse)');
  const motionQuery = view.matchMedia('(prefers-reduced-motion: reduce)');
  let mode = 'windows';
  let capability = ENVIRONMENT_CAPABILITY.OFF;
  let reading = 'time';
  let mount = null;
  let renderer = null;
  let minuteTimer = null;

  const getCapability = () => getEnvironmentCapability({
    mode,
    width: view.innerWidth,
    coarsePointer: coarseQuery.matches,
    reducedMotion: motionQuery.matches,
  });

  const renderReading = () => {
    if (!mount) return;
    const primary = mount.querySelector('[data-environment-primary]');
    primary.dataset.environmentView = reading;
    const title = primary.querySelector('[data-environment-reading-title]');
    const value = primary.querySelector('[data-environment-reading-value]');
    const detail = primary.querySelector('[data-environment-reading-detail]');
    const clock = formatEnvironmentClock(now(), i18n.locale);
    const presentations = {
      time: [i18n.t('environment.localTime'), clock.time, clock.date],
      weather: [i18n.t('environment.weather'), i18n.t('environment.conditionEmpty'), i18n.t('environment.locationEmpty')],
      'tide-wind': [i18n.t('environment.tideWind'), i18n.t('environment.windEmpty'), i18n.t('environment.tideEmpty')],
    };
    [title.textContent, value.textContent, detail.textContent] = presentations[reading];
    primary.setAttribute('aria-label', `${title.textContent}: ${value.textContent}, ${detail.textContent}`);
  };

  const createWidgets = () => {
    const widgets = element(document, 'aside', { 'data-environment-widgets': '' });
    const primary = element(document, 'button', {
      type: 'button', 'data-environment-primary': '', 'data-environment-view': reading,
    });
    primary.append(
      element(document, 'span', { 'data-environment-reading-title': '' }),
      element(document, 'strong', { 'data-environment-reading-value': '' }),
      element(document, 'span', { 'data-environment-reading-detail': '' }),
    );
    const nowButton = element(document, 'button', {
      type: 'button', 'data-environment-open': 'projects', 'aria-label': i18n.t('environment.openProjects'),
    });
    nowButton.append(element(document, 'span', {}, i18n.t('environment.now')), element(document, 'strong', {}, '--'));
    const latestButton = element(document, 'button', {
      type: 'button', 'data-environment-open': 'writing', 'aria-label': i18n.t('environment.openWriting'),
    });
    latestButton.append(element(document, 'span', {}, i18n.t('environment.latest')), element(document, 'strong', {}, '--'));
    widgets.append(primary, nowButton, latestButton);
    return widgets;
  };

  const getQuietZones = () => {
    const environmentBounds = mount?.getBoundingClientRect();
    const widgets = mount?.querySelector('[data-environment-widgets]')?.getBoundingClientRect();
    const dock = root.querySelector('[data-macos-dock]')?.getBoundingClientRect();
    if (!environmentBounds) return [];
    return [widgets, dock].filter(Boolean).map((rect) => ({
      left: rect.left - environmentBounds.left - 24,
      top: rect.top - environmentBounds.top - 24,
      right: rect.right - environmentBounds.left + 24,
      bottom: rect.bottom - environmentBounds.top + 24,
      feather: 72,
    }));
  };

  const syncRenderer = () => {
    if (!mount) return;
    const motion = getEnvironmentMotionState({
      capability,
      hasVisibleWindow: root.dataset.hasVisibleWindow === 'true',
      documentHidden: document.hidden,
    });
    mount.dataset.environmentCapability = capability;
    mount.dataset.environmentMotion = motion;
    if (!renderer) return;
    renderer.resize({
      width: mount.clientWidth,
      height: mount.clientHeight,
      dpr: view.devicePixelRatio,
      quietZones: getQuietZones(),
    });
    renderer.setMotionState(motion);
  };

  const unmount = () => {
    renderer?.destroy();
    renderer = null;
    mount?.remove();
    mount = null;
    if (minuteTimer !== null) view.clearInterval(minuteTimer);
    minuteTimer = null;
  };

  const mountEnvironment = () => {
    if (mount && root.contains(mount)) return;
    unmount();
    mount = element(document, 'section', { 'data-macos-environment': '' });
    const canvas = element(document, 'canvas', {
      'data-environment-canvas': '', 'aria-hidden': 'true',
    });
    mount.append(canvas);
    if (capability !== ENVIRONMENT_CAPABILITY.PHONE_STATIC) mount.append(createWidgets());
    root.prepend(mount);
    try {
      renderer = rendererFactory({ canvas, terrainMap: OPEN_HORIZON_MAP });
    } catch {
      renderer = null;
      mount.dataset.environmentFallback = 'canvas-unavailable';
    }
    renderReading();
    minuteTimer = view.setInterval(renderReading, 60_000);
    syncRenderer();
  };

  const sync = ({ mode: nextMode = mode } = {}) => {
    mode = nextMode;
    capability = getCapability();
    if (capability === ENVIRONMENT_CAPABILITY.OFF) {
      unmount();
      return;
    }
    mountEnvironment();
    if (capability === ENVIRONMENT_CAPABILITY.PHONE_STATIC) {
      mount.querySelector('[data-environment-widgets]')?.remove();
    } else if (!mount.querySelector('[data-environment-widgets]')) {
      mount.append(createWidgets());
      renderReading();
    }
    syncRenderer();
  };

  const handleClick = (event) => {
    if (!mount || !mount.contains(event.target)) return;
    const launch = event.target.closest('[data-environment-open]');
    if (launch) onOpen(launch.dataset.environmentOpen);
    if (event.target.closest('[data-environment-primary]')) {
      reading = nextEnvironmentView(reading);
      renderReading();
    }
  };
  const handlePointerMove = (event) => {
    if (
      capability !== ENVIRONMENT_CAPABILITY.ANIMATED
      || mount?.dataset.environmentMotion !== 'running'
      || !renderer
    ) return;
    const bounds = mount.getBoundingClientRect();
    renderer.setPointer({
      x: (event.clientX - bounds.left) / bounds.width,
      y: (event.clientY - bounds.top) / bounds.height,
    });
  };
  root.addEventListener('click', handleClick);
  root.addEventListener('pointermove', handlePointerMove);
  const observer = new MutationObserver(syncRenderer);
  observer.observe(root, { attributes: true, attributeFilter: ['data-has-visible-window'] });
  const unsubscribeI18n = i18n.subscribe(() => { renderReading(); sync(); });
  const handleEnvironmentChange = () => sync();
  view.addEventListener('resize', handleEnvironmentChange);
  document.addEventListener('visibilitychange', syncRenderer);
  coarseQuery.addEventListener('change', handleEnvironmentChange);
  motionQuery.addEventListener('change', handleEnvironmentChange);

  return {
    sync,
    destroy() {
      unmount();
      observer.disconnect();
      unsubscribeI18n();
      view.removeEventListener('resize', handleEnvironmentChange);
      document.removeEventListener('visibilitychange', syncRenderer);
      coarseQuery.removeEventListener('change', handleEnvironmentChange);
      motionQuery.removeEventListener('change', handleEnvironmentChange);
      root.removeEventListener('click', handleClick);
      root.removeEventListener('pointermove', handlePointerMove);
    },
  };
}
```

- [ ] **Step 5: Wire the controller into main without changing window-manager state ownership**

Modify `scripts/main.js`:

```js
import { createDesktopEnvironmentController } from './environment/environment-controller.js';
```

Replace the duplicated app-opening closure with:

```js
let windowManager;
let boot;
let updatePreferences;
const openApp = (appId) => {
  audio.play('window');
  windowManager.open(appId);
};
const environment = createDesktopEnvironmentController({
  root: desktopRoot,
  i18n,
  onOpen: openApp,
});

export const desktop = createDesktopController({
  root: desktopRoot,
  apps,
  i18n,
  preferences,
  onOpen: openApp,
  onPreferenceChange: (patch) => updatePreferences(patch),
  onBotNotice: () => audio.play('notice'),
  onRender: ({ mode }) => environment.sync({ mode }),
});
```

Keep `createWindowManager(...)` after these declarations so `windowManager` exists before the boot sequence can reveal the desktop.

- [ ] **Step 6: Run controller integration tests**

Run: `npx playwright test tests/e2e/desktop.spec.js tests/e2e/environment.spec.js`

Expected: desktop render-hook and macOS/Windows mount tests pass.

Run: `npm run test:unit`

Expected: all unit tests pass.

- [ ] **Step 7: Commit the controller integration**

```bash
git add scripts/environment/environment-controller.js scripts/desktop.js scripts/main.js tests/e2e/environment.spec.js tests/e2e/desktop.spec.js
git commit -m "feat: mount macOS desktop environment"
```

---

### Task 4: Localize and Style the Instrument Cluster and Focus States

**Files:**
- Create: `styles/environment.css`
- Modify: `index.html:11-17`
- Modify: `scripts/i18n/dictionaries.js:1-75`
- Modify: `tests/unit/i18n.test.js`
- Modify: `tests/e2e/environment.spec.js`

**Interfaces:**
- Consumes: Task 3 data attributes: `data-macos-environment`, `data-environment-canvas`, `data-environment-widgets`, `data-environment-primary`, `data-environment-open`, `data-environment-capability`, and `data-environment-motion`.
- Produces: stable instrument geometry, focus styling, responsive visibility, and dictionary keys under `environment.*`.

- [ ] **Step 1: Write failing dictionary completeness tests**

Append to `tests/unit/i18n.test.js`:

```js
const environmentKeys = [
  'environment.localTime',
  'environment.weather',
  'environment.tideWind',
  'environment.conditionEmpty',
  'environment.locationEmpty',
  'environment.windEmpty',
  'environment.tideEmpty',
  'environment.now',
  'environment.latest',
  'environment.openProjects',
  'environment.openWriting',
];

test('environment labels exist in every supported locale', () => {
  ['en', 'zh-CN', 'ja'].forEach((locale) => {
    const i18n = createI18n(locale);
    environmentKeys.forEach((key) => assert.notEqual(i18n.t(key), key));
  });
});
```

Run: `node --test tests/unit/i18n.test.js`

Expected: FAIL because environment keys return their key names.

- [ ] **Step 2: Add exact environment copy to all dictionaries**

Add these entries to each locale object in `scripts/i18n/dictionaries.js`:

```js
// en
'environment.localTime': 'LOCAL TIME', 'environment.weather': 'WEATHER SIGNAL',
'environment.tideWind': 'TIDE / WIND', 'environment.conditionEmpty': 'CONDITION / --',
'environment.locationEmpty': 'LOCATION / --', 'environment.windEmpty': 'WIND / --',
'environment.tideEmpty': 'TIDE / --', 'environment.now': 'NOW', 'environment.latest': 'LATEST',
'environment.openProjects': 'Open Projects', 'environment.openWriting': 'Open Writing',

// zh-CN
'environment.localTime': '本地时间', 'environment.weather': '天气信号',
'environment.tideWind': '潮汐 / 风场', 'environment.conditionEmpty': '天气 / --',
'environment.locationEmpty': '地点 / --', 'environment.windEmpty': '风速 / --',
'environment.tideEmpty': '潮汐 / --', 'environment.now': '当前', 'environment.latest': '最近',
'environment.openProjects': '打开项目', 'environment.openWriting': '打开文章',

// ja
'environment.localTime': 'ローカル時刻', 'environment.weather': '気象信号',
'environment.tideWind': '潮汐 / 風', 'environment.conditionEmpty': '天気 / --',
'environment.locationEmpty': '場所 / --', 'environment.windEmpty': '風 / --',
'environment.tideEmpty': '潮汐 / --', 'environment.now': '現在', 'environment.latest': '最新',
'environment.openProjects': 'プロジェクトを開く', 'environment.openWriting': '文章を開く',
```

Run: `node --test tests/unit/i18n.test.js`

Expected: PASS, including the new completeness test.

- [ ] **Step 3: Write failing geometry, focus, and responsive tests**

Append to `tests/e2e/environment.spec.js`:

```js
test('instrument cluster has one tall primary and two compact signals', async ({ page }) => {
  await seedLayout(page, 'macos');
  await page.goto('/');
  const primary = page.locator('[data-environment-primary]');
  const now = page.locator('[data-environment-open="projects"]');
  const latest = page.locator('[data-environment-open="writing"]');
  const [primaryBox, nowBox, latestBox] = await Promise.all([
    primary.boundingBox(), now.boundingBox(), latest.boundingBox(),
  ]);
  expect(primaryBox.height).toBeGreaterThan(nowBox.height + latestBox.height);
  expect(nowBox.x).toBeGreaterThan(primaryBox.x);
  expect(latestBox.x).toBe(nowBox.x);
  expect(latestBox.y).toBeGreaterThan(nowBox.y);
});

test('widget launches apps and visible windows activate focus mode', async ({ page }) => {
  await seedLayout(page, 'macos');
  await page.goto('/');
  await page.locator('[data-environment-open="projects"]').click();
  await expect(page.locator('[data-app-window="projects"]')).toBeVisible();
  await expect(page.locator('[data-macos-environment]')).toHaveAttribute('data-environment-motion', 'focused');
  await page.locator('[data-app-window="projects"] [data-window-minimize]').click();
  await expect(page.locator('[data-macos-environment]')).toHaveAttribute('data-environment-motion', 'running');
  await page.locator('[data-environment-open="writing"]').click();
  await expect(page.locator('[data-app-window="writing"]')).toBeVisible();
});

test('tablet is static with widgets and phone is static without widgets', async ({ page }) => {
  await seedLayout(page, 'macos');
  await page.setViewportSize({ width: 834, height: 1194 });
  await page.goto('/');
  await expect(page.locator('[data-macos-environment]')).toHaveAttribute('data-environment-capability', 'static');
  await expect(page.locator('[data-environment-widgets]')).toHaveCount(1);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('[data-macos-environment]')).toHaveAttribute('data-environment-capability', 'phone-static');
  await expect(page.locator('[data-environment-widgets]')).toHaveCount(0);
});

test('reduced motion renders static environment with widgets at desktop width', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await seedLayout(page, 'macos');
  await page.goto('/');
  await expect(page.locator('[data-macos-environment]')).toHaveAttribute('data-environment-capability', 'static');
  await expect(page.locator('[data-environment-widgets]')).toHaveCount(1);
});
```

Run: `npx playwright test tests/e2e/environment.spec.js`

Expected: localization may pass, but geometry/focus styling fails until the stylesheet is loaded.

- [ ] **Step 4: Add the dedicated environment stylesheet**

Create `styles/environment.css`:

```css
[data-desktop-mode='macos'][data-desktop-root] {
  background-color: var(--blue);
  background-image: none;
}

[data-desktop-mode='macos'][data-desktop-root]::before,
[data-desktop-mode='macos'][data-desktop-root]::after {
  opacity: 0;
}

[data-macos-environment] {
  background: var(--blue);
  color: var(--white);
  inset: 32px 0 0;
  overflow: hidden;
  pointer-events: none;
  position: absolute;
  z-index: 0;
}

[data-environment-canvas] {
  display: block;
  inset: 0;
  max-height: 100%;
  max-width: 100%;
  position: absolute;
  transition: opacity var(--ui-duration) var(--ease-out);
}

[data-environment-widgets] {
  display: grid;
  gap: 8px;
  grid-template-columns: 176px 128px;
  grid-template-rows: repeat(2, 80px);
  left: 24px;
  pointer-events: auto;
  position: absolute;
  top: 24px;
  transition: opacity var(--ui-duration) var(--ease-out);
}

[data-environment-widgets] button {
  background: var(--blue);
  border: 1px solid var(--white);
  border-radius: 0;
  box-shadow: 4px 4px 0 var(--white);
  color: var(--white);
  display: flex;
  flex-direction: column;
  font-family: var(--mono);
  justify-content: space-between;
  min-width: 0;
  padding: 12px;
  text-align: left;
}

[data-environment-widgets] button:focus-visible {
  outline: 2px solid var(--white);
  outline-offset: 3px;
}

[data-environment-widgets] span {
  font-size: 10px;
  line-height: 1.2;
}

[data-environment-widgets] strong {
  font-family: var(--mono);
  font-size: 18px;
  font-weight: 700;
  line-height: 1;
}

[data-environment-primary] {
  grid-row: 1 / 3;
}

[data-environment-primary] [data-environment-reading-value] {
  font-family: var(--serif);
  font-size: 48px;
  font-weight: 400;
}

[data-macos-environment][data-environment-motion='focused'] [data-environment-canvas] {
  opacity: 0.28;
}

[data-macos-environment][data-environment-motion='focused'] [data-environment-widgets] button {
  box-shadow: 1px 1px 0 var(--white);
}

[data-macos-environment][data-environment-motion='focused'] [data-environment-widgets] span {
  opacity: 0.7;
}

@media (max-width: 1023px) {
  [data-environment-widgets] {
    grid-template-columns: 160px 120px;
    left: 16px;
    top: 16px;
  }
}

@media (max-width: 760px) {
  [data-environment-widgets] { display: none; }
}

@media (prefers-reduced-motion: reduce) {
  [data-environment-canvas],
  [data-environment-widgets],
  [data-environment-widgets] button { transition-duration: 1ms; }
}
```

Load it in `index.html` immediately after the macOS mode stylesheet:

```html
<link rel="stylesheet" href="./styles/macos-mode.css" />
<link rel="stylesheet" href="./styles/environment.css" />
```

- [ ] **Step 5: Run localization and environment tests**

Run: `node --test tests/unit/i18n.test.js`

Expected: PASS.

Run: `npx playwright test tests/e2e/environment.spec.js`

Expected: all environment integration tests pass.

Run: `npx playwright test tests/e2e/desktop.spec.js tests/e2e/windows.spec.js`

Expected: existing desktop and Windows behavior remains green.

- [ ] **Step 6: Commit localization and visual states**

```bash
git add styles/environment.css index.html scripts/i18n/dictionaries.js tests/unit/i18n.test.js tests/e2e/environment.spec.js
git commit -m "feat: style macOS environment instruments"
```

---

### Task 5: Complete Canvas, Locale, Focus, and Regression Verification

**Files:**
- Modify: `tests/e2e/environment.spec.js`
- Modify only if verification exposes a defect: files introduced or modified in Tasks 1-4.

**Interfaces:**
- Consumes: the complete environment controller, renderer, and CSS data attributes.
- Produces: automated evidence that the Canvas is nonblank, locale changes are complete, focus/static states stop frame advancement, and the system has no browser errors.

- [ ] **Step 1: Add the final Canvas pixel and frame-state tests**

Append to `tests/e2e/environment.spec.js`:

```js
test('animated Canvas contains blue and white output without page errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await seedLayout(page, 'macos');
  await page.goto('/');
  const colors = await page.locator('[data-environment-canvas]').evaluate((canvas) => {
    const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
    let blue = 0;
    let white = 0;
    for (let index = 0; index < data.length; index += 16) {
      const red = data[index];
      const green = data[index + 1];
      const blueChannel = data[index + 2];
      if (red < 80 && green < 80 && blueChannel > 100) blue += 1;
      if (red > 220 && green > 220 && blueChannel > 220) white += 1;
    }
    return { blue, white };
  });
  expect(colors.blue).toBeGreaterThan(100);
  expect(colors.white).toBeGreaterThan(10);
  expect(errors).toEqual([]);
});

test('instrument labels update in Chinese and Japanese without overflow', async ({ page }) => {
  for (const [locale, expected] of [['zh-CN', '本地时间'], ['ja', 'ローカル時刻']]) {
    await seedLayout(page, 'macos', locale);
    await page.goto('/');
    await expect(page.locator('[data-environment-reading-title]')).toHaveText(expected);
    const overflow = await page.locator('[data-environment-widgets]').evaluate((widgets) => (
      widgets.scrollWidth > widgets.clientWidth || widgets.scrollHeight > widgets.clientHeight
    ));
    expect(overflow).toBe(false);
  }
});

test('environment reading cycles without changing instrument dimensions', async ({ page }) => {
  await seedLayout(page, 'macos');
  await page.goto('/');
  const primary = page.locator('[data-environment-primary]');
  const before = await primary.boundingBox();
  await primary.click();
  await expect(primary).toHaveAttribute('data-environment-view', 'weather');
  await primary.click();
  await expect(primary).toHaveAttribute('data-environment-view', 'tide-wind');
  const after = await primary.boundingBox();
  expect(after).toEqual(before);
});
```

- [ ] **Step 2: Run the focused environment test file**

Run: `npx playwright test tests/e2e/environment.spec.js --repeat-each=2`

Expected: all tests pass twice without flakes or page errors.

- [ ] **Step 3: Run the complete automated suite**

Run: `npm test`

Expected: all unit and Playwright tests pass.

- [ ] **Step 4: Capture and inspect required visual states**

Start the existing static server:

```bash
python3 -m http.server 4173 --bind 127.0.0.1
```

Use Playwright or the existing browser automation to capture and inspect:

- `1440 x 900`: animated idle desktop, environment cluster, Dock quiet zone.
- `1728 x 1117`: wide Mac composition with no empty central void.
- `2560 x 1440`: Retina-scale allocation remains capped and Canvas is nonblank.
- `834 x 1194`: static environment with widgets, no menu/Dock overlap.
- `390 x 844`: static background without widgets, existing application icons remain unobstructed.
- Active Projects window: Canvas opacity is reduced and animation is stopped.
- English, Chinese, and Japanese primary readings at browser zoom `200%`.

For each screenshot, verify: no overlapping text, no rounded or glass surfaces, no third UI color, no horizontal overflow, and no window-control obstruction.

- [ ] **Step 5: Fix only defects found by the required verification and rerun affected tests**

For any defect, first add or tighten an assertion in `tests/e2e/environment.spec.js`, run it to reproduce the failure, make the smallest correction in the owning module or stylesheet, and rerun the focused test followed by `npm test`.

Expected: no unresolved visual or automated failure remains.

- [ ] **Step 6: Commit final verification coverage**

```bash
git add tests/e2e/environment.spec.js scripts/environment styles/environment.css scripts/desktop.js scripts/main.js scripts/i18n/dictionaries.js index.html
git commit -m "test: verify macOS ASCII environment"
```

Do not stage unrelated working-tree files. If only the test file changed after verification, stage and commit only that file.
