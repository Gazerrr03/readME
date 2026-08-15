import { test, expect } from '@playwright/test';

async function seedLayout(page, layout) {
  await page.addInitScript((selectedLayout) => {
    localStorage.setItem('portfolio-os:preferences', JSON.stringify({
      version: 1,
      bootComplete: true,
      layout: selectedLayout,
      locale: 'en',
      audioEnabled: false,
    }));
  }, layout);
}

async function mountDesktopController(page, { coarse = false, layout = 'windows' } = {}) {
  await page.goto('/?skipBoot=1');
  await page.evaluate(async ({ useCoarsePointer, selectedLayout }) => {
    const nativeMatchMedia = window.matchMedia.bind(window);
    window.matchMedia = (query) => (
      query === '(pointer: coarse)'
        ? { matches: useCoarsePointer }
        : nativeMatchMedia(query)
    );
    const [{ createDesktopController }, { getApps }, { createI18n }, { DEFAULT_PREFERENCES }] = await Promise.all([
      import('/scripts/desktop.js'),
      import('/modules/app-registry.js'),
      import('/scripts/i18n/i18n.js'),
      import('/scripts/state/preferences.js'),
    ]);
    const root = document.createElement('section');
    root.dataset.testDesktop = '';
    document.body.append(root);
    window.testOpenCalls = [];
    window.testRenderModes = [];
    window.testDesktop = createDesktopController({
      root,
      apps: getApps(),
      i18n: createI18n('en'),
      preferences: {
        ...DEFAULT_PREFERENCES,
        layout: selectedLayout,
        locale: 'en',
        audioEnabled: false,
      },
      onOpen: (appId) => window.testOpenCalls.push(appId),
      onRender: ({ mode }) => window.testRenderModes.push(mode),
    });
    window.testDesktop.render();
  }, { useCoarsePointer: coarse, selectedLayout: layout });
  return page.locator('[data-test-desktop]');
}

test('Windows mode shows five desktop icons and the taskbar', async ({ page }) => {
  await seedLayout(page, 'windows');
  await page.goto('/');
  await expect(page.locator('[data-desktop-mode="windows"]')).toBeVisible();
  await expect(page.locator('[data-windows-icons] [data-app-icon]')).toHaveCount(5);
  await expect(page.locator('[data-windows-taskbar]')).toBeVisible();
});

test('macOS mode shows the menu bar and Dock', async ({ page }) => {
  await seedLayout(page, 'macos');
  await page.goto('/');
  await expect(page.locator('[data-desktop-mode="macos"]')).toBeVisible();
  await expect(page.locator('[data-macos-menu]')).toBeVisible();
  await expect(page.locator('[data-macos-dock]')).toBeVisible();
  await expect(page.locator('[data-desktop-folders] [data-folder-toggle]')).toHaveCount(4);
  await expect(page.locator('[data-macos-dock] [data-app-icon]')).toHaveCount(5);
});

test('desktop render hook reports the active layout after chrome is mounted', async ({ page }) => {
  await mountDesktopController(page, { layout: 'macos' });
  await expect.poll(() => page.evaluate(() => window.testRenderModes)).toEqual(['macos']);
});

test('explicit layout wins and auto layout follows the platform', async ({ page }) => {
  await page.goto('/?skipBoot=1');
  const modes = await page.evaluate(async () => {
    const { detectDesktopMode } = await import('/scripts/desktop.js');
    return {
      explicit: detectDesktopMode({ platform: 'MacIntel' }, 'windows'),
      mac: detectDesktopMode({ platform: 'MacIntel' }, 'auto'),
      other: detectDesktopMode({ platform: 'Linux', userAgent: 'Example' }, 'auto'),
    };
  });

  expect(modes).toEqual({ explicit: 'windows', mac: 'macos', other: 'windows' });
});

test('system chrome includes localized title, language, audio, and BOT status', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('portfolio-os:preferences', JSON.stringify({
      version: 1,
      bootComplete: true,
      layout: 'windows',
      locale: 'zh-CN',
      audioEnabled: true,
    }));
  });
  await page.goto('/');
  const taskbar = page.locator('[data-windows-taskbar]');

  await expect(taskbar.locator('[data-system-title]')).toHaveText('凌晨两点，不存在的频率');
  await expect(taskbar.locator('[data-language-controls]')).toBeVisible();
  await expect(taskbar.locator('[data-audio-status]')).toHaveText('声音开启');
  await expect(page.locator('[data-bot-standby]')).toHaveAccessibleName('BOT 服务：待机');
});

