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
        deck: mount?.querySelectorAll('[data-environment-deck]').length ?? 0,
        error,
      };
      controller.destroy();
      root.remove();
      return result;
    });
  });

  expect(results).toEqual([
    { fallback: 'canvas-unavailable', widgets: 1, openTargets: ['projects'], deck: 1, error: null },
    { fallback: 'canvas-unavailable', widgets: 1, openTargets: ['projects'], deck: 1, error: null },
  ]);
});

test('mounted controller refreshes compact labels when i18n changes', async ({ page }) => {
  await page.goto('/?skipBoot=1');
  const snapshots = await page.evaluate(async () => {
    const [{ createDesktopEnvironmentController }, { createI18n }] = await Promise.all([
      import('/scripts/environment/environment-controller.js'),
      import('/scripts/i18n/i18n.js'),
    ]);
    const root = document.createElement('section');
    document.body.append(root);
    const i18n = createI18n('en');
    const controller = createDesktopEnvironmentController({
      root,
      i18n,
      rendererFactory: () => null,
    });
    controller.sync({ mode: 'macos' });
    const widgets = root.querySelector('[data-environment-widgets]');
    const snapshot = () => {
      const now = widgets.querySelector('[data-environment-open="projects"]');
      const deck = widgets.querySelector('[data-environment-deck]');
      return {
        now: now.querySelector('span').textContent,
        nowLabel: now.getAttribute('aria-label'),
        deckMark: deck.querySelector('[data-deck-mark]').textContent,
        deckToggle: deck.querySelector('[data-deck-toggle]').getAttribute('aria-label'),
        deckNext: deck.querySelector('[data-deck-next]').getAttribute('aria-label'),
      };
    };
    const result = [snapshot()];
    i18n.setLocale('zh-CN');
    result.push(snapshot());
    i18n.setLocale('ja');
    result.push(snapshot());
    controller.destroy();
    root.remove();
    return result;
  });

  expect(snapshots).toEqual([
    { now: 'NOW', nowLabel: 'Open Projects', deckMark: 'DECK', deckToggle: 'Play', deckNext: 'Next track' },
    { now: '当前', nowLabel: '打开项目', deckMark: '唱机', deckToggle: '播放', deckNext: '下一曲' },
    { now: '現在', nowLabel: 'プロジェクトを開く', deckMark: 'デッキ', deckToggle: '再生', deckNext: '次の曲' },
  ]);
});

test('instrument cluster has one tall primary and two compact signals', async ({ page }) => {
  await seedLayout(page, 'macos');
  await page.goto('/');
  const primary = page.locator('[data-environment-primary]');
  const now = page.locator('[data-environment-open="projects"]');
  const deck = page.locator('[data-environment-deck]');
  const [primaryBox, nowBox, deckBox] = await Promise.all([
    primary.boundingBox(), now.boundingBox(), deck.boundingBox(),
  ]);
  expect(primaryBox.height).toBeGreaterThan(nowBox.height + deckBox.height);
  expect(nowBox.x).toBeGreaterThan(primaryBox.x);
  expect(deckBox.x).toBe(nowBox.x);
  expect(deckBox.y).toBeGreaterThan(nowBox.y);
});

