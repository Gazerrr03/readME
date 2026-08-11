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

test('invalid renderer results mark the canvas unavailable while retaining semantic widgets', async ({ page }) => {
  await page.goto('/?skipBoot=1');
  const results = await page.evaluate(async () => {
    const [{ createDesktopEnvironmentController }, { createI18n }] = await Promise.all([
      import('/scripts/environment/environment-controller.js'),
      import('/scripts/i18n/i18n.js'),
    ]);
    const rendererResults = [null, { destroy() {} }];

    return rendererResults.map((rendererResult) => {
      const root = document.createElement('section');
      document.body.append(root);
      const controller = createDesktopEnvironmentController({
        root,
        i18n: createI18n('en'),
        rendererFactory: () => rendererResult,
      });
      let error = null;
      try {
        controller.sync({ mode: 'macos' });
      } catch (caught) {
        error = caught.message;
      }
      const mount = root.querySelector('[data-macos-environment]');
      const result = {
        fallback: mount?.dataset.environmentFallback ?? null,
        widgets: mount?.querySelectorAll('[data-environment-widgets]').length ?? 0,
        openTargets: [...mount?.querySelectorAll('[data-environment-open]') ?? []]
          .map((node) => node.dataset.environmentOpen),
        error,
      };
      controller.destroy();
      root.remove();
      return result;
    });
  });

  expect(results).toEqual([
    { fallback: 'canvas-unavailable', widgets: 1, openTargets: ['projects', 'writing'], error: null },
    { fallback: 'canvas-unavailable', widgets: 1, openTargets: ['projects', 'writing'], error: null },
  ]);
});

test('instrument cluster has one tall primary and two compact signals', async ({ page }) => {
  await seedLayout(page, 'macos');
  await page.goto('/');
  const primary = page.locator('[data-environment-primary]');
  const now = page.locator('[data-environment-open="projects"]');
  const latest = page.locator('[data-environment-open="writing"]');
  const [primaryBox, nowBox, latestBox] = await Promise.all([
    primary.boundingBox(), now.boundingBox(), latest.boundingBox(),
  ]);
  expect(primaryBox.height).toBeGreaterThan(nowBox.height + latestBox.height);
  expect(nowBox.x).toBeGreaterThan(primaryBox.x);
  expect(latestBox.x).toBe(nowBox.x);
  expect(latestBox.y).toBeGreaterThan(nowBox.y);
});

test('longest non-time reading fits the fixed tablet primary geometry', async ({ page }) => {
  await seedLayout(page, 'macos');
  await page.setViewportSize({ width: 834, height: 1194 });
  await page.goto('/');
  const primary = page.locator('[data-environment-primary]');
  const timeBox = await primary.boundingBox();
  const padding = await primary.evaluate((node) => {
    const style = getComputedStyle(node);
    return { left: style.paddingLeft, right: style.paddingRight };
  });
  expect(timeBox.width).toBe(160);
  expect(padding).toEqual({ left: '12px', right: '12px' });

  await primary.click();
  await expect(primary).toHaveAttribute('data-environment-view', 'weather');
  await expect(primary.locator('[data-environment-reading-value]')).toHaveText('CONDITION / --');
  const weatherBox = await primary.boundingBox();
  const readingSize = await primary.locator('[data-environment-reading-value]').evaluate((node) => ({
    clientWidth: node.clientWidth,
    scrollWidth: node.scrollWidth,
  }));
  expect(weatherBox).toEqual(timeBox);
  expect(readingSize.scrollWidth).toBeLessThanOrEqual(readingSize.clientWidth);
});

test('widget launches apps and visible windows activate focus mode', async ({ page }) => {
  await seedLayout(page, 'macos');
  await page.goto('/');
  await page.locator('[data-environment-open="projects"]').click();
  await expect(page.locator('[data-app-window="projects"]')).toBeVisible();
  await expect(page.locator('[data-macos-environment]')).toHaveAttribute('data-environment-motion', 'focused');
  await page.locator('[data-app-window="projects"] [data-window-minimize]').click();
  await expect(page.locator('[data-macos-environment]')).toHaveAttribute('data-environment-motion', 'running');
  await page.locator('[data-environment-open="writing"]').click();
  await expect(page.locator('[data-app-window="writing"]')).toBeVisible();
});

test('tablet is static with widgets and phone is static without widgets', async ({ page }) => {
  await seedLayout(page, 'macos');
  await page.setViewportSize({ width: 834, height: 1194 });
  await page.goto('/');
  await expect(page.locator('[data-macos-environment]')).toHaveAttribute('data-environment-capability', 'static');
  await expect(page.locator('[data-environment-widgets]')).toHaveCount(1);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('[data-macos-environment]')).toHaveAttribute('data-environment-capability', 'phone-static');
  await expect(page.locator('[data-environment-widgets]')).toHaveCount(0);
});

test('reduced motion renders static environment with widgets at desktop width', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await seedLayout(page, 'macos');
  await page.goto('/');
  await expect(page.locator('[data-macos-environment]')).toHaveAttribute('data-environment-capability', 'static');
  await expect(page.locator('[data-environment-widgets]')).toHaveCount(1);
});