test('fine pointer selects an icon with a click and opens it with a double click', async ({ page }) => {
  const desktop = await mountDesktopController(page);
  const projects = desktop.locator('[data-windows-icons] [data-app-icon="projects"]');

  await projects.click();
  await expect(projects).toHaveAttribute('data-selected', 'true');
  await expect.poll(() => page.evaluate(() => window.testOpenCalls)).toEqual([]);

  await projects.dblclick();
  await expect.poll(() => page.evaluate(() => window.testOpenCalls)).toEqual(['projects']);
});

test('clicking the blank desktop surface clears icon selection', async ({ page }) => {
  await seedLayout(page, 'windows');
  await page.goto('/?skipBoot=1');
  const desktop = page.locator('[data-desktop-root]');
  const projects = desktop.locator('[data-windows-icons] [data-app-icon="projects"]');

  await projects.click();
  await expect(projects).toHaveAttribute('data-selected', 'true');

  await desktop.click({ position: { x: 720, y: 160 } });

  await expect(projects).toHaveAttribute('data-selected', 'false');
  await expect(projects).toHaveAttribute('aria-pressed', 'false');
});

test('coarse pointer opens once with a single tap', async ({ page }) => {
  const desktop = await mountDesktopController(page, { coarse: true });
  const writing = desktop.locator('[data-windows-icons] [data-app-icon="writing"]');

  await writing.click();

  await expect(writing).toHaveAttribute('data-selected', 'true');
  await expect.poll(() => page.evaluate(() => window.testOpenCalls)).toEqual(['writing']);
});

test('Windows ArrowRight moves selection and Enter opens the focused app once', async ({ page }) => {
  const desktop = await mountDesktopController(page);
  const projects = desktop.locator('[data-windows-icons] [data-app-icon="projects"]');
  const contact = desktop.locator('[data-windows-icons] [data-app-icon="contact"]');

  await projects.focus();
  await projects.press('ArrowRight');

  await expect(contact).toBeFocused();
  await expect(contact).toHaveAttribute('data-selected', 'true');
  await contact.press('Enter');
  await expect.poll(() => page.evaluate(() => window.testOpenCalls)).toEqual(['contact']);
});

test('Windows ArrowDown moves focus down the first icon column', async ({ page }) => {
  const desktop = await mountDesktopController(page);
  const projects = desktop.locator('[data-windows-icons] [data-app-icon="projects"]');
  const writing = desktop.locator('[data-windows-icons] [data-app-icon="writing"]');

  await projects.focus();
  await projects.press('ArrowDown');

  await expect(writing).toBeFocused();
  await expect(writing).toHaveAttribute('data-selected', 'true');
});

test('macOS arrows follow the horizontal Dock only', async ({ page }) => {
  const desktop = await mountDesktopController(page, { layout: 'macos' });
  const projects = desktop.locator('[data-macos-dock] [data-app-icon="projects"]');
  const writing = desktop.locator('[data-macos-dock] [data-app-icon="writing"]');

  await projects.focus();
  await projects.press('ArrowRight');
  await expect(writing).toBeFocused();
  await expect(writing).toHaveAttribute('data-selected', 'true');

  await writing.press('ArrowDown');
  await expect(writing).toBeFocused();
  await expect(writing).toHaveAttribute('data-selected', 'true');
});

test('macOS desktop shows a vertical folder column and the Dock opens apps', async ({ page }) => {
  const desktop = await mountDesktopController(page, { layout: 'macos' });
  const photos = desktop.locator('[data-folder-toggle="photos"]');
  const albums = desktop.locator('[data-folder-toggle="albums"]');
  const projects = desktop.locator('[data-macos-dock] [data-app-icon="projects"]');

  await expect(desktop.locator('[data-folder-toggle]')).toHaveCount(4);

  await photos.focus();
  await photos.press('ArrowDown');
  await expect(albums).toBeFocused();
  await albums.press('ArrowRight');
  await expect(albums).toBeFocused();

  await projects.dblclick();
  await expect.poll(() => page.evaluate(() => window.testOpenCalls)).toEqual(['projects']);
});

