import { test, expect } from '@playwright/test';

test('first visit shows English boot and skip persists completion', async ({ page }) => {
  await page.goto('/?skipBoot=1');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/');
  await expect(page.locator('[data-boot-root]')).toBeVisible();
  await expect(page.locator('[data-desktop-root]')).toBeHidden();
  await expect(page.getByText('Two A.M., A Frequency That Does Not Exist')).toBeVisible();
  await page.getByRole('button', { name: 'Skip boot' }).click();
  await expect(page.locator('[data-desktop-root]')).toBeVisible();
  await page.reload();
  await expect(page.locator('[data-boot-root]')).toBeHidden();
});

test('reduced motion exposes the final boot state immediately', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByText('BOT [OK]')).toBeVisible();
});

test('test bypass reveals the desktop without persisting boot completion', async ({ page }) => {
  await page.goto('/?skipBoot=1');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator('[data-desktop-root]')).toBeVisible();
  await expect.poll(() => page.evaluate(() => localStorage.length)).toBe(0);

  await page.goto('/');
  await expect(page.locator('[data-boot-root]')).toBeVisible();
});

test('replay resets boot in the current locale and hides the desktop', async ({ page }) => {
  await page.goto('/?skipBoot=1');
  await page.evaluate(async () => {
    const { i18n, replayBoot } = await import('/scripts/main.js');
    i18n.setLocale('zh-CN');
    replayBoot();
  });

  await expect(page.locator('[data-desktop-root]')).toBeHidden();
  await expect(page.getByText('凌晨两点，不存在的频率')).toBeVisible();
  await expect(page.getByRole('button', { name: '跳过启动' })).toBeVisible();
  await expect(page.locator('[data-boot-status]')).toHaveAttribute('aria-label', '正在启动');
  await expect(page.locator('[data-boot-step="projects"]')).toHaveAttribute('data-status', 'pending');
  await expect(page.getByText('项目 [··]')).toBeVisible();
});

test('natural completion shows the exit phase before revealing and persisting', async ({ page }) => {
  await page.goto('/?skipBoot=1');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/');

  const boot = page.locator('[data-boot-root]');
  await expect(boot).toHaveAttribute('data-phase', 'running');
  await expect(page.locator('[data-desktop-root]')).toBeHidden();
  await expect(boot).toHaveAttribute('data-phase', 'exiting', { timeout: 5500 });
  const dither = page.locator('[data-boot-dither]');
  await expect(dither).toBeVisible();
  await expect.poll(() => dither.evaluate((element) => (
    Number(getComputedStyle(element).opacity)
  ))).toBeGreaterThan(0);
  await expect(boot).toHaveAttribute('data-phase', 'complete');
  await expect(page.locator('[data-desktop-root]')).toBeVisible();
  await expect.poll(() => page.evaluate(() => (
    JSON.parse(localStorage.getItem('portfolio-os:preferences')).bootComplete
  ))).toBe(true);
});

test('open query restores the requested desktop app and survives refresh', async ({ page }) => {
  await page.goto('/?skipBoot=1&open=writing');
  await expect(page.locator('[data-app-window="writing"]')).toBeVisible();
  await expect(page).toHaveURL(/open=writing/);

  await page.reload();
  await expect(page.locator('[data-app-window="writing"]')).toBeVisible();
  await expect(page).toHaveURL(/open=writing/);
});

test('unsupported open query does not launch an app', async ({ page }) => {
  await page.goto('/?skipBoot=1&open=settings');
  await expect(page.locator('[data-app-window]')).toHaveCount(0);
});
