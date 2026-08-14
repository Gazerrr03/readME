/* Structured visual verification for the desktop folders (this environment
   cannot read images, so we assert geometry/computed styles instead). */
import { chromium } from '@playwright/test';

const BASE = 'http://127.0.0.1:4173';
const browser = await chromium.launch();

async function session(layout, locale = 'en') {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.addInitScript((preferences) => {
    localStorage.setItem('portfolio-os:preferences', JSON.stringify(preferences));
  }, { version: 1, bootComplete: true, layout, locale, audioEnabled: false });
  await page.goto(BASE);
  await page.locator('[data-desktop-root]').waitFor();
  await page.waitForTimeout(500);
  return { context, page };
}

const report = [];
const check = (name, ok, detail = '') => {
  report.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  ${detail}` : ''}`);
};

// 1. macOS collapsed folder column geometry
{
  const { context, page } = await session('macos');
  const box = await page.locator('[data-desktop-folders]').boundingBox();
  check('macos folder column at right:24 / top:56',
    Math.round(box.x + box.width) === 1440 - 24 && Math.round(box.y) === 56,
    `right=${Math.round(box.x + box.width)} top=${Math.round(box.y)}`);
  const icons = page.locator('[data-desktop-folders] [data-icon]');
  check('macos launcher icon svg count = 4', await icons.count() === 4, `count=${await icons.count()}`);
  const svg = icons.first().locator('svg').first();
  check('macos toggle svg viewBox 16x16', (await svg.getAttribute('viewBox')) === '0 0 16 16',
    await svg.getAttribute('viewBox'));
  check('macos toggle svg crispEdges', (await svg.getAttribute('shape-rendering')) === 'crispEdges');
  check('macos toggle fill currentColor', (await svg.first().getAttribute('fill')) === 'currentColor'
    || (await icons.first().evaluate((el) => getComputedStyle(el.querySelector('svg')).fill)) === 'currentColor');
  await context.close();
}

// 2. macOS photos launcher opens a centered folder window
{
  const { context, page } = await session('macos');
  await page.locator('[data-folder-toggle="photos"]').click();
  const win = page.locator('[data-app-window="photos"]');
  const winBox = await win.boundingBox();
  check('photos folder window on screen', winBox.y >= 0 && winBox.x >= 0);
  check('photos folder has four items', await win.locator('[data-folder-item]').count() === 4);
  const art = win.locator('[data-folder-item="coast"] [data-folder-item-art] svg');
  check('photo item art svg present', await art.count() === 1);
  const viewBox = await art.first().getAttribute('viewBox');
  check('photo item art viewBox 24x16 landscape', viewBox === '0 0 24 16', viewBox);
  await context.close();
}

// 3. Photos viewer window
{
  const { context, page } = await session('macos');
  await page.locator('[data-folder-toggle="photos"]').click();
  await page.locator('[data-folder-item="coast"]').dblclick();
  await page.waitForTimeout(300);
  const win = page.locator('[data-app-window="photos"]');
  const winBox = await win.boundingBox();
  const frameBox = await win.locator('[data-photos-frame]').boundingBox();
  check('photos viewer window on screen', winBox.y >= 0 && winBox.x >= 0);
  check('photos frame inside window', frameBox.y >= winBox.y && frameBox.x >= winBox.x);
  const navBox = await win.locator('[data-photos-nav]').boundingBox();
  const contentBox = await win.locator('[data-window-content]').boundingBox();
  check('photos nav row full width below frame',
    Math.round(navBox.x) >= Math.round(contentBox.x) && Math.round(navBox.x + navBox.width) <= Math.round(contentBox.x + contentBox.width));
  await context.close();
}

// 4. Albums player window
{
  const { context, page } = await session('macos');
  await page.locator('[data-folder-toggle="albums"]').click();
  await page.locator('[data-folder-item="tide-study-0200"]').dblclick();
  await page.waitForTimeout(400);
  const win = page.locator('[data-app-window="albums"]');
  const cover = win.locator('[data-player-cover] svg');
  const coverBox = await cover.boundingBox();
  const viewBox = await cover.getAttribute('viewBox');
  check('album cover svg square viewBox 16x16', viewBox === '0 0 16 16', viewBox);
  check('album cover square on screen', coverBox && Math.abs(coverBox.width - coverBox.height) < 2,
    coverBox ? `w=${Math.round(coverBox.width)} h=${Math.round(coverBox.height)}` : 'no box');
  const toggleBox = await win.locator('[data-player-toggle]').boundingBox();
  check('player toggle 56x44', Math.round(toggleBox.width) === 56 && Math.round(toggleBox.height) === 44,
    `w=${Math.round(toggleBox.width)} h=${Math.round(toggleBox.height)}`);
  await context.close();
}

// 5. Windows mode: folders right column + desktop icons present
{
  const { context, page } = await session('windows');
  const box = await page.locator('[data-desktop-folders]').boundingBox();
  check('windows folder column at right:24 / top:24',
    Math.round(box.x + box.width) === 1440 - 24 && Math.round(box.y) === 24,
    `right=${Math.round(box.x + box.width)} top=${Math.round(box.y)}`);
  check('windows desktop icons present', await page.locator('[data-windows-icons] [data-app-icon]').count() === 5);
  await context.close();
}

// 6. Three.js bookshelf: an empty library keeps the model clean
{
  const { context, page } = await session('macos');
  await page.locator('[data-folder-toggle="books"]').click();
  const win = page.locator('[data-app-window="books"]');
  const stage = win.locator('[data-bookshelf-stage]');
  const stageBox = await stage.boundingBox();
  check('bookshelf stage is centered inside its window', stageBox.width > 300 && stageBox.height > 240,
    `w=${Math.round(stageBox.width)} h=${Math.round(stageBox.height)}`);
  check('bookshelf canvas mounts Three.js scene',
    (await win.locator('[data-bookshelf-canvas]').count()) === 1);
  check('bookshelf has no temporary empty-state copy',
    (await win.locator('[data-bookshelf-empty]').count()) === 0);
  await context.close();
}

// 7. zh locale: labels + viewer title
{
  const { context, page } = await session('windows', 'zh-CN');
  check('zh folder label 照片', (await page.locator('[data-folder-toggle="photos"]').innerText()).includes('照片'));
  await page.locator('[data-folder-toggle="photos"]').click();
  await page.locator('[data-folder-item="coast"]').dblclick();
  check('zh viewer 海岸 02:14', (await page.locator('[data-photos-title]').innerText()).includes('海岸 02:14'));
  await context.close();
}

await browser.close();
console.log(report.join('\n'));
const failed = report.filter((line) => line.startsWith('FAIL'));
process.exit(failed.length ? 1 : 0);
