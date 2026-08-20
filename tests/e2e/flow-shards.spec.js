import { test, expect } from '@playwright/test';

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
    if (/GL Driver Message .*GPU stall due to ReadPixels/.test(message.text())) return;
    if (message.type() === 'error' || message.type() === 'warning') {
      problems.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
  return problems;
}

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
