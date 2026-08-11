/* Captures the unified pixel icons on both desktops (screenshots/ directory). */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const BASE = 'http://127.0.0.1:4173';
const OUT = new URL('../screenshots/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

async function shoot(name, layout, actions) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.addInitScript((preferences) => {
    localStorage.setItem('portfolio-os:preferences', JSON.stringify(preferences));
  }, { version: 1, bootComplete: true, layout, locale: 'en', audioEnabled: false });
  await page.goto(BASE);
  if (actions) await actions(page);
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}${name}.png` });
  await context.close();
  console.log(`captured ${name}`);
}

await shoot('icons-windows', 'windows', async (page) => {
  await page.locator('[data-app-icon="writing"]').click();
});

await shoot('icons-macos', 'macos', async (page) => {
  await page.locator('[data-macos-dock] [data-app-icon="contact"]').click();
});

await browser.close();
console.log('done');
