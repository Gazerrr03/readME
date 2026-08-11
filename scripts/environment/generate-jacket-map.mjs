import { readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const sourcePage = 'https://music.apple.com/jp/album/%E3%81%A0%E3%81%8B%E3%82%89%E5%83%95%E3%81%AF%E9%9F%B3%E6%A5%BD%E3%82%92%E8%BE%9E%E3%82%81%E3%81%9F/1648876058';
const sourceImage = 'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/64/ab/ba/64abba45-d080-0e8a-c24b-313e597c63cb/PA00076158_0_91679_jacket.jpg/1200x1200bb.jpg';
const localImage = new URL('../../media/sources/yorushika-music-jacket.jpeg', import.meta.url);
const attribution = 'ヨルシカ『だから僕は音楽を辞めた』jacket artwork (© U&R records / Universal Music LLC)';
const width = 495;
const height = 300;
const crop = { x: 0, y: 380, width: 1200, height: 723 };

let buffer;
let mime = 'image/jpeg';
try {
  buffer = await readFile(localImage);
} catch {
  const response = await fetch(sourceImage);
  if (!response.ok) throw new Error(`Failed to fetch jacket artwork: ${response.status}`);
  buffer = Buffer.from(await response.arrayBuffer());
}
const dataUri = `data:${mime};base64,${buffer.toString('base64')}`;

const browser = await chromium.launch();
const page = await browser.newPage();

try {
  const values = await page.evaluate(async ({ dataUri, width, height, crop }) => {
    const image = new Image();
    image.src = dataUri;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    const scaleX = image.naturalWidth / 1200;
    const scaleY = image.naturalHeight / 1200;
    context.drawImage(
      image,
      crop.x * scaleX, crop.y * scaleY, crop.width * scaleX, crop.height * scaleY,
      0, 0, width, height,
    );
    const pixels = context.getImageData(0, 0, width, height).data;
    const luminance = [];
    for (let index = 0; index < pixels.length; index += 4) {
      luminance.push(
        pixels[index] * 0.2126
        + pixels[index + 1] * 0.7152
        + pixels[index + 2] * 0.0722,
      );
    }
    const sorted = [...luminance].sort((a, b) => a - b);
    const lo = sorted[Math.floor(sorted.length * 0.02)];
    const hi = sorted[Math.floor(sorted.length * 0.98)];
    return luminance.map((value) => {
      const stretched = Math.max(0, Math.min(1, (value - lo) / (hi - lo)));
      return Math.round(255 * stretched ** 1.05);
    });
  }, { dataUri, width, height, crop });
  const moduleSource = `export const JACKET_MAP = Object.freeze(${JSON.stringify({
    sourcePage, sourceImage, attribution, width, height, values,
  })});\n`;
  await writeFile(new URL('./jacket-map.js', import.meta.url), moduleSource);
} finally {
  await browser.close();
}
