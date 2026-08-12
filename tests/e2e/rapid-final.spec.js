import { test, expect } from '@playwright/test';

const savedPreferences = {
  version: 1,
  bootComplete: true,
  layout: 'windows',
  locale: 'en',
  audioEnabled: false,
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript((preferences) => {
    localStorage.setItem('portfolio-os:preferences', JSON.stringify(preferences));
  }, savedPreferences);
});

test('Settings drives live layout, locale, audio, replay, and BOT status', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');

  await page.locator('[data-app-icon="projects"]').click();
  await expect(page.locator('[data-app-window="projects"] [data-projects-ring]')).toBeVisible();
  await expect(page.locator('[data-app-window="projects"] [data-projects-position]')).toHaveText('01 / 05');
  await page.locator('[data-app-icon="settings"]').click();

  const settings = page.locator('[data-app-window="settings"]');
  await settings.getByLabel('Desktop Layout').selectOption('macos');
  await expect(page.locator('[data-desktop-mode="macos"]')).toBeVisible();
  await expect(settings).toBeVisible();

  await settings.getByLabel('Language').selectOption('zh-CN');
  await expect(page).toHaveTitle('凌晨两点，不存在的频率');
  await expect(page.locator('[data-macos-dock] [data-app-icon="projects"]')).toContainText('项目');
  await expect(page.locator('[data-app-window="projects"] [data-window-title]')).toHaveText('项目');
  await expect(settings.locator('[data-window-title]')).toHaveText('设置');

  await settings.getByLabel('语言').selectOption('ja');
  await expect(page).toHaveTitle('午前二時、存在しない周波数');
  await expect(settings.locator('[data-window-title]')).toHaveText('設定');
  await settings.getByLabel('システム音').check();
  await expect.poll(() => page.evaluate(() => (
    JSON.parse(localStorage.getItem('portfolio-os:preferences')).audioEnabled
  ))).toBe(true);

  await page.locator('[data-bot-standby]').click();
  await expect(page.getByRole('status')).toContainText('BOTサービス：待機中');

  await settings.locator('[data-replay-boot]').click();
  await expect(page.locator('[data-boot-root]')).toBeVisible();
  await page.locator('[data-boot-skip]').click();
  await expect(settings).toBeVisible();
  expect(errors).toEqual([]);
});

test('390x844 opens one usable Settings surface without horizontal overflow', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  await page.locator('[data-app-icon="settings"]').click();
  const settings = page.locator('[data-app-window="settings"]');
  await expect(settings).toBeVisible();
  await expect(settings.getByLabel('Desktop Layout')).toBeVisible();
  await expect.poll(() => page.locator('[data-desktop-root]').evaluate((root) => root.scrollTop)).toBe(0);
  expect((await settings.locator('[data-window-titlebar]').boundingBox()).y).toBeGreaterThanOrEqual(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  expect(errors).toEqual([]);
});
