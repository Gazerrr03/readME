import { test, expect } from '@playwright/test';

const DRAFT_KEY = 'portfolio-os:wallpaper-lab:v1';
const PREVIEW_KEY = 'portfolio-os:wallpaper-preview:v1';
const PREFERENCES_KEY = 'portfolio-os:preferences';

async function readDownload(download) {
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

test('author lab loads one Flow Shards preview with schema-driven plain-language controls', async ({ page }) => {
  await page.goto('/setting/?wallpaper=flow-shards');

  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,nofollow');
  const lab = page.locator('[data-wallpaper-lab]');
  await expect(lab).toHaveAttribute('data-wallpaper-id', 'flow-shards');
  await expect(page.locator('[data-wallpaper-name]')).toHaveText('Flow Shards');
  await expect(page.locator('[data-wallpaper-control]')).toHaveCount(12);
  await expect(page.locator('[data-wallpaper-control="density"] select')).toHaveAccessibleName('Shard density');
  await expect(page.locator('[data-wallpaper-control="speed"] input[type="range"]'))
    .toHaveAccessibleName('Motion speed');
  await expect(page.locator('[data-wallpaper-control="speed"]')).toContainText('How quickly the flow moves.');
  await expect(page.locator('[data-wallpaper-control="speed"]')).toContainText('Slow');
  await expect(page.locator('[data-wallpaper-control="speed"]')).toContainText('Fast');
  await expect(page.locator('[data-wallpaper-value="speed"]')).toHaveText('42');
  await expect(page.locator('[data-wallpaper-preview] [data-wallpaper-active="true"]')).toHaveCount(1, {
    timeout: 20_000,
  });
  await expect(page.locator('[data-wallpaper-preview] [data-wallpaper-surface]')).toHaveCount(1);
  await expect(page.locator('[data-wallpaper-status]')).toHaveAttribute('data-status', 'ready');
  await expect(page.locator('[data-wallpaper-apply-local]')).toBeEnabled();
});

test('schema labels and options follow the saved supported locale', async ({ page }) => {
  await page.addInitScript((preferencesKey) => {
    localStorage.setItem(preferencesKey, JSON.stringify({
      version: 1,
      locale: 'zh-CN',
      wallpaperId: 'blue-fluid-halftone',
    }));
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function localeFailureSetItem(key, value) {
      if (key === window.blockedWallpaperStorageKey) {
        throw new DOMException(`blocked ${key}`, 'SecurityError');
      }
      return originalSetItem.call(this, key, value);
    };
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async () => {} },
    });
  }, PREFERENCES_KEY);
  await page.goto('/setting/?wallpaper=flow-shards');

  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('[data-wallpaper-name]')).toHaveText('流动晶片');
  await expect(page.locator('[data-wallpaper-name]')).toHaveAttribute('lang', 'zh-CN');
  await expect(page.locator('[data-wallpaper-controls]')).toHaveAttribute('lang', 'zh-CN');
  await expect(page.locator('[data-wallpaper-control="density"] select')).toHaveAccessibleName('晶片数量');
  await expect(page.locator('[data-wallpaper-control="density"] option[value="medium"]')).toHaveText('中');
  await expect(page.locator('[data-wallpaper-value="density"]')).toHaveText('中');
  await expect(page.locator('[data-wallpaper-preset-status]')).toHaveText('参考');
  await expect(page.locator('[data-wallpaper-apply-local]')).toBeEnabled({ timeout: 20_000 });
  await page.locator('[data-wallpaper-preset="calm"]').click();
  await expect(page.locator('[data-wallpaper-preset-status]')).toHaveText('安静');
  await expect(page.locator('[data-wallpaper-action-status]')).toContainText('草稿');
  await page.locator('[data-wallpaper-reset]').click();
  await expect(page.locator('[data-wallpaper-action-status]')).toContainText('本地主页未更改');
  await page.locator('[data-wallpaper-copy]').click();
  await expect(page.locator('[data-wallpaper-action-status]')).toHaveText('配置已复制。');
  const downloadPromise = page.waitForEvent('download');
  await page.locator('[data-wallpaper-download]').click();
  await downloadPromise;
  await expect(page.locator('[data-wallpaper-action-status]')).toHaveText('配置已下载。');
  await page.evaluate((preferencesKey) => { window.blockedWallpaperStorageKey = preferencesKey; }, PREFERENCES_KEY);
  await page.locator('[data-wallpaper-apply-local]').click();
  await expect(page.locator('[data-wallpaper-action-status]')).toContainText('未应用');
});

