import { test, expect } from '@playwright/test';

test('edits Chinese while generated locales remain read only', async ({ page }) => {
  await page.route('**/api/translate', (route) => route.fulfill({
    json: {
      translations: [{
        id: 'ui.site.title',
        values: { en: 'A New Two A.M.', ja: '新しい午前二時' },
      }],
    },
  }));
  await page.goto('/writing/');
  await expect(page.locator('[data-writing-review]')).toBeVisible();
  await page.locator('[data-field-search]').fill('site.title');
  await page.locator('[data-field-nav="ui.site.title"]').click();
  const editor = page.locator('[data-field-id="ui.site.title"]');
  await editor.locator('[data-source-input]').fill('新的凌晨两点');
  await expect(editor.locator('[data-locale-value="en"]')).toHaveAttribute('readonly', '');
  await expect(page.locator('[data-save-status]')).toContainText('已保存');
  await expect(editor.locator('[data-locale-value="en"]')).toHaveValue('A New Two A.M.');
  await expect(editor.locator('[data-locale-value="ja"]')).toHaveValue('新しい午前二時');
});

test('mobile review mode switches between editor and preview without overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/writing/');
  await expect(page.getByRole('tab', { name: '编辑' })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('tab', { name: '预览' }).click();
  await expect(page.locator('iframe[title="站点交互预览"]')).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  expect(overflow).toBe(false);
});
