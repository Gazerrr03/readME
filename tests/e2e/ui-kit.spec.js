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

test('windows and selected icons use retro hardware surfaces', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('portfolio-os:preferences', JSON.stringify({
    version: 1,
    bootComplete: true,
    layout: 'windows',
    locale: 'en',
    audioEnabled: false,
  })));
  await page.goto('/?skipBoot=1');
  await page.locator('[data-windows-icons] [data-app-icon="projects"]').dblclick();
  await expect.poll(() => page.locator('[data-windows-icons] [data-app-icon="projects"] [data-icon]')
    .evaluate((element) => getComputedStyle(element).backgroundColor)).toBe('rgb(116, 139, 255)');

  const values = await page.evaluate(() => {
    const appWindow = document.querySelector('[data-app-window="projects"]');
    const icon = document.querySelector('[data-windows-icons] [data-app-icon="projects"] [data-icon]');
    const selectedLabel = document.querySelector('[data-windows-icons] [data-app-icon="projects"] [data-app-label]');
    return {
      windowBackground: getComputedStyle(appWindow).backgroundColor,
      windowRadius: getComputedStyle(appWindow).borderRadius,
      windowShadow: getComputedStyle(appWindow).boxShadow,
      selected: document.querySelector('[data-windows-icons] [data-app-icon="projects"]').dataset.selected,
      iconBackground: getComputedStyle(icon).backgroundColor,
      iconRadius: getComputedStyle(icon).borderRadius,
      labelBackground: getComputedStyle(selectedLabel).backgroundColor,
    };
  });

  expect(values.windowBackground).toBe('rgb(14, 35, 64)');
  expect(values.windowRadius).toBe('0px');
  expect(values.windowShadow).toContain('rgb(2, 8, 17)');
  expect(values.selected).toBe('true');
  expect(values.iconBackground).toBe('rgb(116, 139, 255)');
  expect(values.iconRadius).toBe('0px');
  expect(values.labelBackground).toBe('rgb(116, 139, 255)');
});

test('folder launchers expose the shared bright focus ring', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('portfolio-os:preferences', JSON.stringify({
    version: 1,
    bootComplete: true,
    layout: 'windows',
    locale: 'en',
    audioEnabled: false,
  })));
  await page.goto('/?skipBoot=1');

  const focus = await page.locator('[data-folder-toggle="photos"]').evaluate((element) => {
    element.focus();
    const style = getComputedStyle(element);
    return { outlineColor: style.outlineColor, outlineWidth: style.outlineWidth };
  });

  expect(focus).toEqual({ outlineColor: 'rgb(185, 215, 255)', outlineWidth: '2px' });
});

test('macOS and Windows expose the same workstation layer with different chrome', async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('portfolio-os:preferences')) {
      localStorage.setItem('portfolio-os:preferences', JSON.stringify({
        version: 1,
        bootComplete: true,
        layout: 'macos',
        locale: 'en',
        audioEnabled: false,
      }));
    }
  });
  await page.goto('/?skipBoot=1');

  const mac = await page.evaluate(() => ({
    skin: document.querySelector('[data-desktop-root]').dataset.osSkin,
    workstation: document.querySelector('[data-workstation-environment]')?.dataset.workstationEnvironment,
    menu: Boolean(document.querySelector('[data-macos-menu]')),
    dock: Boolean(document.querySelector('[data-macos-dock]')),
    widgets: document.querySelectorAll('[data-environment-widgets]').length,
    menuSurface: getComputedStyle(document.querySelector('[data-macos-menu]')).backgroundColor,
    widgetSurface: getComputedStyle(document.querySelector('[data-environment-primary]')).backgroundColor,
  }));

  expect(mac).toEqual({
    skin: 'macos',
    workstation: '',
    menu: true,
    dock: true,
    widgets: 1,
    menuSurface: 'rgb(26, 46, 70)',
    widgetSurface: 'rgb(26, 46, 70)',
  });

  await page.evaluate(() => {
    const preferences = JSON.parse(localStorage.getItem('portfolio-os:preferences'));
    preferences.layout = 'windows';
    localStorage.setItem('portfolio-os:preferences', JSON.stringify(preferences));
  });
  await page.reload();

  await expect(page.locator('[data-desktop-root]')).toHaveAttribute('data-os-skin', 'windows');
  await expect(page.locator('[data-windows-taskbar]')).toBeVisible();
  await expect(page.locator('[data-windows-taskbar] [data-system-status]')).toBeVisible();
  await expect(page.locator('[data-workstation-environment]')).toHaveCount(1);
  await expect(page.locator('[data-environment-widgets]')).toHaveCount(1);
  await expect.poll(() => page.locator('[data-windows-taskbar]')
    .evaluate((element) => getComputedStyle(element).backgroundColor)).toBe('rgb(26, 46, 70)');
  await expect.poll(() => page.locator('[data-environment-primary]')
    .evaluate((element) => getComputedStyle(element).backgroundColor)).toBe('rgb(26, 46, 70)');
});

test('settings does not expose blueprint display controls', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('portfolio-os:preferences', JSON.stringify({
    version: 1,
    bootComplete: true,
    layout: 'windows',
    locale: 'en',
    audioEnabled: false,
  })));
  await page.goto('/?skipBoot=1');
  await page.locator('[data-windows-icons] [data-app-icon="settings"]').dblclick();
  const settings = page.locator('[data-app-window="settings"]');

  await expect(settings.locator('[data-settings-section="display"]')).toHaveCount(0);
  await expect(settings.locator('[data-settings-section]')).toHaveCount(3);
  await expect(settings.locator('input[name="gridDensity"]')).toHaveCount(0);
  await expect(settings.locator('select[name="syncFrequency"]')).toHaveCount(0);
  await expect(settings.locator('select[name="postProcessFilter"]')).toHaveCount(0);
  await expect(settings.locator('input[name="ditherOverlay"]')).toHaveCount(0);
  await expect(settings.locator('input[name="moireInterference"]')).toHaveCount(0);
  await expect(settings.locator('input[name="aliasedEdges"]')).toHaveCount(0);
});
