import { test, expect } from '@playwright/test';

async function seedLayout(page, layout, locale = 'en') {
  await page.addInitScript((preferences) => {
    if (!localStorage.getItem('portfolio-os:preferences')) {
      localStorage.setItem('portfolio-os:preferences', JSON.stringify(preferences));
    }
  }, {
    version: 1,
    bootComplete: true,
    layout,
    locale,
    audioEnabled: false,
  });
}

const wallpaperFixture = [
  {
    id: 'blue-fluid-halftone',
    title: { en: 'Blue Fluid' },
    description: { en: 'A quiet blue current.' },
    previewSrc: 'assets/background/previews/blue-fluid-halftone.png',
  },
  {
    id: 'flow-shards',
    title: { en: 'Flow Shards' },
    description: { en: 'Illuminated shards.' },
    previewSrc: 'assets/background/previews/flow-shards.png',
  },
];

async function mountDeferredWallpaperView(page) {
  await page.goto('/?skipBoot=1');
  await page.evaluate(async (wallpapers) => {
    const { createWallpapersView } = await import('/modules/interactive-buttons/photos/wallpapers-view.js');
    const subscribers = new Set();
    const labels = {
      'photos.wallpapers': 'Wallpapers',
      'photos.wallpapers.back': 'Back to wallpapers',
      'photos.wallpapers.current': 'Current wallpaper',
      'photos.wallpapers.apply': 'Apply wallpaper',
      'photos.wallpapers.idle': '',
      'photos.wallpapers.applying': 'Applying wallpaper…',
      'photos.wallpapers.success': 'Wallpaper applied.',
      'photos.wallpapers.error': 'Could not apply wallpaper.',
    };
    const i18n = {
      locale: 'en',
      t: (key) => labels[key] ?? key,
      subscribe(listener) {
        subscribers.add(listener);
        return () => subscribers.delete(listener);
      },
    };
    const calls = [];
    const root = createWallpapersView({
      document,
      i18n,
      wallpapers,
      currentId: 'blue-fluid-halftone',
      applyWallpaper: (id) => new Promise((resolve, reject) => calls.push({ id, resolve, reject })),
    });
    document.body.append(root);
    window.wallpaperViewTest = { calls, root, subscribers };
  }, wallpaperFixture);
}

async function settleWallpaperRequest(page, index, result, rejected = false) {
  await page.evaluate(({ requestIndex, requestResult, shouldReject }) => {
    const request = window.wallpaperViewTest.calls[requestIndex];
    if (shouldReject) request.reject(new Error('renderer unavailable'));
    else request.resolve(requestResult);
  }, { requestIndex: index, requestResult: result, shouldReject: rejected });
}

test('Photos preserves four photos and applies a wallpaper through a static two-step preview', async ({ page }) => {
  await seedLayout(page, 'macos');
  await page.goto('/');
  await page.locator('[data-folder-toggle="photos"]').click();
  const window = page.locator('[data-app-window="photos"]');

  await expect(window.locator('[data-photos-tab="photos"]')).toHaveAttribute('aria-selected', 'true');
  await expect(window.locator('[data-folder-item]')).toHaveCount(4);
  await window.locator('[data-photos-tab="wallpapers"]').click();
  await expect(window.locator('[data-wallpaper-card]')).toHaveCount(2);
  await expect(window.locator('[data-wallpaper-card] img')).toHaveCount(2);
  await expect(window.locator('[data-photos-panel="wallpapers"] canvas')).toHaveCount(0);

  await window.locator('[data-wallpaper-card="flow-shards"]').click();
  await expect(window.locator('[data-wallpaper-detail="flow-shards"]')).toBeVisible();
  const storedBeforeApply = await page.evaluate(() => localStorage.getItem('portfolio-os:preferences'));
  await expect(page.locator('[data-environment-background]')).toHaveAttribute('data-background-id', 'blue-fluid-halftone');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('portfolio-os:preferences'))).toBe(storedBeforeApply);
  await window.locator('[data-wallpaper-apply]').click();
  await expect(page.locator('[data-environment-background]')).toHaveAttribute(
    'data-background-id',
    'flow-shards',
    { timeout: 20_000 },
  );
  await expect.poll(() => page.evaluate(() => (
    JSON.parse(localStorage.getItem('portfolio-os:preferences')).wallpaperId
  ))).toBe('flow-shards');

  await page.reload();
  const restoredBackground = page.locator('[data-environment-background]');
  await expect(restoredBackground).toHaveAttribute('data-background-id', 'flow-shards');
  await expect(restoredBackground).toHaveAttribute('data-wallpaper-state', 'ready', { timeout: 20_000 });
  await expect(restoredBackground.locator('[data-wallpaper-renderer="three-webgl2"][data-wallpaper-active="true"]')).toHaveCount(1);
});

test('a wallpaper card opens its static detail with Enter', async ({ page }) => {
  await seedLayout(page, 'windows');
  await page.goto('/');
  await page.locator('[data-folder-toggle="photos"]').click();
  const window = page.locator('[data-app-window="photos"]');

  await window.locator('[data-photos-tab="wallpapers"]').click();
  await window.locator('[data-wallpaper-card="blue-fluid-halftone"]').focus();
  await window.locator('[data-wallpaper-card="blue-fluid-halftone"]').press('Enter');
  await expect(window.locator('[data-wallpaper-detail="blue-fluid-halftone"]')).toBeVisible();
});

