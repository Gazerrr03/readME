/* Captures the four new app windows for visual review (screenshots/ directory). */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const BASE = 'http://127.0.0.1:4173';
const OUT = new URL('../screenshots/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

async function shoot(name, { layout = 'windows', viewport = { width: 1440, height: 900 }, locale = 'en' }, actions) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await page.addInitScript((preferences) => {
    localStorage.setItem('portfolio-os:preferences', JSON.stringify(preferences));
  }, { version: 1, bootComplete: true, layout, locale, audioEnabled: false });
  await page.goto(BASE);
  await actions(page);
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}${name}.png` });
  await context.close();
  console.log(`captured ${name}`);
}

const openWindowsApp = (id, double = true) => async (page) => {
  const icon = page.locator(`[data-app-icon="${id}"]`);
  if (double) await icon.dblclick();
  else await icon.click();
};

await shoot('projects-ring', {}, async (page) => {
  await openWindowsApp('projects')(page);
  await page.waitForTimeout(900);
});

await shoot('projects-detail', {}, async (page) => {
  await openWindowsApp('projects')(page);
  const appWindow = page.locator('[data-app-window="projects"]');
  await appWindow.locator('[data-projects-card][aria-current="true"]').click();
  await page.waitForTimeout(900);
});

await shoot('writing-reader', {}, async (page) => {
  await openWindowsApp('writing')(page);
  await page.locator('[data-writing-open]').first().click();
});

await shoot('about', {}, openWindowsApp('about'));
await shoot('contact', {}, openWindowsApp('contact'));

await shoot('macos-projects-zh', { layout: 'macos', locale: 'zh-CN' }, async (page) => {
  await page.locator('[data-macos-dock] [data-app-icon="projects"]').dblclick();
  await page.waitForTimeout(900);
});

await shoot('narrow-projects-ring', { viewport: { width: 390, height: 844 } }, async (page) => {
  await openWindowsApp('projects', false)(page);
  await page.waitForTimeout(900);
});

await shoot('narrow-writing', { viewport: { width: 390, height: 844 } }, openWindowsApp('writing', false));

await shoot('narrow-writing-reader', { viewport: { width: 390, height: 844 } }, async (page) => {
  await openWindowsApp('writing', false)(page);
  await page.locator('[data-writing-open]').first().click();
});

await browser.close();
console.log('done');
