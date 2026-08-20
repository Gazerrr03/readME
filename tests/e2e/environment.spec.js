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

test('both macOS and Windows mount the environment', async ({ page }) => {
  await seedLayout(page, 'macos');
  await page.goto('/');
  await expect(page.locator('[data-macos-environment]')).toHaveCount(1);
  await expect(page.locator('[data-environment-background]')).toHaveCount(1);

  await seedLayout(page, 'windows');
  await page.reload();
  await expect(page.locator('[data-macos-environment]')).toHaveCount(1);
  await expect(page.locator('[data-environment-background]')).toHaveCount(1);
  await expect(page.locator('[data-environment-widgets]')).toHaveCount(1);
});

test('invalid background results retain semantic widgets', async ({ page }) => {
  await page.goto('/?skipBoot=1');
  const results = await page.evaluate(async () => {
    const [{ createDesktopEnvironmentController }, { createI18n }] = await Promise.all([
      import('/scripts/environment/environment-controller.js'),
      import('/scripts/i18n/i18n.js'),
    ]);
    const backgroundResults = [null, { destroy() {} }];

    return backgroundResults.map((backgroundResult) => {
      const root = document.createElement('section');
      document.body.append(root);
      const controller = createDesktopEnvironmentController({
        root,
        i18n: createI18n('en'),
        backgroundFactory: () => backgroundResult,
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
    { fallback: 'background-unavailable', widgets: 1, openTargets: ['projects'], deck: 1, error: null },
    { fallback: 'background-unavailable', widgets: 1, openTargets: ['projects'], deck: 1, error: null },
  ]);
});

test('controller keeps semantic widgets mounted when a wallpaper request fails', async ({ page }) => {
  await page.goto('/?skipBoot=1');
  const result = await page.evaluate(async () => {
    const [{ createDesktopEnvironmentController }, { createI18n }] = await Promise.all([
      import('/scripts/environment/environment-controller.js'),
      import('/scripts/i18n/i18n.js'),
    ]);
    const root = document.createElement('section');
    document.body.append(root);
    const controller = createDesktopEnvironmentController({ root, i18n: createI18n('en') });
    controller.sync({ mode: 'macos' });
    const apply = await controller.applyWallpaper('missing');
    const result = {
      apply,
      widgets: root.querySelectorAll('[data-environment-widgets]').length,
      background: root.querySelector('[data-environment-background]')?.dataset.backgroundId ?? null,
    };
    controller.destroy();
    root.remove();
    return result;
  });

  expect(result).toEqual({
    apply: { ok: false, id: 'missing', error: expect.any(Object) },
    widgets: 1,
    background: 'blue-fluid-halftone',
  });
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
      backgroundFactory: () => null,
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
  await expect(page.locator('[data-bot-mount]')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
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
  const background = page.locator('[data-environment-background]');
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
    outlineColor: 'rgb(185, 215, 255)',
    outlineOffset: '3px',
    outlineStyle: 'solid',
    outlineWidth: '2px',
  });

  await projects.click();
  await expect(page.locator('[data-app-window="projects"]')).toBeVisible();
  await expect(environment).toHaveAttribute('data-environment-motion', 'focused');
  await expect.poll(async () => Number(await background.evaluate(
    (node) => getComputedStyle(node).opacity,
  ))).toBeCloseTo(0.28, 2);
  await expect.poll(async () => projects.evaluate(
    (node) => getComputedStyle(node).boxShadow,
  )).toBe('rgb(2, 8, 17) 1px 1px 0px 0px');
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

test('runtime reduced motion updates the mounted wallpaper transition duration', async ({ page }) => {
  await seedLayout(page, 'macos');
  await page.goto('/');
  const background = page.locator('[data-environment-background]');
  await expect.poll(() => background.evaluate((node) => (
    node.style.getPropertyValue('--wallpaper-transition-duration')
  ))).toBe('180ms');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => background.evaluate((node) => (
    node.style.getPropertyValue('--wallpaper-transition-duration')
  ))).toBe('0ms');
});

test('shader background mounts and remains adaptive while focus state changes', async ({ page }) => {
  await seedLayout(page, 'macos');
  await page.goto('/');
  const background = page.locator('[data-environment-background]');
  await expect(background).toHaveAttribute('data-background-id', 'blue-fluid-halftone');
  await expect(background).toHaveAttribute('data-background-kind', 'shader');
  await expect(background).toHaveAttribute('aria-hidden', 'true');
  await expect(background.locator('[data-wallpaper-surface]')).toHaveCount(1);
  await expect.poll(async () => background.locator('[data-wallpaper-surface]').evaluate((node) => (
    node.tagName === 'CANVAS'
    && node.width > 0
    && node.height > 0
    && (node.dataset.backgroundRenderer === 'webgl2'
      || node.dataset.backgroundFallback === 'shader-unavailable')
  ))).toBe(true);

  await page.locator('[data-environment-open="projects"]').click();
  await expect(page.locator('[data-macos-environment]')).toHaveAttribute('data-environment-motion', 'focused');
  await expect(background).toHaveCSS('opacity', '0.28');
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
