/* Zoomed crops of the penguin resident for visual review. */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const BASE = 'http://127.0.0.1:4173';
const OUT = fileURLToPath(new URL('../screenshots/', import.meta.url));
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

async function crop(name, { layout = 'windows', hotSpring = false, openWriting = false } = {}) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 4,
  });
  const page = await context.newPage();
  await page.addInitScript((preferences) => {
    localStorage.setItem('portfolio-os:preferences', JSON.stringify(preferences));
  }, { version: 1, bootComplete: true, layout, locale: 'en', audioEnabled: false });
  if (hotSpring) {
    await page.addInitScript(() => {
      const RealDate = Date;
      const pinned = new RealDate('2026-08-12T02:05:00').getTime();
      class PinnedDate extends RealDate {
        constructor(...args) { super(...(args.length ? args : [pinned])); }
        static now() { return pinned; }
      }
      globalThis.Date = PinnedDate;
    });
  }
  await page.goto(BASE);
  if (openWriting) {
    await page.locator('[data-windows-icons] [data-app-icon="writing"]').dblclick();
    await page.waitForSelector('[data-app-window="writing"]');
  }
  if (hotSpring) await page.locator('[data-bot-standby]').click();
  await page.waitForTimeout(300);
  const box = await page.locator('[data-bot-mount]').boundingBox();
  const pad = { top: 56, right: 48, bottom: 24, left: 64 };
  await page.screenshot({
    path: `${OUT}${name}.png`,
    clip: {
      x: Math.max(0, box.x - pad.left),
      y: Math.max(0, box.y - pad.top),
      width: box.width + pad.left + pad.right,
      height: box.height + pad.top + pad.bottom,
    },
  });
  await context.close();
  console.log(`cropped ${name}`);
}

await crop('penguin-zoom-windows');
await crop('penguin-zoom-macos', { layout: 'macos' });
await crop('penguin-zoom-hot-spring', { hotSpring: true });
await crop('penguin-zoom-paper', { openWriting: true });

await browser.close();
console.log('done');
