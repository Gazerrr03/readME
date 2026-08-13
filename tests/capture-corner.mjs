/* Captures the upper-left corner after the ink-blue hue convergence. */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const BASE = 'http://127.0.0.1:4173';
const OUT = new URL('../screenshots/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

async function shoot(name, layout, clip, actions) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.addInitScript((preferences) => {
    localStorage.setItem('portfolio-os:preferences', JSON.stringify(preferences));
  }, { version: 1, bootComplete: true, layout, locale: 'en', audioEnabled: false });
  await page.goto(BASE);
  if (actions) await actions(page);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}${name}.png`, clip });
  await context.close();
  console.log(`captured ${name}`);
}

const corner = { x: 0, y: 0, width: 560, height: 420 };

await shoot('corner-windows', 'windows', corner, async (page) => {
  await page.locator('[data-windows-icons] [data-app-icon="writing"]').click();
});

await shoot('corner-macos', 'macos', corner);

await browser.close();
console.log('done');