test('macOS Dock, icons, and BOT do not collide at 667x375', async ({ page }) => {
  await page.setViewportSize({ width: 667, height: 375 });
  await seedLayout(page, 'macos');
  await page.goto('/');

  const dock = page.locator('[data-macos-dock]');
  await expect(page.locator('[data-macos-menu] [data-system-title]')).toBeVisible();
  await expect(dock.locator('[data-dock-icons]')).toHaveCount(1);

  const geometry = await page.evaluate(() => {
    const rect = (element) => {
      const box = element.getBoundingClientRect();
      return { top: box.top, right: box.right, bottom: box.bottom, left: box.left };
    };
    const overlaps = (first, second) => !(
      first.right <= second.left
      || first.left >= second.right
      || first.bottom <= second.top
      || first.top >= second.bottom
    );
    const dockBox = rect(document.querySelector('[data-macos-dock]'));
    const botBox = rect(document.querySelector('[data-bot-mount]'));
    const iconBoxes = [...document.querySelectorAll('[data-macos-dock] [data-app-icon]')].map(rect);
    return {
      oneRow: iconBoxes.every((box) => box.top === iconBoxes[0].top),
      iconsDoNotOverlap: iconBoxes.every((box, index) => (
        iconBoxes.slice(index + 1).every((other) => !overlaps(box, other))
      )),
      iconsInsideDock: iconBoxes.every((box) => (
        box.left >= dockBox.left
        && box.right <= dockBox.right
        && box.top >= dockBox.top
        && box.bottom <= dockBox.bottom
      )),
      botClearsDock: !overlaps(botBox, dockBox),
      botClearsIcons: iconBoxes.every((box) => !overlaps(botBox, box)),
    };
  });

  expect(geometry).toEqual({
    oneRow: true,
    iconsDoNotOverlap: true,
    iconsInsideDock: true,
    botClearsDock: true,
    botClearsIcons: true,
  });
});

test('Windows system chrome keeps its title visible at 390x844', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seedLayout(page, 'windows');
  await page.goto('/');

  await expect(page.locator('[data-windows-taskbar] [data-system-title]')).toBeVisible();
});

test('penguin sprite replaces the BOT tile and answers with one protocol token', async ({ page }) => {
  await seedLayout(page, 'windows');
  // Pin the clock outside the hot-spring hour so the bubble reads SPLASH.
  await page.clock.install({ time: new Date('2026-08-13T10:00:00') });
  await page.goto('/');
  const mount = page.locator('[data-bot-mount]');
  const sprite = mount.locator('[data-bot-sprite]');

  await expect(sprite).toHaveCount(1);
  await expect(mount).toHaveAttribute('data-bot-pet', 'pen-pen');
  await expect(sprite).toHaveAttribute('data-bot-state', 'idle');
  await expect.poll(() => page.evaluate(() => (
    getComputedStyle(document.querySelector('[data-bot-sprite]')).backgroundImage
  ))).toContain('spritesheet-white.webp');
  const spriteStyle = await sprite.evaluate((node) => {
    const style = getComputedStyle(node);
    return { filter: style.filter, width: style.width, height: style.height };
  });
  expect(spriteStyle).toEqual({
    filter: 'none',
    width: '108px',
    height: '117px',
  });
  await expect(mount).not.toContainText('BOT');
  await expect(mount.locator('[data-bot-bubble]')).toBeHidden();

  const botButton = page.locator('[data-bot-standby]');
  await botButton.hover();
  await expect(botButton.locator('[data-bot-glitch-layer]')).toHaveCount(1);
  await expect(botButton).toHaveAttribute('data-bot-glitch', 'contour');
  await expect.poll(() => botButton.getAttribute('data-bot-glitch')).toBeNull();

  const before = await mount.boundingBox();
  await botButton.click();
  await expect(sprite).toHaveAttribute('data-bot-state', 'jumping');
  await expect(mount.locator('[data-bot-bubble]')).toBeVisible();
  await expect(mount.locator('[data-bot-bubble]')).toHaveText('SPLASH');
  await expect(page.getByRole('status')).toHaveText('BOT SERVICE: STANDBY');
  expect(await mount.boundingBox()).toEqual(before);

  await expect.poll(() => sprite.getAttribute('data-bot-state'), { timeout: 1000 }).toBe('waiting');
  await expect(mount.locator('[data-bot-bubble]')).toBeHidden({ timeout: 4000 });
  await expect(sprite).toHaveAttribute('data-bot-state', 'idle');

  await botButton.focus();
  await page.keyboard.press('Enter');
  await expect(mount.locator('[data-bot-bubble]')).toHaveText('SPLASH');
  await expect(mount.locator('[data-bot-bubble]')).toHaveCount(1);
});

