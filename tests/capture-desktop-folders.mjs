/* Captures the collection launchers for visual review: the desktop cluster,
   folder windows, content viewers, and the mobile launcher. */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const BASE = 'http://127.0.0.1:4173';
const OUT = new URL('../screenshots/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

async function shoot(name, { layout, viewport, act }) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await page.addInitScript((preferences) => {
    localStorage.setItem('portfolio-os:preferences', JSON.stringify(preferences));
  }, { version: 1, bootComplete: true, layout, locale: 'en', audioEnabled: false });
  await page.goto(BASE);
  await page.locator('[data-desktop-root]').waitFor();
  await page.waitForTimeout(600);
  if (act) {
    await act(page);
    await page.waitForTimeout(600);
  }
  await page.screenshot({ path: `${OUT}${name}.png` });
  await context.close();
  console.log(`captured ${name}`);
}

const DESKTOP = { width: 1440, height: 900 };

await shoot('folders-macos-collapsed', { layout: 'macos', viewport: DESKTOP });
await shoot('folders-macos-photos-window', {
  layout: 'macos',
  viewport: DESKTOP,
  act: (page) => page.locator('[data-folder-toggle="photos"]').click(),
});
await shoot('folders-macos-albums-window', {
  layout: 'macos',
  viewport: DESKTOP,
  act: (page) => page.locator('[data-folder-toggle="albums"]').click(),
});
await shoot('folders-windows-collapsed', { layout: 'windows', viewport: DESKTOP });
await shoot('folders-windows-photos-window', {
  layout: 'windows',
  viewport: DESKTOP,
  act: (page) => page.locator('[data-folder-toggle="photos"]').click(),
});
await shoot('folders-photos-viewer', {
  layout: 'macos',
  viewport: DESKTOP,
  act: async (page) => {
    await page.locator('[data-folder-toggle="photos"]').click();
    await page.locator('[data-folder-item="coast"]').dblclick();
  },
});
await shoot('folders-albums-player', {
  layout: 'macos',
  viewport: DESKTOP,
  act: async (page) => {
    await page.locator('[data-folder-toggle="albums"]').click();
    await page.locator('[data-folder-item="tide-study-0200"]').dblclick();
  },
});
await shoot('folders-bookshelf-empty', {
  layout: 'macos',
  viewport: DESKTOP,
  act: (page) => page.locator('[data-folder-toggle="books"]').click(),
});
await shoot('folders-macos-phone', { layout: 'macos', viewport: { width: 390, height: 844 } });

await browser.close();
