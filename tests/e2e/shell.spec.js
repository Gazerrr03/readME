import { test, expect } from '@playwright/test';

test('loads the portfolio OS shell with the English title', async ({ page }) => {
  await page.goto('/?skipBoot=1');
  await expect(page).toHaveTitle('Two A.M., A Frequency That Does Not Exist');
  await expect(page.locator('[data-system-shell]')).toBeVisible();
  await expect(page.locator('[data-desktop-root]')).toBeVisible();
});