test('desktop instrument geometry exactly fills its two-column grid', async ({ page }) => {
  await seedLayout(page, 'macos');
  await page.goto('/');
  const widgets = page.locator('[data-environment-widgets]');
  const primary = page.locator('[data-environment-primary]');
  const now = page.locator('[data-environment-open="projects"]');
  const deck = page.locator('[data-environment-deck]');
  const [widgetsBox, primaryBox, nowBox, deckBox] = await Promise.all([
    widgets.boundingBox(), primary.boundingBox(), now.boundingBox(), deck.boundingBox(),
  ]);

  expect({ width: widgetsBox.width, height: widgetsBox.height }).toEqual({ width: 312, height: 168 });
  expect({ width: primaryBox.width, height: primaryBox.height }).toEqual({ width: 176, height: 168 });
  expect({ width: nowBox.width, height: nowBox.height }).toEqual({ width: 128, height: 80 });
  expect({ width: deckBox.width, height: deckBox.height }).toEqual({ width: 128, height: 80 });
  expect(nowBox.x - (primaryBox.x + primaryBox.width)).toBe(8);
  expect(deckBox.y - (nowBox.y + nowBox.height)).toBe(8);
  await expect(page.locator('[data-bot-mount]')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
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

test('all localized readings stay inside the tablet instrument geometry', async ({ page }) => {
  for (const locale of ['en', 'zh-CN', 'ja']) {
    await seedLayout(page, 'macos', locale);
    await page.setViewportSize({ width: 834, height: 1194 });
    await page.goto('/');
    const primary = page.locator('[data-environment-primary]');
    const initialBox = await primary.boundingBox();
    for (const view of ['time', 'weather', 'tide-wind']) {
      await expect(primary).toHaveAttribute('data-environment-view', view);
      const reading = await primary.evaluate((node) => ({
        clientHeight: node.clientHeight,
        clientWidth: node.clientWidth,
        scrollHeight: node.scrollHeight,
        scrollWidth: node.scrollWidth,
      }));
      expect(reading.scrollWidth).toBeLessThanOrEqual(reading.clientWidth);
      expect(reading.scrollHeight).toBeLessThanOrEqual(reading.clientHeight);
      expect(await primary.boundingBox()).toEqual(initialBox);
      await primary.click();
    }
  }
});

test('runtime locale changes refresh compact widget labels and accessible names', async ({ page }) => {
  await seedLayout(page, 'macos');
  await page.goto('/');
  const now = page.locator('[data-environment-open="projects"]');
  const deck = page.locator('[data-environment-deck]');

  await expect(now.locator('span')).toHaveText('NOW');
  await expect(now).toHaveAttribute('aria-label', 'Open Projects');
  await expect(deck.locator('[data-deck-mark]')).toHaveText('DECK');
  await expect(deck.locator('[data-deck-toggle]')).toHaveAttribute('aria-label', 'Play');

  await page.locator('[data-macos-menu] [data-locale="zh-CN"]').click();
  await expect(now.locator('span')).toHaveText('当前');
  await expect(now).toHaveAttribute('aria-label', '打开项目');
  await expect(deck.locator('[data-deck-mark]')).toHaveText('唱机');
  await expect(deck.locator('[data-deck-toggle]')).toHaveAttribute('aria-label', '播放');

  await page.locator('[data-macos-menu] [data-locale="ja"]').click();
  await expect(now.locator('span')).toHaveText('現在');
  await expect(now).toHaveAttribute('aria-label', 'プロジェクトを開く');
  await expect(deck.locator('[data-deck-mark]')).toHaveText('デッキ');
  await expect(deck.locator('[data-deck-toggle]')).toHaveAttribute('aria-label', '再生');
});

test('widget launches apps and visible windows activate focus mode', async ({ page }) => {
  await seedLayout(page, 'macos');
  await page.goto('/');
  const environment = page.locator('[data-macos-environment]');
  const canvas = page.locator('[data-environment-canvas]');
  const primary = page.locator('[data-environment-primary]');
  const projects = page.locator('[data-environment-open="projects"]');
  const secondaryLabel = projects.locator('span');

  await page.keyboard.press('Tab');
  await expect(primary).toBeFocused();
  expect(await primary.evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      focusVisible: node.matches(':focus-visible'),
      outlineColor: style.outlineColor,
      outlineOffset: style.outlineOffset,
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
    };
  })).toEqual({
    focusVisible: true,
    outlineColor: 'rgb(255, 255, 255)',
    outlineOffset: '3px',
    outlineStyle: 'solid',
    outlineWidth: '2px',
  });

  await projects.click();
  await expect(page.locator('[data-app-window="projects"]')).toBeVisible();
  await expect(environment).toHaveAttribute('data-environment-motion', 'focused');
  await expect.poll(async () => Number(await canvas.evaluate(
    (node) => getComputedStyle(node).opacity,
  ))).toBeCloseTo(0.28, 2);
  await expect.poll(async () => projects.evaluate(
    (node) => getComputedStyle(node).boxShadow,
  )).toBe('rgb(255, 255, 255) 1px 1px 0px 0px');
  await expect.poll(async () => Number(await secondaryLabel.evaluate(
    (node) => getComputedStyle(node).opacity,
  ))).toBeCloseTo(0.7, 2);
  await page.locator('[data-app-window="projects"] [data-window-mac-minimize]').click();
  await expect(environment).toHaveAttribute('data-environment-motion', 'running');
});

