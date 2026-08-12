/* Captures the penguin resident across modes, scenes, and the hot spring hour. */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const BASE = 'http://127.0.0.1:4173';
const OUT = fileURLToPath(new URL('../screenshots/', import.meta.url));
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

async function shoot(name, { layout = 'windows', viewport = { width: 1440, height: 900 }, hotSpring = false } = {}, actions) {
  const context = await browser.newContext({ viewport });
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
  if (actions) await actions(page);
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}${name}.png` });
  await context.close();
  console.log(`captured ${name}`);
}

await shoot('penguin-windows', { layout: 'windows' });
await shoot('penguin-macos', { layout: 'macos' });
await shoot('penguin-narrow', { layout: 'windows', viewport: { width: 390, height: 844 } });
await shoot('penguin-hot-spring', { layout: 'windows', hotSpring: true }, async (page) => {
  await page.locator('[data-bot-standby]').click();
});
await shoot('penguin-writing-paper', { layout: 'windows' }, async (page) => {
  await page.locator('[data-windows-icons] [data-app-icon="writing"]').dblclick();
  await page.waitForSelector('[data-app-window="writing"]');
});

await browser.close();
console.log('done');
