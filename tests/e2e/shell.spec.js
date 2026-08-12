import { test, expect } from '@playwright/test';

test('loads the portfolio OS shell with the English title', async ({ page }) => {
  await page.goto('/?skipBoot=1');
  await expect(page).toHaveTitle('Two A.M., A Frequency That Does Not Exist');
  await expect(page.locator('[data-system-shell]')).toBeVisible();
  await expect(page.locator('[data-desktop-root]')).toBeVisible();
});

test('provides reusable icon markup with selected inverted artwork', async ({ page }) => {
  await page.goto('/?skipBoot=1');

  const result = await page.evaluate(() => {
    const template = document.querySelector('[data-app-icon-template]');
    const iconValues = [...template.content.querySelectorAll('[data-icon]')]
      .map((icon) => icon.dataset.icon);
    const icon = template.content.querySelector('[data-app-icon="writing"]');
    const defaultState = {
      pressed: icon.getAttribute('aria-pressed'),
      selected: icon.dataset.selected,
      hasAriaSelected: icon.hasAttribute('aria-selected'),
    };
    const clone = icon.cloneNode(true);
    clone.setAttribute('aria-pressed', 'true');
    clone.dataset.selected = 'true';
    document.querySelector('[data-desktop-root]').append(clone);

    const glyph = clone.querySelector('[data-icon]');
    const artworkSvg = glyph.querySelector('svg');
    return {
      iconValues,
      defaultState,
      hasSharedButton: clone.matches('button[data-app-icon]'),
      hasLabel: Boolean(clone.querySelector('[data-app-label]')),
      frame: getComputedStyle(glyph).backgroundColor,
      artwork: getComputedStyle(artworkSvg).fill,
      pixelGrid: artworkSvg.getAttribute('viewBox'),
      crisp: getComputedStyle(artworkSvg).shapeRendering,
    };
  });

  expect(result.iconValues).toEqual(['folder', 'document', 'identity', 'signal', 'controls']);
  expect(result.defaultState).toEqual({
    pressed: 'false',
    selected: 'false',
    hasAriaSelected: false,
  });
  expect(result.hasSharedButton).toBe(true);
  expect(result.hasLabel).toBe(true);
  expect(result.frame).toBe('rgb(255, 180, 84)');
  expect(result.artwork).toBe('rgb(10, 25, 47)');
  expect(result.pixelGrid).toBe('0 0 16 16');
  expect(result.crisp).toBe('crispedges');
});
