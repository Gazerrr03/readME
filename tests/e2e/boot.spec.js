import { test, expect } from '@playwright/test';

test('first visit shows English boot and skip persists completion', async ({ page }) => {
  await page.goto('/?skipBoot=1');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/');
  await expect(page.locator('[data-boot-root]')).toBeVisible();
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