test('missing and unknown wallpaper queries fall back visibly to Flow Shards', async ({ page }) => {
  await page.goto('/setting/');
  await expect(page.locator('[data-wallpaper-lab]')).toHaveAttribute('data-wallpaper-id', 'flow-shards');
  await expect(page.locator('[data-wallpaper-warning]')).toBeHidden();

  await page.goto('/setting/?wallpaper=blue-fluid-halftone');
  await expect(page.locator('[data-wallpaper-lab]')).toHaveAttribute('data-wallpaper-id', 'flow-shards');
  await expect(page.locator('[data-wallpaper-warning]')).toBeVisible();
  await expect(page.locator('[data-wallpaper-warning]')).toContainText('blue-fluid-halftone');

  await page.goto('/setting/?wallpaper=does-not-exist');
  await expect(page.locator('[data-wallpaper-lab]')).toHaveAttribute('data-wallpaper-id', 'flow-shards');
  await expect(page.locator('[data-wallpaper-warning]')).toContainText('does-not-exist');
});

test('draft changes reload but only explicit Apply mutates homepage preview and preferences', async ({ page }) => {
  await page.addInitScript((preferencesKey) => {
    localStorage.setItem(preferencesKey, JSON.stringify({
      version: 1,
      bootComplete: true,
      layout: 'windows',
      locale: 'ja',
      audioEnabled: false,
      wallpaperId: 'blue-fluid-halftone',
    }));
  }, PREFERENCES_KEY);
  await page.goto('/setting/?wallpaper=flow-shards');

  await page.locator('[data-wallpaper-control="speed"] input').fill('77');
  await expect(page.locator('[data-wallpaper-value="speed"]')).toHaveText('77');
  await expect.poll(() => page.evaluate((draftKey) => (
    JSON.parse(localStorage.getItem(draftKey)).drafts['flow-shards'].speed
  ), DRAFT_KEY)).toBe(77);
  expect(await page.evaluate((previewKey) => localStorage.getItem(previewKey), PREVIEW_KEY)).toBeNull();
  expect(await page.evaluate((preferencesKey) => (
    JSON.parse(localStorage.getItem(preferencesKey)).wallpaperId
  ), PREFERENCES_KEY)).toBe('blue-fluid-halftone');

  await page.reload();
  await expect(page.locator('[data-wallpaper-control="speed"] input')).toHaveValue('77');
  expect(await page.evaluate((previewKey) => localStorage.getItem(previewKey), PREVIEW_KEY)).toBeNull();

  await page.locator('[data-wallpaper-apply-local]').click();
  await expect.poll(() => page.evaluate((previewKey) => (
    JSON.parse(localStorage.getItem(previewKey)).config.speed
  ), PREVIEW_KEY)).toBe(77);
  await expect.poll(() => page.evaluate((preferencesKey) => (
    JSON.parse(localStorage.getItem(preferencesKey)).wallpaperId
  ), PREFERENCES_KEY)).toBe('flow-shards');
  expect(await page.evaluate((preferencesKey) => {
    const preferences = JSON.parse(localStorage.getItem(preferencesKey));
    return { version: preferences.version, layout: preferences.layout, locale: preferences.locale };
  }, PREFERENCES_KEY)).toEqual({ version: 1, layout: 'windows', locale: 'ja' });
  await expect(page.locator('[data-wallpaper-action-status]')).toHaveAttribute('data-status', 'success');
  await expect(page.locator('[data-wallpaper-action-status]')).toContainText('適用しました');
});

