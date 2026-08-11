import { test, expect } from '@playwright/test';

async function seedLayout(page, layout, locale = 'en') {
  await page.addInitScript(({ layout: selectedLayout, locale: selectedLocale }) => {
    localStorage.setItem('portfolio-os:preferences', JSON.stringify({
      version: 1,
      bootComplete: true,
      layout: selectedLayout,
      locale: selectedLocale,
      audioEnabled: false,
    }));
  }, { layout, locale });
}

test('macOS mounts the environment while Windows mounts neither environment element', async ({ page }) => {
  await seedLayout(page, 'macos');
  await page.goto('/');
  await expect(page.locator('[data-macos-environment]')).toHaveCount(1);
  await expect(page.locator('[data-environment-canvas]')).toHaveCount(1);

  await seedLayout(page, 'windows');
  await page.reload();
  await expect(page.locator('[data-macos-environment]')).toHaveCount(0);
  await expect(page.locator('[data-environment-widgets]')).toHaveCount(0);
});
