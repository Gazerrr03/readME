/* Captures the macOS environment music deck (idle / playing / zh-CN) for visual review. */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const BASE = 'http://127.0.0.1:4173';
const OUT = new URL('../screenshots/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

async function shoot(name, { locale = 'en' }, actions) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.addInitScript((preferences) => {
    localStorage.setItem('portfolio-os:preferences', JSON.stringify(preferences));
  }, { version: 1, bootComplete: true, layout: 'macos', locale, audioEnabled: false });
  await page.goto(BASE);
  await actions(page);
  await page.waitForTimeout(400);
  const widgets = page.locator('[data-environment-widgets]');
  await widgets.screenshot({ path: `${OUT}${name}.png` });
  await page.screenshot({ path: `${OUT}${name}-desktop.png` });
  await context.close();
  console.log(`captured ${name}`);
}

await shoot('deck-idle', {}, async () => {});

await shoot('deck-playing', {}, async (page) => {
  await page.locator('[data-deck-toggle]').click();
  await page.waitForTimeout(1200);
});

await shoot('deck-zh', { locale: 'zh-CN' }, async (page) => {
  await page.locator('[data-deck-next]').click();
  await page.locator('[data-deck-toggle]').click();
  await page.waitForTimeout(900);
});

await browser.close();