for (const blockedKey of [PREVIEW_KEY, PREFERENCES_KEY]) {
  test(`Apply rolls both records back when ${blockedKey} cannot be written`, async ({ page }) => {
    const priorPreview = '{ "version": 1, "wallpaperId": "flow-shards", "config": { "speed": 13 } }';
    const priorPreferences = '{ "version": 1, "bootComplete": true, "locale": "en", "wallpaperId": "blue-fluid-halftone" }';
    await page.addInitScript(({ preferencesKey, previewKey, preferencesRaw, previewRaw }) => {
      localStorage.setItem(previewKey, previewRaw);
      localStorage.setItem(preferencesKey, preferencesRaw);
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function selectivelyBlockedSetItem(key, value) {
        if (key === window.blockedWallpaperStorageKey) {
          throw new DOMException(`blocked ${key}`, 'SecurityError');
        }
        return originalSetItem.call(this, key, value);
      };
    }, {
      preferencesKey: PREFERENCES_KEY,
      previewKey: PREVIEW_KEY,
      preferencesRaw: priorPreferences,
      previewRaw: priorPreview,
    });
    await page.goto('/setting/?wallpaper=flow-shards');
    await expect(page.locator('[data-wallpaper-status]')).toHaveAttribute('data-status', 'ready', {
      timeout: 20_000,
    });
    await page.locator('[data-wallpaper-control="speed"] input').fill('77');
    await page.evaluate((key) => { window.blockedWallpaperStorageKey = key; }, blockedKey);

    await page.locator('[data-wallpaper-apply-local]').click();
    await expect(page.locator('[data-wallpaper-action-status]')).toHaveAttribute('data-status', 'error');
    await expect(page.locator('[data-wallpaper-action-status]')).toContainText('not applied');
    await page.evaluate(() => { window.blockedWallpaperStorageKey = null; });
    expect(await page.evaluate(({ preferencesKey, previewKey }) => ({
      preferences: localStorage.getItem(preferencesKey),
      preview: localStorage.getItem(previewKey),
    }), { preferencesKey: PREFERENCES_KEY, previewKey: PREVIEW_KEY })).toEqual({
      preferences: priorPreferences,
      preview: priorPreview,
    });
  });
}

test('Apply does not mutate either record when storage reads are blocked', async ({ page }) => {
  const priorPreview = '{"version":1,"wallpaperId":"flow-shards","config":{"speed":19}}';
  const priorPreferences = '{"version":1,"locale":"en","wallpaperId":"blue-fluid-halftone"}';
  await page.addInitScript(({ preferencesKey, previewKey, preferencesRaw, previewRaw }) => {
    localStorage.setItem(previewKey, previewRaw);
    localStorage.setItem(preferencesKey, preferencesRaw);
    const originalGetItem = Storage.prototype.getItem;
    Storage.prototype.getItem = function selectivelyBlockedGetItem(key) {
      if (window.blockWallpaperStorageReads && [previewKey, preferencesKey].includes(key)) {
        throw new DOMException(`blocked ${key}`, 'SecurityError');
      }
      return originalGetItem.call(this, key);
    };
  }, {
    preferencesKey: PREFERENCES_KEY,
    previewKey: PREVIEW_KEY,
    preferencesRaw: priorPreferences,
    previewRaw: priorPreview,
  });
  await page.goto('/setting/?wallpaper=flow-shards');
  await expect(page.locator('[data-wallpaper-status]')).toHaveAttribute('data-status', 'ready', {
    timeout: 20_000,
  });
  await page.evaluate(() => { window.blockWallpaperStorageReads = true; });

  await page.locator('[data-wallpaper-apply-local]').click();
  await expect(page.locator('[data-wallpaper-action-status]')).toHaveAttribute('data-status', 'error');
  await page.evaluate(() => { window.blockWallpaperStorageReads = false; });
  expect(await page.evaluate(({ preferencesKey, previewKey }) => ({
    preferences: localStorage.getItem(preferencesKey),
    preview: localStorage.getItem(previewKey),
  }), { preferencesKey: PREFERENCES_KEY, previewKey: PREVIEW_KEY })).toEqual({
    preferences: priorPreferences,
    preview: priorPreview,
  });
});

