import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('portfolio-os:preferences', JSON.stringify({
    version: 1,
    bootComplete: true,
    layout: 'windows',
    locale: 'en',
    audioEnabled: false,
  })));
  await page.goto('/');
});

test('opens one placeholder window and restores it from the taskbar', async ({ page }) => {
  await page.locator('[data-app-icon="projects"]').dblclick();
  await page.locator('[data-app-icon="projects"]').dblclick();

  const appWindow = page.locator('[data-app-window="projects"]');
  await expect(appWindow).toHaveCount(1);
  await expect(appWindow.locator('[data-window-title]')).toHaveText('Projects');

  await appWindow.locator('[data-window-minimize]').click();
  await expect(appWindow).toBeHidden();
  await expect(page.locator('[data-running-app="projects"]:visible')).toHaveAttribute('data-minimized', 'true');

  await page.locator('[data-windows-taskbar] [data-running-app="projects"]').click();
  await expect(appWindow).toBeVisible();
  await expect(page.locator('[data-running-app="projects"]:visible')).toHaveAttribute('data-minimized', 'false');
});

test('focuses an existing window and close removes its running entry', async ({ page }) => {
  await page.locator('[data-app-icon="projects"]').dblclick();
  await page.locator('[data-app-icon="writing"]').dblclick();

  const projects = page.locator('[data-app-window="projects"]');
  const writing = page.locator('[data-app-window="writing"]');
  const before = await writing.evaluate((element) => Number(element.style.zIndex));
  await projects.locator('[data-window-titlebar]').click({ position: { x: 8, y: 8 } });
  await expect.poll(() => projects.evaluate((element) => Number(element.style.zIndex))).toBeGreaterThan(before);

  await projects.locator('[data-window-close]').click();
  await expect(projects).toHaveCount(0);
  await expect(page.locator('[data-running-app="projects"]')).toHaveCount(0);
});

test('dragging the title bar moves the window and keeps it reachable', async ({ page }) => {
  await page.locator('[data-app-icon="projects"]').dblclick();
  const appWindow = page.locator('[data-app-window="projects"]');
  const titleBar = appWindow.locator('[data-window-titlebar]');
  const before = await appWindow.boundingBox();

  await titleBar.dragTo(page.locator('[data-windows-taskbar] [data-system-title]'));
  const after = await appWindow.boundingBox();

  expect(after.x).not.toBe(before.x);
  expect(after.y).toBeLessThanOrEqual(900 - 48 - 32);
});
