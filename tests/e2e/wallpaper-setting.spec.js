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
  await expect(page.locator('[data-wallpaper-action-status]')).toContainText('local homepage');
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
  await expect(page.locator('[data-wallpaper-preset-status]')).toHaveText('reference');
  await page.locator('[data-wallpaper-preset="calm"]').click();
  await expect(page.locator('[data-wallpaper-preset-status]')).toHaveText('calm');
  await expect(page.locator('[data-wallpaper-control="density"] select')).toHaveValue('low');
  await expect(page.locator('[data-wallpaper-control="speed"] input')).toHaveValue('24');
  await page.locator('[data-wallpaper-control="speed"] input').fill('25');
  await expect(page.locator('[data-wallpaper-preset-status]')).toHaveText('custom');

  await page.locator('[data-wallpaper-reset]').click();
  await expect(page.locator('[data-wallpaper-preset-status]')).toHaveText('reference');
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
  const sizeBeforeDebounce = await density.evaluate((select) => {
    select.value = 'low';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    select.value = 'high';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    return document.querySelector('[data-wallpaper-active="true"]').dataset.simulationSize;
  });
  expect(sizeBeforeDebounce).toBe('96');
  await expect(surface).toHaveAttribute('data-simulation-size', '128', { timeout: 20_000 });
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
  await expect(page.locator('[data-wallpaper-control]')).toHaveCount(12);
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
