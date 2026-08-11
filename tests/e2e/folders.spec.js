import { test, expect } from '@playwright/test';

async function seedLayout(page, layout, locale = 'en') {
  await page.addInitScript((preferences) => {
    localStorage.setItem('portfolio-os:preferences', JSON.stringify(preferences));
  }, {
    version: 1,
    bootComplete: true,
    layout,
    locale,
    audioEnabled: false,
  });
}

test('folders sit on the right edge in both desktop modes', async ({ page }) => {
  await seedLayout(page, 'windows');
  await page.goto('/');
  const { width } = page.viewportSize();
  const windowsFolders = await page.locator('[data-desktop-folders]').boundingBox();
  expect(Math.round(windowsFolders.x + windowsFolders.width)).toBe(width - 24);
  expect(Math.round(windowsFolders.y)).toBe(24);

  await seedLayout(page, 'macos');
  await page.goto('/');
  const macosFolders = await page.locator('[data-desktop-folders]').boundingBox();
  expect(Math.round(macosFolders.x + macosFolders.width)).toBe(width - 24);
  expect(Math.round(macosFolders.y)).toBe(56);
});

test('photos folder expands, opens the viewer, and collapses on outside click', async ({ page }) => {
  await seedLayout(page, 'macos');
  await page.goto('/');

  const toggle = page.locator('[data-folder-toggle="photos"]');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');

  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('[data-folder-stamps="photos"] [data-stamp]')).toHaveCount(4);

  // Clicking outside the folders collapses them again.
  await page.locator('[data-macos-menu]').click({ position: { x: 300, y: 16 } });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');

  await toggle.click();
  await page.locator('[data-stamp="coast"]').click();
  const viewer = page.locator('[data-app-window="photos"]');
  await expect(viewer).toBeVisible();
  await expect(viewer.locator('[data-photos-count]')).toHaveText('01 / 04');
  await expect(viewer.locator('[data-photos-title]')).toHaveText('COAST 02:14');

  await viewer.locator('[data-photos-next]').click();
  await expect(viewer.locator('[data-photos-count]')).toHaveText('02 / 04');
  await expect(viewer.locator('[data-photos-title]')).toHaveText('MOONRISE');

  // Opening a stamp collapses the folder.
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
});

test('albums folder opens the player and toggles playback', async ({ page }) => {
  await seedLayout(page, 'macos');
  await page.goto('/');

  await page.locator('[data-folder-toggle="albums"]').click();
  await expect(page.locator('[data-folder-stamps="albums"] [data-stamp]')).toHaveCount(3);

  await page.locator('[data-stamp="tide-study-0200"]').click();
  const player = page.locator('[data-app-window="albums"]');
  await expect(player).toBeVisible();
  await expect(player.locator('[data-player-track]')).toHaveText('TRK 01/03');
  await expect(player.locator('[data-albums-app]')).toHaveAttribute('data-player-status', 'playing');

  await player.locator('[data-player-toggle]').click();
  await expect(player.locator('[data-albums-app]')).toHaveAttribute('data-player-status', 'paused');

  await player.locator('[data-player-next]').click();
  await expect(player.locator('[data-player-track]')).toHaveText('TRK 02/03');
});

test('folder and stamp labels follow the locale', async ({ page }) => {
  await seedLayout(page, 'windows', 'zh-CN');
  await page.goto('/');

  await expect(page.locator('[data-folder-toggle="photos"]')).toContainText('照片');
  await expect(page.locator('[data-folder-toggle="albums"]')).toContainText('唱片');

  await page.locator('[data-folder-toggle="photos"]').click();
  await expect(page.locator('[data-stamp="coast"]')).toContainText('海岸 02:14');
  await page.locator('[data-stamp="coast"]').click();
  await expect(page.locator('[data-app-window="photos"] [data-photos-title]')).toHaveText('海岸 02:14');
});

test('Escape returns focus from a stamp to its folder toggle', async ({ page }) => {
  await seedLayout(page, 'windows');
  await page.goto('/');

  const toggle = page.locator('[data-folder-toggle="photos"]');
  await toggle.click();
  const stamp = page.locator('[data-stamp="moonrise"]');
  await stamp.focus();
  await stamp.press('Escape');

  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(toggle).toBeFocused();
});
