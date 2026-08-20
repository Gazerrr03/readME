import { spawn } from 'node:child_process';
import { mkdir, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { getWallpaperDescriptor } from '../scripts/environment/background/wallpaper-registry.js';
import { FLOW_SHARDS_PRESETS } from '../scripts/environment/background/wallpapers/flow-shards/config.js';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const HOST = '127.0.0.1';
const PORT = 4174;
const BASE_URL = `http://${HOST}:${PORT}`;
const VIEWPORT = Object.freeze({ width: 1440, height: 900 });
const PREFERENCES_KEY = 'portfolio-os:preferences';
const PREVIEW_KEY = 'portfolio-os:wallpaper-preview:v1';

const captures = [
  { id: 'blue-fluid-halftone', rendererSelector: '[data-background-renderer="webgl2"]' },
  { id: 'flow-shards', rendererSelector: '[data-wallpaper-renderer="three-webgl2"]' },
];

async function projectServerIsReady() {
  try {
    const responses = await Promise.all([
      fetch(`${BASE_URL}/`, { method: 'HEAD' }),
      fetch(`${BASE_URL}/scripts/environment/background/wallpaper-registry.js`, { method: 'HEAD' }),
    ]);
    return responses.every((response) => response.ok);
  } catch {
    return false;
  }
}

async function startProjectServer() {
  if (await projectServerIsReady()) return null;
  const server = spawn(process.execPath, ['tests/static-server.mjs'], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(PORT) },
    stdio: 'ignore',
  });
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`Preview server exited early with code ${server.exitCode}`);
    }
    if (await projectServerIsReady()) return server;
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 100));
  }
  server.kill('SIGTERM');
  throw new Error(`Preview server did not become ready at ${BASE_URL}`);
}

async function stopProjectServer(server) {
  if (!server || server.exitCode !== null) return;
  server.kill('SIGTERM');
  await Promise.race([
    new Promise((resolveExit) => server.once('exit', resolveExit)),
    new Promise((resolveDelay) => setTimeout(resolveDelay, 2_000)),
  ]);
}

function assertPng(buffer, outputPath) {
  const signature = buffer.subarray(0, 8).toString('hex');
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  if (signature !== '89504e470d0a1a0a') throw new Error(`${outputPath} is not a PNG`);
  if (width !== VIEWPORT.width || height !== VIEWPORT.height) {
    throw new Error(`${outputPath} is ${width}x${height}; expected 1440x900`);
  }
  if (buffer.length < 10_000) throw new Error(`${outputPath} is unexpectedly empty`);
}

async function capturePreview(browser, definition) {
  const descriptor = getWallpaperDescriptor(definition.id);
  if (!descriptor) throw new Error(`Unknown wallpaper: ${definition.id}`);
  const outputPath = resolve(ROOT, descriptor.previewSrc);
  await mkdir(dirname(outputPath), { recursive: true });

  const context = await browser.newContext({
    deviceScaleFactor: 1,
    reducedMotion: definition.id === 'flow-shards' ? 'no-preference' : 'reduce',
    viewport: VIEWPORT,
  });
  const unexpectedRequests = [];
  const pageErrors = [];
  context.on('request', (request) => {
    const url = new URL(request.url());
    if (url.origin !== BASE_URL || /\.(?:fbx|glb|gltf|obj)(?:\?|$)/i.test(url.pathname)) {
      unexpectedRequests.push(request.url());
    }
  });
  const page = await context.newPage();
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.addInitScript(({ id, preferencesKey, previewKey, reference }) => {
    localStorage.clear();
    localStorage.setItem(preferencesKey, JSON.stringify({
      version: 1,
      bootComplete: true,
      layout: 'windows',
      locale: 'en',
      audioEnabled: false,
      wallpaperId: id,
    }));
    if (id === 'flow-shards') {
      localStorage.setItem(previewKey, JSON.stringify({
        version: 1,
        wallpaperId: id,
        config: reference,
      }));
    }
  }, {
    id: definition.id,
    preferencesKey: PREFERENCES_KEY,
    previewKey: PREVIEW_KEY,
    reference: FLOW_SHARDS_PRESETS.reference,
  });

  try {
    await page.goto(`${BASE_URL}/?skipBoot=1`, { waitUntil: 'domcontentloaded' });
    const host = page.locator('[data-environment-background]');
    await host.waitFor({ state: 'visible' });
    await page.waitForFunction((id) => {
      const node = document.querySelector('[data-environment-background]');
      return node?.dataset.backgroundId === id && node.dataset.wallpaperState === 'ready';
    }, definition.id, { timeout: 20_000 });
    const surface = host.locator(
      `[data-wallpaper-surface][data-wallpaper-active="true"]${definition.rendererSelector}`,
    );
    await surface.waitFor({ state: 'visible', timeout: 20_000 });
    await page.waitForFunction((selector) => {
      const canvas = document.querySelector(selector);
      return canvas instanceof HTMLCanvasElement && canvas.width > 0 && canvas.height > 0;
    }, `[data-environment-background] [data-wallpaper-active="true"]${definition.rendererSelector}`);
    if (definition.id === 'flow-shards') {
      await page.waitForFunction(() => Number(
        document.querySelector('[data-wallpaper-renderer="three-webgl2"]')?.dataset.wallpaperFrame,
      ) >= 60, null, { timeout: 120_000 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.waitForFunction(() => (
        document.querySelector('[data-environment-background]')?.dataset.backgroundMotion === 'static'
      ));
    }
    await host.evaluate((node) => {
      node.remove();
      document.body.replaceChildren(node);
      Object.assign(document.documentElement.style, {
        background: '#000',
        height: '100%',
        overflow: 'hidden',
      });
      Object.assign(document.body.style, {
        background: '#000',
        height: '100%',
        margin: '0',
        overflow: 'hidden',
      });
      Object.assign(node.style, {
        height: '100vh',
        inset: '0',
        opacity: '1',
        position: 'fixed',
        width: '100vw',
        zIndex: '2147483647',
      });
      window.dispatchEvent(new Event('resize'));
    });
    const bounds = await host.boundingBox();
    if (!bounds || bounds.width !== VIEWPORT.width || bounds.height !== VIEWPORT.height) {
      throw new Error(`Background host does not fill 1440x900: ${JSON.stringify(bounds)}`);
    }
    const png = await host.screenshot({ animations: 'disabled', path: outputPath, type: 'png' });
    assertPng(png, outputPath);
    assertPng(await readFile(outputPath), outputPath);
    if (unexpectedRequests.length) {
      throw new Error(`Unexpected model/network requests: ${unexpectedRequests.join(', ')}`);
    }
    if (pageErrors.length) throw new Error(`Page errors: ${pageErrors.join(', ')}`);
    console.log(`Captured ${definition.id} -> ${descriptor.previewSrc}`);
  } finally {
    await context.close();
  }
}

const server = await startProjectServer();
const browser = await chromium.launch();
try {
  for (const definition of captures) await capturePreview(browser, definition);
} finally {
  await browser.close();
  await stopProjectServer(server);
}
