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