test('wallpaper apply keeps navigation, focus, and the live status stable while pending', async ({ page }) => {
  await mountDeferredWallpaperView(page);
  const root = page.locator('[data-wallpapers-view]');
  const flowCard = root.locator('[data-wallpaper-card="flow-shards"]');
  const blueCard = root.locator('[data-wallpaper-card="blue-fluid-halftone"]');

  await expect(blueCard).toHaveAttribute('aria-current', 'true');
  await expect(blueCard).toHaveAccessibleName('Blue Fluid Current wallpaper');
  await flowCard.click();
  const apply = root.locator('[data-wallpaper-apply]');
  const back = root.locator('[data-wallpaper-back]');
  await apply.click();
  await expect(apply).toBeDisabled();
  await expect(back).toBeDisabled();
  await expect(root.locator('[data-wallpaper-apply-status]')).toHaveAttribute('data-wallpaper-apply-status', 'applying');
  await back.click({ force: true });
  await expect(root.locator('[data-wallpaper-detail="flow-shards"]')).toBeVisible();

  await settleWallpaperRequest(page, 0, { ok: true, id: 'flow-shards' });
  await expect(root.locator('[data-wallpaper-apply-status]')).toHaveAttribute('data-wallpaper-apply-status', 'success');
  await expect(apply).toBeEnabled();
  await expect(apply).toBeFocused();
  await back.click();
  await expect(flowCard).toBeFocused();
  await expect(flowCard).toHaveAttribute('aria-current', 'true');
});

test('wallpaper apply preserves the old current card on failure and ignores stale settlement after removal', async ({ page }) => {
  await mountDeferredWallpaperView(page);
  const root = page.locator('[data-wallpapers-view]');
  await root.locator('[data-wallpaper-card="flow-shards"]').click();
  const apply = root.locator('[data-wallpaper-apply]');
  await apply.click();
  await settleWallpaperRequest(page, 0, { ok: false, id: 'flow-shards' });
  await expect(root.locator('[data-wallpaper-apply-status]')).toHaveAttribute('data-wallpaper-apply-status', 'error');
  await expect(apply).toBeEnabled();
  await expect(apply).toBeFocused();
  await root.locator('[data-wallpaper-back]').click();
  await expect(root.locator('[data-wallpaper-card="blue-fluid-halftone"]')).toHaveAttribute('aria-current', 'true');

  await root.locator('[data-wallpaper-card="flow-shards"]').click();
  await root.locator('[data-wallpaper-apply]').click();
  await page.evaluate(async () => {
    window.wallpaperViewTest.root.remove();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  await settleWallpaperRequest(page, 1, { ok: true, id: 'flow-shards' });
  await expect.poll(() => page.evaluate(() => ({
    listeners: window.wallpaperViewTest.subscribers.size,
    status: window.wallpaperViewTest.root.querySelector('[data-wallpaper-apply-status]')?.dataset.wallpaperApplyStatus,
  }))).toEqual({ listeners: 0, status: 'applying' });
});

test('wallpaper apply exposes an error and restores focus after a rejected application', async ({ page }) => {
  await mountDeferredWallpaperView(page);
  const root = page.locator('[data-wallpapers-view]');
  await root.locator('[data-wallpaper-card="flow-shards"]').click();
  const apply = root.locator('[data-wallpaper-apply]');
  await apply.click();
  await settleWallpaperRequest(page, 0, null, true);
  await expect(root.locator('[data-wallpaper-apply-status]')).toHaveAttribute('data-wallpaper-apply-status', 'error');
  await expect(root.locator('[data-wallpaper-apply-status]')).toHaveText('Could not apply wallpaper.');
  await expect(apply).toBeEnabled();
  await expect(apply).toBeFocused();
});

test('detached Photos and wallpaper views release their locale subscriptions', async ({ page }) => {
  await page.goto('/?skipBoot=1');
  const listenerCounts = await page.evaluate(async (wallpapers) => {
    const [{ renderPhotosApp }, { createWallpapersView }] = await Promise.all([
      import('/modules/interactive-buttons/photos/photos-app.js'),
      import('/modules/interactive-buttons/photos/wallpapers-view.js'),
    ]);
    const listeners = new Set();
    const i18n = {
      locale: 'en',
      t: (key) => key,
      subscribe(listener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
    };
    const mount = document.createElement('div');
    document.body.append(mount);
    const photos = renderPhotosApp({
      i18n,
      mount,
      preferences: {},
      wallpapers,
      applyWallpaper: async () => ({ ok: true, id: 'blue-fluid-halftone' }),
    });
    mount.append(photos);
    const wallpapersRoot = createWallpapersView({ document, i18n, wallpapers });
    document.body.append(wallpapersRoot);
    const beforeDetach = listeners.size;
    photos.remove();
    wallpapersRoot.remove();
    await new Promise((resolve) => setTimeout(resolve, 0));
    return { beforeDetach, afterDetach: listeners.size };
  }, wallpaperFixture);

  expect(listenerCounts.beforeDetach).toBeGreaterThanOrEqual(3);
  expect(listenerCounts.afterDetach).toBe(0);
});