test('penguin can be long-pressed and dragged without persisting its position', async ({ page }) => {
  await seedLayout(page, 'macos');
  await page.clock.install({ time: new Date('2026-08-13T10:00:00') });
  await page.goto('/');

  const mount = page.locator('[data-bot-mount]');
  const sprite = mount.locator('[data-bot-sprite]');
  const initial = await mount.boundingBox();
  expect(initial).not.toBeNull();

  const start = {
    x: initial.x + initial.width / 2,
    y: initial.y + initial.height / 2,
  };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await expect(mount).toHaveAttribute('data-bot-dragging', 'true');

  await page.mouse.move(start.x - 160, start.y - 100, { steps: 4 });
  await expect(sprite).toHaveAttribute('data-bot-state', 'running-left');
  const moved = await mount.boundingBox();
  expect(moved.x).toBeLessThan(initial.x - 20);
  expect(moved.y).toBeLessThan(initial.y - 20);

  await page.mouse.up();
  await expect(mount).not.toHaveAttribute('data-bot-dragging', 'true');
  await expect(sprite).toHaveAttribute('data-bot-state', 'idle');

  await page.reload();
  await expect(page.locator('[data-desktop-mode="macos"]')).toBeVisible();
  const reset = await page.locator('[data-bot-mount]').boundingBox();
  expect(Math.abs(reset.x - initial.x)).toBeLessThan(1);
  expect(Math.abs(reset.y - initial.y)).toBeLessThan(1);
});

test('penguin keeps its localized accessible name in all three locales', async ({ page }) => {
  const names = {
    en: 'BOT SERVICE: STANDBY',
    'zh-CN': 'BOT 服务：待机',
    ja: 'BOTサービス：待機中',
  };
  for (const [locale, name] of Object.entries(names)) {
    await page.addInitScript((selectedLocale) => {
      localStorage.setItem('portfolio-os:preferences', JSON.stringify({
        version: 1,
        bootComplete: true,
        layout: 'windows',
        locale: selectedLocale,
        audioEnabled: false,
      }));
    }, locale);
    await page.goto('/');
    await expect(page.locator('[data-bot-standby]')).toHaveAccessibleName(name);
  }
});

test('hot spring hour shows steam and swaps the protocol token', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('portfolio-os:preferences', JSON.stringify({
      version: 1,
      bootComplete: true,
      layout: 'windows',
      locale: 'en',
      audioEnabled: false,
    }));
    const RealDate = Date;
    const pinned = new RealDate('2026-08-12T02:05:00').getTime();
    class PinnedDate extends RealDate {
      constructor(...args) { super(...(args.length ? args : [pinned])); }
      static now() { return pinned; }
    }
    globalThis.Date = PinnedDate;
  });
  await page.goto('/');

  await expect(page.locator('[data-bot-steam]')).toBeVisible();
  await page.locator('[data-bot-standby]').click();
  await expect(page.locator('[data-bot-bubble]')).toHaveText('HOT SPRING: OPEN');
  await expect(page.locator('[data-bot-steam]')).toBeHidden();
});

test('writing app summons and releases the reading companion paper', async ({ page }) => {
  await seedLayout(page, 'windows');
  await page.goto('/');
  const paper = page.locator('[data-bot-paper]');

  await expect(paper).toBeHidden();
  await page.locator('[data-windows-icons] [data-app-icon="writing"]').dblclick();
  await expect(page.locator('[data-app-window="writing"]')).toBeVisible();
  await expect(paper).toBeVisible();
  await expect.poll(() => page.locator('[data-bot-sprite]').getAttribute('data-bot-state'))
    .toBe('review');

  await page.locator('[data-app-window="writing"] [data-window-close]').click();
  await expect(paper).toBeHidden();
  await expect(page.locator('[data-bot-sprite]')).toHaveAttribute('data-bot-state', 'idle');
});
