import { test, expect } from '@playwright/test';

test('deep indigo tokens are exposed and blueprint overlays are inactive', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('portfolio-os:preferences', JSON.stringify({
    version: 1,
    bootComplete: true,
    layout: 'windows',
    locale: 'en',
    audioEnabled: false,
  })));
  await page.goto('/?skipBoot=1');

  const result = await page.evaluate(() => {
    const root = document.querySelector('[data-desktop-root]');
    const tokens = getComputedStyle(document.documentElement);
    return {
      canvas: tokens.getPropertyValue('--os-canvas').trim(),
      surface: tokens.getPropertyValue('--os-surface').trim(),
      accent: tokens.getPropertyValue('--os-accent').trim(),
      skin: root.dataset.osSkin,
      beforeOpacity: getComputedStyle(root, '::before').opacity,
      afterOpacity: getComputedStyle(root, '::after').opacity,
    };
  });

  expect(result).toEqual({
    canvas: '#071426',
    surface: '#0E2340',
    accent: '#748BFF',
    skin: 'windows',
    beforeOpacity: '0',
    afterOpacity: '0',
  });
});

test('boot surface and browser chrome use the deep indigo entry palette', async ({ page }) => {
  await page.goto('/?skipBoot=1');

  const result = await page.evaluate(() => {
    const boot = document.querySelector('[data-boot-root]');
    const panel = document.querySelector('[data-boot-panel]');
    return {
      themeColor: document.querySelector('meta[name="theme-color"]').content,
      bootBackground: getComputedStyle(boot).backgroundColor,
      bootColor: getComputedStyle(boot).color,
      panelBackground: getComputedStyle(panel).backgroundColor,
      panelShadow: getComputedStyle(panel).boxShadow,
    };
  });

  expect(result).toEqual({
    themeColor: '#071426',
    bootBackground: 'rgb(7, 20, 38)',
    bootColor: 'rgb(242, 246, 255)',
    panelBackground: 'rgb(14, 35, 64)',
    panelShadow: expect.stringContaining('rgb(2, 8, 17)'),
  });
});
