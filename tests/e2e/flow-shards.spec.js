import { test, expect } from '@playwright/test';

const CHROMIUM_READ_PIXELS_WARNING = /^\[\.WebGL-0x[0-9A-Fa-f]+\]GL Driver Message \(OpenGL, Performance, GL_CLOSE_PATH_NV, High\): GPU stall due to ReadPixels(?: \(this message will no longer repeat\))?$/;

async function seedFlowShards(page) {
  await page.addInitScript(() => {
    localStorage.setItem('portfolio-os:preferences', JSON.stringify({
      version: 1,
      bootComplete: true,
      layout: 'macos',
      locale: 'en',
      audioEnabled: false,
      wallpaperId: 'flow-shards',
    }));
  });
}

async function setDocumentHidden(page, hidden) {
  await page.evaluate((value) => {
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => value,
    });
    document.dispatchEvent(new Event('visibilitychange'));
  }, hidden);
}

function collectBrowserProblems(page) {
  const problems = [];
  page.on('console', (message) => {
    // Headless Chromium reports this compositor readback diagnostic for the
    // existing raw-WebGL wallpaper too; it is not emitted by shader compilation.
    if (message.type() === 'warning' && CHROMIUM_READ_PIXELS_WARNING.test(message.text())) return;
    if (message.type() === 'error' || message.type() === 'warning') {
      problems.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
  return problems;
}

test('console filtering ignores only the canonical Chromium ReadPixels warning', async ({ page }) => {
  const problems = collectBrowserProblems(page);
  const canonical = '[.WebGL-0x11c0046fc00]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels';
  await page.setContent('<main>console classifier</main>');
  await page.evaluate((message) => {
    console.warn(message);
    console.warn(`${message} (this message will no longer repeat)`);
    console.error(message);
    console.warn(`prefix ${message}`);
    console.warn(`${message} suffix`);
    console.warn('unrelated WebGL warning');
  }, canonical);

  await expect.poll(() => problems).toEqual([
    `error: ${canonical}`,
    `warning: prefix ${canonical}`,
    `warning: ${canonical} suffix`,
    'warning: unrelated WebGL warning',
  ]);
});

test('Flow Shards initializes one live Three.js surface without model requests', async ({ page }) => {
  const modelRequests = [];
  const browserProblems = collectBrowserProblems(page);
  page.on('request', (request) => {
    if (/\.(glb|gltf|obj|fbx)(\?|$)/i.test(request.url())) modelRequests.push(request.url());
  });
  await seedFlowShards(page);
  await page.goto('/');
  const host = page.locator('[data-environment-background]');
  await expect(host).toHaveAttribute('data-background-id', 'flow-shards');
  const surface = host.locator('[data-wallpaper-renderer="three-webgl2"]');
  await expect(surface).toHaveCount(1);
  await expect(surface).toHaveAttribute('data-simulation-size', '96');
  await expect.poll(() => surface.getAttribute('data-wallpaper-frame').then(Number)).toBeGreaterThan(1);
  expect(modelRequests).toEqual([]);
  expect(browserProblems).toEqual([]);
});

test('Flow Shards focuses, pauses while hidden, and resumes without a catch-up jump', async ({ page }) => {
  const browserProblems = collectBrowserProblems(page);
  await seedFlowShards(page);
  await page.goto('/');
  const host = page.locator('[data-environment-background]');
  const surface = host.locator('[data-wallpaper-renderer="three-webgl2"]');
  await expect(surface).toHaveCount(1);

  await page.locator('[data-environment-open="projects"]').click();
  await expect(host).toHaveAttribute('data-background-motion', 'focused');
  const focusedFrame = Number(await surface.getAttribute('data-wallpaper-frame'));
  await expect.poll(() => surface.getAttribute('data-wallpaper-frame').then(Number))
    .toBeGreaterThan(focusedFrame);

  await setDocumentHidden(page, true);
  await expect(host).toHaveAttribute('data-background-motion', 'static');
  const pausedFrame = Number(await surface.getAttribute('data-wallpaper-frame'));
  await page.waitForTimeout(250);
  expect(Number(await surface.getAttribute('data-wallpaper-frame'))).toBe(pausedFrame);

  await setDocumentHidden(page, false);
  await expect(host).toHaveAttribute('data-background-motion', 'focused');
  await expect.poll(() => surface.getAttribute('data-wallpaper-frame').then(Number))
    .toBeGreaterThan(pausedFrame);
  expect(browserProblems).toEqual([]);
});

test('static reduced-motion render-only updates preserve simulation history', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?skipBoot=1');
  await page.evaluate(async () => {
    const [{ createWallpaperRenderer }, { getWallpaperDescriptor }] = await Promise.all([
      import('/scripts/environment/background/wallpapers/flow-shards/index.js'),
      import('/scripts/environment/background/wallpaper-registry.js'),
    ]);
    const descriptor = getWallpaperDescriptor('flow-shards');
    const host = document.createElement('div');
    host.dataset.testStaticFlow = '';
    host.style.cssText = 'height: 400px; position: fixed; width: 640px;';
    document.body.append(host);
    const errors = [];
    const renderer = createWallpaperRenderer({
      document,
      descriptor,
      config: descriptor.defaultConfig,
      onError: (error) => errors.push(error.message),
    });
    host.append(renderer.element);
    renderer.setMotionState(
      matchMedia('(prefers-reduced-motion: reduce)').matches ? 'static' : 'running',
    );
    await renderer.ready;
    globalThis.testStaticFlow = { errors, host, renderer };
  });

  const host = page.locator('[data-test-static-flow]');
  const surface = host.locator('[data-wallpaper-renderer="three-webgl2"]');
  await expect(surface).toHaveAttribute('data-background-motion', 'static');
  await expect(surface).toHaveAttribute('data-simulation-generation', '1');
  const initialFrame = Number(await surface.getAttribute('data-wallpaper-frame'));

  await page.setViewportSize({ width: 1280, height: 800 });
  await expect.poll(() => surface.getAttribute('data-wallpaper-frame').then(Number))
    .toBeGreaterThan(initialFrame);
  await expect(surface).toHaveAttribute('data-simulation-generation', '1');
  const resizedFrame = Number(await surface.getAttribute('data-wallpaper-frame'));

  await page.evaluate(() => globalThis.testStaticFlow.renderer.updateConfig({ glow: 72 }));
  await expect.poll(() => surface.getAttribute('data-wallpaper-frame').then(Number))
    .toBeGreaterThan(resizedFrame);
  await expect(surface).toHaveAttribute('data-simulation-generation', '1');
  await expect(surface).not.toHaveAttribute('data-wallpaper-error', /.+/);
  expect(await page.evaluate(() => globalThis.testStaticFlow.errors)).toEqual([]);
  await page.evaluate(() => {
    globalThis.testStaticFlow.renderer.destroy();
    globalThis.testStaticFlow.host.remove();
    delete globalThis.testStaticFlow;
  });
});