test('presets become custom after editing and reset saves the official default without applying it', async ({ page }) => {
  await page.addInitScript(({ previewKey, preferencesKey }) => {
    localStorage.setItem(previewKey, JSON.stringify({
      version: 1,
      wallpaperId: 'flow-shards',
      config: { speed: 13 },
    }));
    localStorage.setItem(preferencesKey, JSON.stringify({
      version: 1,
      bootComplete: true,
      wallpaperId: 'blue-fluid-halftone',
    }));
  }, { previewKey: PREVIEW_KEY, preferencesKey: PREFERENCES_KEY });
  await page.goto('/setting/?wallpaper=flow-shards');

  const previewBefore = await page.evaluate((previewKey) => localStorage.getItem(previewKey), PREVIEW_KEY);
  const preferencesBefore = await page.evaluate(
    (preferencesKey) => localStorage.getItem(preferencesKey),
    PREFERENCES_KEY,
  );
  await expect(page.locator('[data-wallpaper-preset-status]')).toHaveText('Reference');
  await page.locator('[data-wallpaper-preset="calm"]').click();
  await expect(page.locator('[data-wallpaper-preset-status]')).toHaveText('Calm');
  await expect(page.locator('[data-wallpaper-control="density"] select')).toHaveValue('low');
  await expect(page.locator('[data-wallpaper-control="speed"] input')).toHaveValue('24');
  await page.locator('[data-wallpaper-control="speed"] input').fill('25');
  await expect(page.locator('[data-wallpaper-preset-status]')).toHaveText('Custom');

  await page.locator('[data-wallpaper-reset]').click();
  await expect(page.locator('[data-wallpaper-preset-status]')).toHaveText('Reference');
  await expect(page.locator('[data-wallpaper-control="speed"] input')).toHaveValue('42');
  await expect.poll(() => page.evaluate((draftKey) => (
    JSON.parse(localStorage.getItem(draftKey)).drafts['flow-shards'].speed
  ), DRAFT_KEY)).toBe(42);
  expect(await page.evaluate((previewKey) => localStorage.getItem(previewKey), PREVIEW_KEY))
    .toBe(previewBefore);
  expect(await page.evaluate((preferencesKey) => localStorage.getItem(preferencesKey), PREFERENCES_KEY))
    .toBe(preferencesBefore);
});

test('density rebuild is debounced and keeps one live preview surface', async ({ page }) => {
  await page.goto('/setting/?wallpaper=flow-shards');
  const surface = page.locator('[data-wallpaper-preview] [data-wallpaper-active="true"]');
  await expect(surface).toHaveAttribute('data-simulation-size', '96', { timeout: 20_000 });

  const density = page.locator('[data-wallpaper-control="density"] select');
  const debounce = await density.evaluate((select) => {
    const nativeSetTimeout = window.setTimeout.bind(window);
    const nativeClearTimeout = window.clearTimeout.bind(window);
    let nextId = 1000;
    window.densityTimers = [];
    window.densityTransitions = [];
    new MutationObserver((records) => {
      for (const record of records) {
        window.densityTransitions.push(record.target.dataset.simulationSize);
      }
    }).observe(document.querySelector('[data-wallpaper-active="true"]'), {
      attributeFilter: ['data-simulation-size'],
    });
    window.setTimeout = (callback, delay, ...args) => {
      if (delay !== 120) return nativeSetTimeout(callback, delay, ...args);
      const timer = { callback: () => callback(...args), cancelled: false, delay, id: nextId++ };
      window.densityTimers.push(timer);
      return timer.id;
    };
    window.clearTimeout = (id) => {
      const timer = window.densityTimers.find((entry) => entry.id === id);
      if (timer) timer.cancelled = true;
      else nativeClearTimeout(id);
    };
    select.value = 'low';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    select.value = 'high';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    return {
      activeTimers: window.densityTimers.filter((timer) => !timer.cancelled).length,
      delays: window.densityTimers.map((timer) => timer.delay),
      size: document.querySelector('[data-wallpaper-active="true"]').dataset.simulationSize,
      transitions: [...window.densityTransitions],
    };
  });
  expect(debounce).toEqual({ activeTimers: 1, delays: [120, 120], size: '96', transitions: [] });
  await page.evaluate(() => {
    window.densityTimers.find((timer) => !timer.cancelled).callback();
  });
  await expect(surface).toHaveAttribute('data-simulation-size', '128', { timeout: 20_000 });
  await expect.poll(() => page.evaluate(() => window.densityTransitions)).toEqual(['128']);
  await expect(page.locator('[data-wallpaper-preview] [data-wallpaper-surface]')).toHaveCount(1);
});

