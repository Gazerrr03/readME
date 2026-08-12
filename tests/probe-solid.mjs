/* Isolates whether the headless shell renders solid backgrounds in screenshots. */
import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';

const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 400, height: 300 } })).newPage();
await page.setContent('<div style="width:400px;height:300px;background:#26159a;display:flex;align-items:center;justify-content:center"><span style="color:#fff;font-family:monospace">INK TEST</span></div>');
const buf = await page.screenshot();
writeFileSync('g:/My Portfolio/readME/screenshots/debug-solid.png', buf);

const pixels = await page.evaluate(async (b64) => {
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const bmp = await createImageBitmap(new Blob([bytes], { type: 'image/png' }));
  const canvas = Object.assign(document.createElement('canvas'), { width: bmp.width, height: bmp.height });
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bmp, 0, 0);
  const at = (x, y) => [...ctx.getImageData(x, y, 1, 1).data.slice(0, 3)];
  return { corner: at(2, 2), center: at(200, 20) };
}, buf.toString('base64'));
console.log(JSON.stringify(pixels));
await browser.close();
