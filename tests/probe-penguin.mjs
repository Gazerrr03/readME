/* Probes the desktop surface color and the penguin sprite rendering. */
import { chromium } from '@playwright/test';

const BASE = 'http://127.0.0.1:4173';
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
await page.addInitScript(() => {
  localStorage.setItem('portfolio-os:preferences', JSON.stringify({
    version: 1, bootComplete: true, layout: 'windows', locale: 'en', audioEnabled: false,
  }));
});
await page.goto(BASE);
await page.waitForSelector('[data-bot-sprite]');

const probe = await page.evaluate(() => {
  const root = document.querySelector('[data-desktop-root]');
  const sprite = document.querySelector('[data-bot-sprite]');
  const box = sprite.getBoundingClientRect();
  const inkGroup = sprite.querySelector('g');
  return {
    desktopBackground: getComputedStyle(root).backgroundColor,
    desktopMode: root.dataset.desktopMode,
    spriteSize: { width: box.width, height: box.height },
    inkFill: inkGroup?.getAttribute('fill'),
    childCount: sprite.childElementCount,
    dotCount: sprite.querySelectorAll('g:nth-of-type(2) rect').length,
    sampleSVG: sprite.outerHTML.slice(0, 300),
  };
});
console.log(JSON.stringify(probe, null, 2));

await browser.close();