test('copy fallback and downloads use the same normalized deterministic JSON', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async (value) => { window.copiedWallpaperConfig = value; } },
    });
  });
  await page.goto('/setting/?wallpaper=flow-shards');
  await page.locator('[data-wallpaper-control="speed"] input').fill('77');
  await page.locator('[data-wallpaper-copy]').click();
  const copied = await page.evaluate(() => window.copiedWallpaperConfig);
  await expect(page.locator('[data-wallpaper-copy-fallback]')).toBeHidden();

  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async () => { throw new Error('clipboard blocked'); } },
    });
  });
  await page.locator('[data-wallpaper-copy]').click();

  const fallback = page.locator('[data-wallpaper-copy-fallback]');
  await expect(fallback).toBeVisible();
  await expect(fallback).toHaveAttribute('readonly', '');
  expect(await fallback.inputValue()).toBe(copied);
  const selection = await fallback.evaluate((element) => ({
    end: element.selectionEnd,
    length: element.value.length,
    start: element.selectionStart,
  }));
  expect(selection).toEqual({ start: 0, end: selection.length, length: selection.length });

  const firstDownloadPromise = page.waitForEvent('download');
  await page.locator('[data-wallpaper-download]').click();
  const firstDownload = await firstDownloadPromise;
  expect(firstDownload.suggestedFilename()).toBe('flow-shards.config.json');
  const firstText = await readDownload(firstDownload);
  expect(firstText).toBe(copied);
  expect(JSON.parse(firstText)).toEqual({
    schemaVersion: 1,
    wallpaperId: 'flow-shards',
    config: {
      density: 'medium',
      speed: 77,
      vortexSize: 58,
      turbulence: 62,
      motionRange: 55,
      shardSize: 46,
      trailLength: 62,
      glow: 58,
      shadow: 56,
      fog: 44,
      backgroundColor: '#0B1D32',
      shardColor: '#C9E8FF',
    },
  });
  expect(firstText).not.toContain('timestamp');

  const secondDownloadPromise = page.waitForEvent('download');
  await page.locator('[data-wallpaper-download]').click();
  expect(await readDownload(await secondDownloadPromise)).toBe(firstText);
});

test('corrupt or blocked storage keeps the in-memory authoring session usable', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(({ draftKey, previewKey, preferencesKey }) => {
    localStorage.setItem(draftKey, '{broken');
    localStorage.setItem(previewKey, '{broken');
    localStorage.setItem(preferencesKey, '{broken');
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function blockedSetItem(key, value) {
      if ([draftKey, previewKey, preferencesKey].includes(key)) throw new DOMException('blocked', 'SecurityError');
      return originalSetItem.call(this, key, value);
    };
  }, { draftKey: DRAFT_KEY, previewKey: PREVIEW_KEY, preferencesKey: PREFERENCES_KEY });
  await page.goto('/setting/?wallpaper=flow-shards');

  await expect(page.locator('[data-wallpaper-control="speed"] input')).toHaveValue('42');
  await page.locator('[data-wallpaper-control="speed"] input').fill('71');
  await expect(page.locator('[data-wallpaper-value="speed"]')).toHaveText('71');
  await expect(page.locator('[data-wallpaper-preview] [data-wallpaper-active="true"]')).toHaveCount(1, {
    timeout: 20_000,
  });
  expect(errors).toEqual([]);
});

test('preview initialization failure is readable and leaves the controls available', async ({ page }) => {
  await page.route('**/vendor/three.module.min.js', (route) => route.abort('failed'));
  await page.goto('/setting/?wallpaper=flow-shards');

  await expect(page.locator('[data-wallpaper-status]')).toHaveAttribute('data-status', 'error', {
    timeout: 20_000,
  });
  await expect(page.locator('[data-wallpaper-status]')).toContainText('preview');
  await expect(page.locator('[data-wallpaper-apply-local]')).toBeDisabled();
  await expect(page.locator('[data-wallpaper-reset]')).toBeEnabled();
  await expect(page.locator('[data-wallpaper-copy]')).toBeEnabled();
  await expect(page.locator('[data-wallpaper-download]')).toBeEnabled();
  await expect(page.locator('[data-wallpaper-control]')).toHaveCount(12);
});

test('a failing saved draft is rejected before the lab can enable Apply', async ({ page }) => {
  let releaseFallback;
  await page.route('**/shader-background.js', async (route) => {
    await new Promise((resolve) => { releaseFallback = resolve; });
    await route.continue();
  });
  await page.addInitScript((draftKey) => {
    localStorage.setItem(draftKey, JSON.stringify({
      version: 1,
      drafts: { 'flow-shards': { density: 'high' } },
    }));
    window.applyWasEnabled = false;
    new MutationObserver(() => {
      const apply = document.querySelector('[data-wallpaper-apply-local]');
      if (apply && !apply.disabled) window.applyWasEnabled = true;
    }).observe(document, { attributes: true, childList: true, subtree: true });
    const originalGetError = WebGL2RenderingContext.prototype.getError;
    let flowErrorChecks = 0;
    WebGL2RenderingContext.prototype.getError = function failDraftUpdateOnce() {
      flowErrorChecks += 1;
      if (flowErrorChecks === 2) return 0x0502;
      return originalGetError.call(this);
    };
  }, DRAFT_KEY);
  await page.goto('/setting/?wallpaper=flow-shards');

  await expect(page.locator('[data-wallpaper-preview] [data-wallpaper-error="config-update-failed"]'))
    .toHaveCount(1, { timeout: 20_000 });
  await expect(page.locator('[data-wallpaper-status]')).toHaveAttribute('data-status', 'error', {
    timeout: 5_000,
  });
  await expect(page.locator('[data-wallpaper-apply-local]')).toBeDisabled();
  expect(await page.evaluate(() => window.applyWasEnabled)).toBe(false);
  await expect(page.locator('[data-wallpaper-preview] [data-environment-background]'))
    .toHaveAttribute('data-background-id', 'flow-shards');
  releaseFallback();
  await expect(page.locator('[data-wallpaper-preview] [data-environment-background]'))
    .not.toHaveAttribute('data-background-id', 'flow-shards', { timeout: 20_000 });
});