test('music deck toggles playback and advances tracks', async ({ page }) => {
  await seedLayout(page, 'macos');
  await page.goto('/');
  const deck = page.locator('[data-environment-deck]');
  await expect(deck).toHaveAttribute('data-deck-status', 'idle');
  await expect(deck.locator('[data-deck-next]')).toHaveText('TRK 01/03 ›');
  await expect(deck.locator('[data-deck-title]')).toHaveText('TIDE STUDY 0200');

  await deck.locator('[data-deck-toggle]').click();
  await expect(deck).toHaveAttribute('data-deck-status', 'playing');
  await expect(deck.locator('[data-deck-glyph]')).toHaveText('■');
  await expect(deck.locator('[data-deck-toggle]')).toHaveAttribute('aria-label', 'Pause');

  await deck.locator('[data-deck-toggle]').click();
  await expect(deck).toHaveAttribute('data-deck-status', 'paused');

  await deck.locator('[data-deck-next]').click();
  await expect(deck.locator('[data-deck-next]')).toHaveText('TRK 02/03 ›');
  await expect(deck.locator('[data-deck-title]')).toHaveText('PAPER CHANNELS');
  await expect(deck).toHaveAttribute('data-deck-status', 'idle');
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

test('animated canvas is nonblank, advances while idle, and freezes in focus mode', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await seedLayout(page, 'macos');
  await page.goto('/');
  const canvas = page.locator('[data-environment-canvas]');
  const sample = () => canvas.evaluate((node) => {
    const pixels = node.getContext('2d').getImageData(0, 0, node.width, node.height).data;
    let digest = 2166136261;
    let white = 0;
    let ink = 0;
    for (let index = 0; index < pixels.length; index += 16) {
      const red = pixels[index];
      const green = pixels[index + 1];
      const blueChannel = pixels[index + 2];
      digest = Math.imul(digest ^ red, 16777619);
      digest = Math.imul(digest ^ green, 16777619);
      digest = Math.imul(digest ^ blueChannel, 16777619);
      if (red > 245 && green > 245 && blueChannel > 245) white += 1;
      if (red < 252 || green < 252 || blueChannel < 252) ink += 1;
    }
    return { white, ink, digest: digest >>> 0 };
  });

  const first = await sample();
  await page.waitForTimeout(350);
  const running = await sample();
  expect(first.white).toBeGreaterThan(100);
  expect(first.ink).toBeGreaterThan(10);
  expect(running.digest).not.toBe(first.digest);

  await page.locator('[data-environment-open="projects"]').click();
  await expect(page.locator('[data-macos-environment]')).toHaveAttribute('data-environment-motion', 'focused');
  const focused = await sample();
  await page.waitForTimeout(350);
  expect((await sample()).digest).toBe(focused.digest);
  expect(errors).toEqual([]);
});

test('phone dock stays fully visible and contains all application icons', async ({ page }) => {
  await seedLayout(page, 'macos');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const result = await page.locator('[data-macos-dock]').evaluate((dock) => {
    const bounds = dock.getBoundingClientRect();
    return {
      bottom: bounds.bottom,
      iconCount: dock.querySelectorAll('[data-app-icon]').length,
      maxLabelHeight: Math.max(...[...dock.querySelectorAll('[data-app-label]')]
        .map((label) => label.getBoundingClientRect().height)),
      left: bounds.left,
      right: bounds.right,
      width: bounds.width,
    };
  });
  expect(result.iconCount).toBe(5);
  expect(result.width).toBeGreaterThanOrEqual(340);
  expect(result.maxLabelHeight).toBeLessThanOrEqual(16);
  expect(result.left).toBeGreaterThanOrEqual(0);
  expect(result.right).toBeLessThanOrEqual(390);
  expect(result.bottom).toBeLessThanOrEqual(844);
});
