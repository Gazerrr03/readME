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
    const [{ createDesktopController }, { getApps }, { createI18n }] = await Promise.all([
      import('/scripts/desktop.js'),
      import('/scripts/apps/app-registry.js'),
      import('/scripts/i18n/i18n.js'),
    ]);
    const root = document.createElement('section');
    root.dataset.testDesktop = '';
    document.body.append(root);
    window.testOpenCalls = [];
    window.testDesktop = createDesktopController({
      root,
      apps: getApps(),
      i18n: createI18n('en'),
      preferences: { layout: selectedLayout, locale: 'en', audioEnabled: false },
      onOpen: (appId) => window.testOpenCalls.push(appId),
    });
    window.testDesktop.render();
  }, { useCoarsePointer: coarse, selectedLayout: layout });
  return page.locator('[data-test-desktop]');
}

test('Windows mode shows five icons and the taskbar', async ({ page }) => {
  await seedLayout(page, 'windows');
  await page.goto('/');
  await expect(page.locator('[data-desktop-mode="windows"]')).toBeVisible();
  await expect(page.locator('[data-app-icon]')).toHaveCount(5);
  await expect(page.locator('[data-windows-taskbar]')).toBeVisible();
});

test('macOS mode shows the menu bar and Dock', async ({ page }) => {
  await seedLayout(page, 'macos');
  await page.goto('/');
  await expect(page.locator('[data-desktop-mode="macos"]')).toBeVisible();
  await expect(page.locator('[data-macos-menu]')).toBeVisible();
  await expect(page.locator('[data-macos-dock]')).toBeVisible();
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
  await expect(page.locator('[data-bot-mount]')).toContainText('BOT 服务：待机');
});

test('fine pointer selects with one click and opens once with a double-click', async ({ page }) => {
  const desktop = await mountDesktopController(page);
  const projects = desktop.locator('[data-app-icon="projects"]');

  await projects.click();
  await expect(projects).toHaveAttribute('data-selected', 'true');
  await expect.poll(() => page.evaluate(() => window.testOpenCalls)).toEqual([]);

  await projects.dblclick();
  await expect.poll(() => page.evaluate(() => window.testOpenCalls)).toEqual(['projects']);
});

test('coarse pointer opens once with a single tap', async ({ page }) => {
  const desktop = await mountDesktopController(page, { coarse: true });
  const writing = desktop.locator('[data-app-icon="writing"]');

  await writing.click();

  await expect(writing).toHaveAttribute('data-selected', 'true');
  await expect.poll(() => page.evaluate(() => window.testOpenCalls)).toEqual(['writing']);
});

test('Windows ArrowRight moves selection and Enter opens the focused app once', async ({ page }) => {
  const desktop = await mountDesktopController(page);
  const projects = desktop.locator('[data-app-icon="projects"]');
  const writing = desktop.locator('[data-app-icon="writing"]');

  await projects.focus();
  await projects.press('ArrowRight');

  await expect(writing).toBeFocused();
  await expect(writing).toHaveAttribute('data-selected', 'true');
  await writing.press('Enter');
  await expect.poll(() => page.evaluate(() => window.testOpenCalls)).toEqual(['writing']);
});

test('Windows ArrowDown follows the two-column icon grid', async ({ page }) => {
  const desktop = await mountDesktopController(page);
  const projects = desktop.locator('[data-app-icon="projects"]');
  const about = desktop.locator('[data-app-icon="about"]');

  await projects.focus();
  await projects.press('ArrowDown');

  await expect(about).toBeFocused();
  await expect(about).toHaveAttribute('data-selected', 'true');
});

test('macOS arrows follow the horizontal Dock only', async ({ page }) => {
  const desktop = await mountDesktopController(page, { layout: 'macos' });
  const projects = desktop.locator('[data-app-icon="projects"]');
  const writing = desktop.locator('[data-app-icon="writing"]');

  await projects.focus();
  await projects.press('ArrowRight');
  await expect(writing).toBeFocused();
  await expect(writing).toHaveAttribute('data-selected', 'true');

  await writing.press('ArrowDown');
  await expect(writing).toBeFocused();
  await expect(writing).toHaveAttribute('data-selected', 'true');
});

test('macOS Dock, icons, and BOT do not collide at 667x375', async ({ page }) => {
  await page.setViewportSize({ width: 667, height: 375 });
  await seedLayout(page, 'macos');
  await page.goto('/');

  const dock = page.locator('[data-macos-dock]');
  await expect(page.locator('[data-macos-menu] [data-system-title]')).toBeVisible();
  await expect(dock.locator('[data-desktop-icons]')).toHaveCount(1);

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
    const iconBoxes = [...document.querySelectorAll('[data-app-icon]')].map(rect);
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
