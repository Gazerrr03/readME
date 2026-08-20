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
    title: { en: 'Blue Fluid', 'zh-CN': '蓝色流体' },
    description: { en: 'A quiet blue current.', 'zh-CN': '安静的蓝色流动。' },
    previewSrc: 'assets/background/previews/blue-fluid-halftone.png',
  },
  {
    id: 'flow-shards',
    title: { en: 'Flow Shards', 'zh-CN': '流动晶片' },
    description: { en: 'Illuminated shards.', 'zh-CN': '发光晶片。' },
    previewSrc: 'assets/background/previews/flow-shards.png',
  },
];

async function mountDeferredWallpaperView(page) {
  await page.goto('/?skipBoot=1');
  await page.evaluate(async (wallpapers) => {
    const { createWallpapersView } = await import('/modules/interactive-buttons/photos/wallpapers-view.js');
    const subscribers = new Set();
    const labels = {
      en: {
        'photos.wallpapers': 'Wallpapers',
        'photos.wallpapers.back': 'Back to wallpapers',
        'photos.wallpapers.current': 'Current wallpaper',
        'photos.wallpapers.apply': 'Apply wallpaper',
        'photos.wallpapers.idle': '',
        'photos.wallpapers.applying': 'Applying wallpaper…',
        'photos.wallpapers.success': 'Wallpaper applied.',
        'photos.wallpapers.error': 'Could not apply wallpaper.',
      },
      'zh-CN': {
        'photos.wallpapers': '壁纸',
        'photos.wallpapers.back': '返回壁纸列表',
        'photos.wallpapers.current': '当前壁纸',
        'photos.wallpapers.apply': '设为壁纸',
        'photos.wallpapers.idle': '',
        'photos.wallpapers.applying': '正在应用壁纸…',
        'photos.wallpapers.success': '壁纸已应用。',
        'photos.wallpapers.error': '无法应用壁纸。',
      },
    };
    const i18n = {
      locale: 'en',
      t: (key) => labels[i18n.locale][key] ?? key,
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
    window.wallpaperViewTest = {
      calls,
      root,
      subscribers,
      setLocale(locale) {
        i18n.locale = locale;
        subscribers.forEach((listener) => listener(locale));
      },
    };
  }, wallpaperFixture);
}

async function settleWallpaperRequest(page, index, result, rejected = false) {
  await page.evaluate(({ requestIndex, requestResult, shouldReject }) => {
    const request = window.wallpaperViewTest.calls[requestIndex];
    if (shouldReject) request.reject(new Error('renderer unavailable'));
    else request.resolve(requestResult);
  }, { requestIndex: index, requestResult: result, shouldReject: rejected });
}

async function applyWallpaperFromPhotos(page, photosWindow, id) {
  const host = page.locator('[data-environment-background]');
  const wallpapersView = photosWindow.locator('[data-wallpapers-view]');
  if (await wallpapersView.getAttribute('data-wallpaper-view') === 'detail') {
    await wallpapersView.locator('[data-wallpaper-back]').click();
  }
  await wallpapersView.locator(`[data-wallpaper-card="${id}"]`).click();
  await wallpapersView.locator('[data-wallpaper-apply]').click();
  await expect(host).toHaveAttribute('data-background-id', id, { timeout: 20_000 });
  await expect(host).toHaveAttribute('data-wallpaper-state', 'ready');
  await expect(host.locator('[data-wallpaper-active="true"]')).toHaveCount(1);
  await expect(host.locator('[data-wallpaper-surface]')).toHaveCount(1);
  await expect(wallpapersView.locator('[data-wallpaper-apply-status]'))
    .toHaveAttribute('data-wallpaper-apply-status', 'success');
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
  await expect(window.locator('[data-photos-panel="wallpapers"] canvas')).toHaveCount(0);
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

test('repeated blue and Flow switches settle with exactly one owned surface', async ({ page }) => {
  test.setTimeout(90_000);
  await seedLayout(page, 'macos');
  await page.goto('/');
  await page.locator('[data-folder-toggle="photos"]').click();
  const photosWindow = page.locator('[data-app-window="photos"]');
  await photosWindow.locator('[data-photos-tab="wallpapers"]').click();

  for (const id of [
    'flow-shards',
    'blue-fluid-halftone',
    'flow-shards',
    'blue-fluid-halftone',
  ]) {
    await applyWallpaperFromPhotos(page, photosWindow, id);
  }
});

test('a rejected Flow renderer preserves the DOM wallpaper ID and preference bytes', async ({ page }) => {
  await seedLayout(page, 'windows');
  await page.route('**/vendor/three.module.min.js', (route) => route.abort('failed'));
  await page.goto('/');
  await page.locator('[data-folder-toggle="photos"]').click();
  const photosWindow = page.locator('[data-app-window="photos"]');
  await photosWindow.locator('[data-photos-tab="wallpapers"]').click();
  await photosWindow.locator('[data-wallpaper-card="flow-shards"]').click();

  const before = await page.evaluate(() => ({
    domId: document.querySelector('[data-environment-background]')?.dataset.backgroundId,
    preferences: localStorage.getItem('portfolio-os:preferences'),
  }));
  await photosWindow.locator('[data-wallpaper-apply]').click();
  await expect(photosWindow.locator('[data-wallpaper-apply-status]'))
    .toHaveAttribute('data-wallpaper-apply-status', 'error');
  expect(await page.evaluate(() => ({
    domId: document.querySelector('[data-environment-background]')?.dataset.backgroundId,
    preferences: localStorage.getItem('portfolio-os:preferences'),
  }))).toEqual(before);
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
  await expect.poll(() => page.evaluate(() => window.wallpaperViewTest.calls.length)).toBe(0);
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

test('wallpaper detail keeps its localized state and focused Back control through locale changes', async ({ page }) => {
  await mountDeferredWallpaperView(page);
  const root = page.locator('[data-wallpapers-view]');
  await root.locator('[data-wallpaper-card="flow-shards"]').click();
  await root.locator('[data-wallpaper-apply]').click();
  await page.evaluate(() => window.wallpaperViewTest.setLocale('zh-CN'));
  await expect(root.locator('[data-wallpaper-title]')).toHaveText('流动晶片');
  await expect(root.locator('[data-wallpaper-back]')).toHaveText('← 返回壁纸列表');
  await expect(root.locator('[data-wallpaper-apply]')).toHaveText('设为壁纸');
  await expect(root.locator('[data-wallpaper-apply-status]')).toHaveAttribute('data-wallpaper-apply-status', 'applying');
  await expect(root.locator('[data-wallpaper-apply-status]')).toHaveText('正在应用壁纸…');

  await settleWallpaperRequest(page, 0, { ok: false, id: 'flow-shards' });
  const back = root.locator('[data-wallpaper-back]');
  await back.focus();
  await page.evaluate(() => window.wallpaperViewTest.setLocale('en'));
  await expect(back).toBeFocused();
  await expect(root.locator('[data-wallpaper-apply-status]')).toHaveAttribute('data-wallpaper-apply-status', 'error');
  await expect(root.locator('[data-wallpaper-apply-status]')).toHaveText('Could not apply wallpaper.');
});

test('replacement wallpaper view synchronizes when a detached request updates the current preference', async ({ page }) => {
  await page.goto('/?skipBoot=1');
  await page.evaluate(async (wallpapers) => {
    const { createWallpapersView } = await import('/modules/interactive-buttons/photos/wallpapers-view.js');
    let currentId = 'blue-fluid-halftone';
    const currentSubscribers = new Set();
    const i18n = {
      locale: 'en',
      t: (key) => ({
        'photos.wallpapers.current': 'Current wallpaper',
        'photos.wallpapers.back': 'Back',
        'photos.wallpapers.apply': 'Apply wallpaper',
        'photos.wallpapers.idle': '',
        'photos.wallpapers.applying': 'Applying…',
        'photos.wallpapers.success': 'Applied.',
        'photos.wallpapers.error': 'Failed.',
      })[key] ?? key,
      subscribe: () => () => {},
    };
    const calls = [];
    const subscribeCurrentWallpaper = (listener) => {
      currentSubscribers.add(listener);
      return () => currentSubscribers.delete(listener);
    };
    const oldRoot = createWallpapersView({
      document,
      i18n,
      wallpapers,
      currentId,
      subscribeCurrentWallpaper,
      applyWallpaper: () => new Promise((resolve) => calls.push(resolve)),
    });
    document.body.append(oldRoot);
    window.currentWallpaperSyncTest = {
      calls,
      oldRoot,
      currentSubscribers,
      mountReplacement() {
        const replacement = createWallpapersView({
          document,
          i18n,
          wallpapers,
          currentId,
          subscribeCurrentWallpaper,
        });
        document.body.append(replacement);
        this.replacement = replacement;
      },
      settleOldRequest() {
        currentId = 'flow-shards';
        currentSubscribers.forEach((listener) => listener(currentId));
        calls[0]({ ok: true, id: currentId });
      },
    };
  }, wallpaperFixture);
  const oldRoot = page.locator('[data-wallpapers-view]').first();
  await oldRoot.locator('[data-wallpaper-card="flow-shards"]').click();
  await oldRoot.locator('[data-wallpaper-apply]').click();
  await page.evaluate(async () => {
    window.currentWallpaperSyncTest.oldRoot.remove();
    await new Promise((resolve) => setTimeout(resolve, 0));
    window.currentWallpaperSyncTest.mountReplacement();
  });
  await expect(page.locator('[data-wallpapers-view]').last().locator('[data-wallpaper-card="blue-fluid-halftone"]')).toHaveAttribute('aria-current', 'true');
  await page.evaluate(() => window.currentWallpaperSyncTest.settleOldRequest());
  await expect(page.locator('[data-wallpapers-view]').last().locator('[data-wallpaper-card="flow-shards"]')).toHaveAttribute('aria-current', 'true');
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
