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
  check('macos toggle icon svg count = 2', await icons.count() === 2, `count=${await icons.count()}`);
  const svg = icons.first().locator('svg').first();
  check('macos toggle svg viewBox 16x16', (await svg.getAttribute('viewBox')) === '0 0 16 16',
    await svg.getAttribute('viewBox'));
  check('macos toggle svg crispEdges', (await svg.getAttribute('shape-rendering')) === 'crispEdges');
  check('macos toggle fill currentColor', (await svg.first().getAttribute('fill')) === 'currentColor'
    || (await icons.first().evaluate((el) => getComputedStyle(el.querySelector('svg')).fill)) === 'currentColor');
  await context.close();
}

// 2. macOS expanded photos: stamps slide out to the LEFT, below-ish of toggle, staggered
{
  const { context, page } = await session('macos');
  await page.locator('[data-folder-toggle="photos"]').click();
  await page.waitForTimeout(600);
  const toggleBox = await page.locator('[data-folder-toggle="photos"]').boundingBox();
  const stamps = page.locator('[data-folder-stamps="photos"] [data-stamp]');
  const count = await stamps.count();
  const stampBoxes = [];
  for (let i = 0; i < count; i++) stampBoxes.push(await stamps.nth(i).boundingBox());
  check('photos expanded: 4 stamps', count === 4, `count=${count}`);
  const sorted = [...stampBoxes].sort((a, b) => a.x - b.x);
  check('stamps spread horizontally to the left of the toggle',
    sorted.every((b) => b.x + b.width <= toggleBox.x),
    `leftmost x=${Math.round(sorted[0].x)} toggle left=${Math.round(toggleBox.x)}`);
  check('stamps do not overlap horizontally',
    sorted.every((b, i) => i === 0 || b.x >= sorted[i - 1].x + sorted[i - 1].width - 1));
  const art = page.locator('[data-stamp="coast"] [data-stamp-art] svg');
  check('stamp art svg present', await art.count() === 1);
  const viewBox = await art.first().getAttribute('viewBox');
  check('stamp art viewBox 24x16 landscape', viewBox === '0 0 24 16', viewBox);
  await context.close();
}

// 3. Photos viewer window
{
  const { context, page } = await session('macos');
  await page.locator('[data-folder-toggle="photos"]').click();
  await page.locator('[data-stamp="coast"]').click();
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
  await page.locator('[data-stamp="tide-study-0200"]').click();
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

// 5. Windows mode: folders right column + taskbar pins present
{
  const { context, page } = await session('windows');
  const box = await page.locator('[data-desktop-folders]').boundingBox();
  check('windows folder column at right:24 / top:24',
    Math.round(box.x + box.width) === 1440 - 24 && Math.round(box.y) === 24,
    `right=${Math.round(box.x + box.width)} top=${Math.round(box.y)}`);
  check('windows taskbar pins present', await page.locator('[data-taskbar-pins] [data-app-icon]').count() === 5);
  await context.close();
}

// 6. zh locale: labels + stamp title
{
  const { context, page } = await session('windows', 'zh-CN');
  check('zh folder label 照片', (await page.locator('[data-folder-toggle="photos"]').innerText()).includes('照片'));
  await page.locator('[data-folder-toggle="photos"]').click();
  check('zh stamp 海岸 02:14', (await page.locator('[data-stamp="coast"]').innerText()).includes('海岸 02:14'));
  await context.close();
}

await browser.close();
console.log(report.join('\n'));
const failed = report.filter((line) => line.startsWith('FAIL'));
process.exit(failed.length ? 1 : 0);
