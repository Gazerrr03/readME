import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('portfolio-os:preferences', JSON.stringify({
    version: 1,
    bootComplete: true,
    layout: 'windows',
    locale: 'en',
    audioEnabled: false,
  })));
  await page.goto('/');
});

test('opens one placeholder window and restores it from the taskbar', async ({ page }) => {
  await page.locator('[data-windows-icons] [data-app-icon="projects"]').dblclick();
  await page.locator('[data-windows-icons] [data-app-icon="projects"]').dblclick();

  const appWindow = page.locator('[data-app-window="projects"]');
  await expect(appWindow).toHaveCount(1);
  await expect(appWindow.locator('[data-window-title]')).toHaveText('Projects');

  await appWindow.locator('[data-window-minimize]').click();
  await expect(appWindow).toBeHidden();
  await expect(page.locator('[data-running-app="projects"]:visible')).toHaveAttribute('data-minimized', 'true');

  await page.locator('[data-windows-taskbar] [data-running-app="projects"]').click();
  await expect(appWindow).toBeVisible();
  await expect(page.locator('[data-running-app="projects"]:visible')).toHaveAttribute('data-minimized', 'false');
});

test('focuses an existing window and close removes its running entry', async ({ page }) => {
  await page.locator('[data-windows-icons] [data-app-icon="projects"]').dblclick();
  await page.locator('[data-windows-icons] [data-app-icon="writing"]').dblclick();

  const projects = page.locator('[data-app-window="projects"]');
  const writing = page.locator('[data-app-window="writing"]');
  const before = await writing.evaluate((element) => Number(element.style.zIndex));
  await projects.locator('[data-window-titlebar]').click({ position: { x: 8, y: 8 } });
  await expect.poll(() => projects.evaluate((element) => Number(element.style.zIndex))).toBeGreaterThan(before);

  await projects.locator('[data-window-close]').click();
  await expect(projects).toHaveCount(0);
  await expect(page.locator('[data-running-app="projects"]')).toHaveCount(0);
});

test('active and inactive windows expose the shared OS state contract', async ({ page }) => {
  await page.locator('[data-windows-icons] [data-app-icon="projects"]').dblclick();
  await page.locator('[data-windows-icons] [data-app-icon="writing"]').dblclick();

  const projects = page.locator('[data-app-window="projects"]');
  const writing = page.locator('[data-app-window="writing"]');
  await projects.locator('[data-window-titlebar]').click({ position: { x: 8, y: 8 } });

  await expect(projects).toHaveAttribute('data-window-status', 'normal');
  await expect(projects).toHaveAttribute('data-window-active', 'true');
  await expect(writing).toHaveAttribute('data-window-active', 'false');
  await expect(projects.locator('[data-window-titlebar]')).toHaveAttribute('data-os-surface', 'titlebar');
  await expect(projects.locator('[data-window-controls] button').first()).toHaveAttribute('data-os-control', 'window');
});

test('dragging the title bar moves the window and keeps it reachable', async ({ page }) => {
  await page.locator('[data-windows-icons] [data-app-icon="projects"]').dblclick();
  const appWindow = page.locator('[data-app-window="projects"]');
  const titleBar = appWindow.locator('[data-window-titlebar]');
  const before = await appWindow.boundingBox();

  await titleBar.dragTo(page.locator('[data-windows-taskbar] [data-system-title]'));
  const after = await appWindow.boundingBox();

  expect(after.x).not.toBe(before.x);
  expect(after.y).toBeLessThanOrEqual(900 - 48 - 32);
});

test('renderer-owned DOM survives focus and pointer dragging', async ({ page }) => {
  await page.evaluate(async () => {
    const [{ createWindowManager }, { getApps }, { createI18n }] = await Promise.all([
      import('/scripts/window-manager.js'),
      import('/modules/app-registry.js'),
      import('/scripts/i18n/i18n.js'),
    ]);
    const root = document.createElement('section');
    root.dataset.testManagerRoot = '';
    root.style.cssText = 'height: 600px; position: relative; width: 800px;';
    const taskbar = document.createElement('footer');
    taskbar.dataset.windowsTaskbar = '';
    root.append(taskbar);
    document.body.append(root);

    let rendererCalls = 0;
    const manager = createWindowManager({
      root,
      taskSurface: root,
      registry: getApps(),
      i18n: createI18n('en'),
      renderers: {
        projects: () => {
          rendererCalls += 1;
          const input = document.createElement('input');
          input.dataset.rendererInput = '';
          return input;
        },
      },
    });
    manager.open('projects');
    window.testManager = manager;
    window.testRendererNode = root.querySelector('[data-renderer-input]');
    window.getRendererCalls = () => rendererCalls;
  });

  const root = page.locator('[data-test-manager-root]');
  const input = root.locator('[data-renderer-input]');
  await input.fill('persistent value');
  await page.evaluate(() => window.testManager.focus('projects'));

  await expect(input).toHaveValue('persistent value');
  expect(await page.evaluate(() => (
    document.querySelector('[data-test-manager-root] [data-renderer-input]') === window.testRendererNode
  ))).toBe(true);

  const titleBar = root.locator('[data-window-titlebar]');
  await titleBar.dragTo(root.locator('[data-windows-taskbar]'));
  await expect(input).toHaveValue('persistent value');
  expect(await page.evaluate(() => window.getRendererCalls())).toBe(1);
});

