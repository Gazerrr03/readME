/* Samples real pixel colors around the penguin to verify ink inversion. */
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

// Pixel sampling via a 1x1 canvas draw of a full-page screenshot is heavy;
// instead use elementFromPoint + computed backgrounds is unreliable for SVG,
// so capture a tight screenshot and decode it in-page with createImageBitmap.
const box = await page.locator('[data-bot-sprite]').boundingBox();
const shot = await page.screenshot({
  clip: { x: box.x - 20, y: box.y - 20, width: box.width + 40, height: box.height + 40 },
});

const pixels = await page.evaluate(async ({ b64, spriteWidth, spriteHeight }) => {
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const blob = new Blob([bytes], { type: 'image/png' });
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0);
  const at = (x, y) => [...ctx.getImageData(x, y, 1, 1).data.slice(0, 3)];
  return {
    size: [bitmap.width, bitmap.height],
    // clip origin is sprite box minus 20px padding
    desktopUpperLeft: at(2, 2),
    spriteTopCenter: at(20 + Math.round(spriteWidth / 2), 20 + Math.round(spriteHeight * 0.16)),
    spriteFaceCenter: at(20 + Math.round(spriteWidth / 2), 20 + Math.round(spriteHeight * 0.34)),
    spriteBellyCenter: at(20 + Math.round(spriteWidth / 2), 20 + Math.round(spriteHeight * 0.65)),
    spriteFootArea: at(20 + Math.round(spriteWidth / 2), 20 + Math.round(spriteHeight * 0.91)),
  };
}, {
  b64: shot.toString('base64'),
  spriteWidth: box.width,
  spriteHeight: box.height,
});

console.log(JSON.stringify(pixels, null, 2));
await browser.close();
