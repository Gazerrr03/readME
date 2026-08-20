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
  await expect(page.locator('[data-environment-background]')).toHaveAttribute('data-background-id', 'flow-shards');
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
