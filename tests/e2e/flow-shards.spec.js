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

async function flowPixelCoverage(page, locator) {
  const png = await locator.screenshot({ animations: 'disabled' });
  return page.evaluate(async (base64) => {
    const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
    const bitmap = await createImageBitmap(new Blob([bytes], { type: 'image/png' }));
    const canvas = Object.assign(document.createElement('canvas'), {
      height: bitmap.height,
      width: bitmap.width,
    });
    const context = canvas.getContext('2d');
    context.drawImage(bitmap, 0, 0);
    const pixels = context.getImageData(0, 0, bitmap.width, bitmap.height).data;
    let hot = 0;
    let visible = 0;
    for (let offset = 0; offset < pixels.length; offset += 4) {
      const maximum = Math.max(pixels[offset], pixels[offset + 1], pixels[offset + 2]);
      const luminance = (pixels[offset] * 0.2126)
        + (pixels[offset + 1] * 0.7152)
        + (pixels[offset + 2] * 0.0722);
      if (maximum > 28) visible += 1;
      if (luminance > 120) hot += 1;
    }
    const pixelCount = pixels.length / 4;
    return { hot: hot / pixelCount, visible: visible / pixelCount };
  }, png.toString('base64'));
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
  await expect(surface).toHaveAttribute('data-simulation-size', '128');
  await expect.poll(() => surface.getAttribute('data-wallpaper-frame').then(Number)).toBeGreaterThan(1);
  expect(modelRequests).toEqual([]);
  expect(browserProblems).toEqual([]);
});

test('reference Flow preserves dark breathing room around the shard field', async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 720, height: 450 });
  await page.goto('/?skipBoot=1');
  await page.evaluate(async () => {
    const [{ createWallpaperRenderer }, { getWallpaperDescriptor }] = await Promise.all([
      import('/scripts/environment/background/wallpapers/flow-shards/index.js'),
      import('/scripts/environment/background/wallpaper-registry.js'),
    ]);
    const descriptor = getWallpaperDescriptor('flow-shards');
    const host = document.createElement('div');
    host.dataset.testFlowCoverage = '';
    host.style.cssText = [
      'background:#000000',
      'height:100vh',
      'inset:0',
      'position:fixed',
      'width:100vw',
      'z-index:2147483647',
    ].join(';');
    document.body.append(host);
    const renderer = createWallpaperRenderer({
      document,
      descriptor,
      config: descriptor.defaultConfig,
    });
    host.append(renderer.element);
    renderer.element.dataset.wallpaperActive = 'true';
    renderer.element.style.cssText = 'display:block;height:100%;opacity:1;width:100%';
    renderer.setMotionState('running');
    await renderer.ready;
    globalThis.testFlowCoverage = { host, renderer };
  });

  const surface = page.locator('[data-test-flow-coverage] [data-wallpaper-renderer="three-webgl2"]');
  await expect.poll(() => surface.getAttribute('data-wallpaper-frame').then(Number), {
    timeout: 75_000,
  }).toBeGreaterThanOrEqual(30);
  await page.evaluate(() => globalThis.testFlowCoverage.renderer.setMotionState('static'));
  await expect(surface).toHaveAttribute('data-background-motion', 'static');
  const coverage = await flowPixelCoverage(page, surface);
  expect(coverage.visible).toBeGreaterThan(0.18);
  expect(coverage.visible).toBeLessThan(0.72);
  expect(coverage.hot).toBeGreaterThan(0.002);
  expect(coverage.hot).toBeLessThan(0.04);

  await page.evaluate(() => {
    globalThis.testFlowCoverage.renderer.destroy();
    globalThis.testFlowCoverage.host.remove();
    delete globalThis.testFlowCoverage;
  });
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
  await expect(host.locator('[data-wallpaper-active="true"]')).toHaveCount(1);
  await expect(host.locator('[data-wallpaper-surface]')).toHaveCount(1);

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
  await page.waitForTimeout(250);
  expect(Number(await surface.getAttribute('data-wallpaper-frame'))).toBe(initialFrame);

  await page.setViewportSize({ width: 1280, height: 800 });
  await expect.poll(() => surface.getAttribute('data-wallpaper-frame').then(Number))
    .toBeGreaterThan(initialFrame);
  await expect(surface).toHaveAttribute('data-simulation-generation', '1');
  const resizedFrame = Number(await surface.getAttribute('data-wallpaper-frame'));
  await page.waitForTimeout(250);
  expect(Number(await surface.getAttribute('data-wallpaper-frame'))).toBe(resizedFrame);

  await page.evaluate(() => globalThis.testStaticFlow.renderer.updateConfig({ glow: 72 }));
  await expect.poll(() => surface.getAttribute('data-wallpaper-frame').then(Number))
    .toBeGreaterThan(resizedFrame);
  await expect(surface).toHaveAttribute('data-simulation-generation', '1');
  const updatedFrame = Number(await surface.getAttribute('data-wallpaper-frame'));
  await page.waitForTimeout(250);
  expect(Number(await surface.getAttribute('data-wallpaper-frame'))).toBe(updatedFrame);
  await expect(surface).not.toHaveAttribute('data-wallpaper-error', /.+/);
  expect(await page.evaluate(() => globalThis.testStaticFlow.errors)).toEqual([]);
  await page.evaluate(() => {
    globalThis.testStaticFlow.renderer.destroy();
    globalThis.testStaticFlow.host.remove();
    delete globalThis.testStaticFlow;
  });
});