test('switching from Windows to macOS re-clamps an open window below the menu', async ({ page }) => {
  await page.locator('[data-windows-icons] [data-app-icon="projects"]').dblclick();
  const appWindow = page.locator('[data-app-window="projects"]');
  const titleBar = appWindow.locator('[data-window-titlebar]');
  const titleBox = await titleBar.boundingBox();
  await page.mouse.move(titleBox.x + 100, titleBox.y + 16);
  await page.mouse.down();
  await page.mouse.move(titleBox.x + 100, 0);
  await page.mouse.up();
  await expect.poll(() => appWindow.evaluate((element) => element.offsetTop)).toBe(0);
  const before = await appWindow.boundingBox();

  await page.evaluate(async () => {
    const { desktop } = await import('/scripts/main.js');
    desktop.setMode('macos');
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });

  const menu = await page.locator('[data-macos-menu]').boundingBox();
  const after = await appWindow.boundingBox();
  await expect(page.locator('[data-desktop-mode="macos"]')).toBeVisible();
  expect(after.y).toBeGreaterThanOrEqual(menu.y + menu.height);
  expect(after.x).toBe(before.x);
  expect(after.width).toBe(before.width);
  await expect(appWindow).toHaveCount(1);
});

test('a left-clamped window exposes a draggable recovery region beside its controls', async ({ page }) => {
  await page.locator('[data-windows-icons] [data-app-icon="projects"]').dblclick();
  const appWindow = page.locator('[data-app-window="projects"]');
  const titleBar = appWindow.locator('[data-window-titlebar]');
  const titleBox = await titleBar.boundingBox();

  await page.mouse.move(titleBox.x + 440, titleBox.y + 16);
  await page.mouse.down();
  await page.mouse.move(1, titleBox.y + 16);
  await page.mouse.up();
  // The clamp keeps a 96px (LEFT_TITLE_BAR_REACH) draggable strip: x = 96 - width.
  const windowWidth = await appWindow.evaluate((element) => element.offsetWidth);
  await expect.poll(() => appWindow.evaluate((element) => element.offsetLeft)).toBe(96 - windowWidth);

  const clampedTitle = await titleBar.boundingBox();
  await page.mouse.move(16, clampedTitle.y + 16);
  await page.mouse.down();
  await page.mouse.move(600, clampedTitle.y + 16);
  await page.mouse.up();
  await expect.poll(() => appWindow.evaluate((element) => element.offsetLeft)).toBeGreaterThan(0);
});

test('an external task surface restores a minimized window', async ({ page }) => {
  await page.evaluate(async () => {
    const [{ createWindowManager }, { getApps }, { createI18n }] = await Promise.all([
      import('/scripts/window-manager.js'),
      import('/modules/app-registry.js'),
      import('/scripts/i18n/i18n.js'),
    ]);
    const root = document.createElement('section');
    root.dataset.externalManagerRoot = '';
    root.style.cssText = 'height: 500px; position: relative; width: 700px;';
    const taskSurface = document.createElement('footer');
    taskSurface.dataset.windowsTaskbar = '';
    taskSurface.dataset.externalTaskSurface = '';
    taskSurface.style.position = 'static';
    document.body.append(root, taskSurface);

    const manager = createWindowManager({
      root,
      taskSurface,
      registry: getApps(),
      i18n: createI18n('en'),
      renderers: { projects: () => document.createElement('p') },
    });
    manager.open('projects');
    manager.minimize('projects');
    window.externalTaskManager = manager;
  });

  await page.locator('[data-external-task-surface] [data-running-app="projects"]').click();

  await expect(page.locator('[data-external-manager-root] [data-app-window="projects"]')).toBeVisible();
  expect(await page.evaluate(() => window.externalTaskManager.getState().windows[0].status)).toBe('normal');
});