test('runtime preview loss disables only Apply while draft, reset, and export remain usable', async ({ page }) => {
  let releaseFallback;
  await page.route('**/shader-background.js', async (route) => {
    await new Promise((resolve) => { releaseFallback = resolve; });
    await route.continue();
  });
  await page.goto('/setting/?wallpaper=flow-shards');
  const apply = page.locator('[data-wallpaper-apply-local]');
  await expect(page.locator('[data-wallpaper-status]')).toHaveAttribute('data-status', 'ready', {
    timeout: 20_000,
  });
  await expect(apply).toBeEnabled();

  await page.locator('[data-wallpaper-preview] canvas[data-background-id="flow-shards"]')
    .dispatchEvent('webglcontextlost');
  await expect(page.locator('[data-wallpaper-status]')).toHaveAttribute('data-status', 'error', {
    timeout: 5_000,
  });
  await expect(apply).toBeDisabled();
  await expect(page.locator('[data-wallpaper-preview] [data-environment-background]'))
    .toHaveAttribute('data-background-id', 'flow-shards');
  releaseFallback();
  await expect(page.locator('[data-wallpaper-preview] [data-environment-background]'))
    .not.toHaveAttribute('data-background-id', 'flow-shards', { timeout: 20_000 });

  await page.locator('[data-wallpaper-control="speed"] input').fill('73');
  await expect(page.locator('[data-wallpaper-value="speed"]')).toHaveText('73');
  await page.locator('[data-wallpaper-reset]').click();
  await expect(page.locator('[data-wallpaper-control="speed"] input')).toHaveValue('42');
  const downloadPromise = page.waitForEvent('download');
  await page.locator('[data-wallpaper-download]').click();
  expect((await downloadPromise).suggestedFilename()).toBe('flow-shards.config.json');
  await expect(page.locator('[data-wallpaper-copy]')).toBeEnabled();
});

test('narrow viewports keep the desktop document scrollable and unload destroys the preview', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 700 });
  await page.goto('/setting/?wallpaper=flow-shards');
  await expect(page.locator('[data-wallpaper-status]')).toHaveAttribute('data-status', 'ready', {
    timeout: 20_000,
  });
  const widths = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }));
  expect(widths.documentWidth).toBeGreaterThan(widths.viewportWidth);
  await expect(page.locator('[data-wallpaper-preview] [data-environment-background]')).toHaveCount(1);
  await page.evaluate(() => window.scrollTo({
    behavior: 'instant',
    left: document.documentElement.scrollWidth,
    top: 0,
  }));
  await expect.poll(() => page.evaluate(() => window.scrollX)).toBeGreaterThan(0);
  await expect(page.locator('.control-panel')).toBeInViewport();

  await page.evaluate(() => window.dispatchEvent(new Event('beforeunload')));
  await expect(page.locator('[data-wallpaper-preview] [data-environment-background]')).toHaveCount(0);
});

test('GitHub Pages project base resolves the lab and its relative imports', async ({ page }) => {
  const failed = [];
  page.on('response', (response) => {
    if (response.status() >= 400) failed.push(`${response.status()} ${response.url()}`);
  });

  await page.goto('/readME/setting/?wallpaper=flow-shards');
  await expect(page.locator('[data-wallpaper-lab]')).toHaveAttribute('data-wallpaper-id', 'flow-shards');
  await expect(page.locator('[data-wallpaper-control]')).toHaveCount(12);
  await expect(page.locator('[data-wallpaper-status]')).toHaveAttribute('data-status', 'ready', {
    timeout: 20_000,
  });
  expect(failed).toEqual([]);
});
