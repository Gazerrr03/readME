/* Zoomed captures of each pixel icon for close inspection. */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const BASE = 'http://127.0.0.1:4173';
const OUT = new URL('../screenshots/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 4 });
const page = await context.newPage();
await page.addInitScript((preferences) => {
  localStorage.setItem('portfolio-os:preferences', JSON.stringify(preferences));
}, { version: 1, bootComplete: true, layout: 'windows', locale: 'en', audioEnabled: false });
await page.goto(BASE);
await page.waitForTimeout(400);

for (const id of ['projects', 'writing', 'about', 'contact', 'settings']) {
  const tile = page.locator(`[data-app-icon="${id}"] [data-icon]`);
  await tile.screenshot({ path: `${OUT}icon-zoom-${id}.png` });
  console.log(`captured ${id}`);
}

// one full-desktop shot for context
await page.screenshot({ path: `${OUT}icons-context.png` });
await browser.close();
console.log('done');
