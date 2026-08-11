import { test, expect } from '@playwright/test';

test('loads the portfolio OS shell with the English title', async ({ page }) => {
  await page.goto('/?skipBoot=1');
  await expect(page).toHaveTitle('Two A.M., A Frequency That Does Not Exist');
  await expect(page.locator('[data-system-shell]')).toBeVisible();
  await expect(page.locator('[data-desktop-root]')).toBeVisible();
});

test('provides reusable icon markup with selected white artwork', async ({ page }) => {
  await page.goto('/?skipBoot=1');

  const result = await page.evaluate(() => {
    const template = document.querySelector('[data-app-icon-template]');
    const iconValues = [...template.content.querySelectorAll('[data-icon]')]
      .map((icon) => icon.dataset.icon);
    const icon = template.content.querySelector('[data-app-icon="writing"]');
    const clone = icon.cloneNode(true);
    clone.setAttribute('aria-selected', 'true');
    document.querySelector('[data-desktop-root]').append(clone);

    const glyph = clone.querySelector('[data-icon]');
    return {
      iconValues,
      hasSharedButton: clone.matches('button[data-app-icon]'),
      hasLabel: Boolean(clone.querySelector('[data-app-label]')),
      frame: getComputedStyle(glyph).backgroundColor,
      artwork: getComputedStyle(glyph).color,
      border: getComputedStyle(glyph, '::before').borderTopColor,
      lines: getComputedStyle(glyph, '::after').backgroundColor,
    };
  });

  expect(result.iconValues).toEqual(['folder', 'document', 'identity', 'signal', 'controls']);
  expect(result.hasSharedButton).toBe(true);
  expect(result.hasLabel).toBe(true);
  expect(result.frame).toBe('rgb(38, 21, 154)');
  expect(result.artwork).toBe('rgb(255, 255, 255)');
  expect(result.border).toBe('rgb(255, 255, 255)');
  expect(result.lines).toBe('rgb(255, 255, 255)');
});
