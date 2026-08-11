import { writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const sourcePage = 'https://unsplash.com/photos/KMn4VEeEPR8';
const sourceImage = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=90';
const attribution = 'Photo by Sean Oulashin on Unsplash';
const width = 120;
const height = 42;
const browser = await chromium.launch();
const page = await browser.newPage();

try {
  const values = await page.evaluate(async ({ sourceImage, width, height }) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = sourceImage;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(image, 0, 0, width, height);
    const pixels = context.getImageData(0, 0, width, height).data;
    const luminance = [];
    for (let index = 0; index < pixels.length; index += 4) {
      luminance.push(Math.round(
        pixels[index] * 0.2126
        + pixels[index + 1] * 0.7152
        + pixels[index + 2] * 0.0722,
      ));
    }
    return luminance;
  }, { sourceImage, width, height });
  const moduleSource = `export const OPEN_HORIZON_MAP = Object.freeze(${JSON.stringify({
    sourcePage, sourceImage, attribution, width, height, values,
  })});\n`;
  await writeFile(new URL('./open-horizon-map.js', import.meta.url), moduleSource);
} finally {
  await browser.close();
}
