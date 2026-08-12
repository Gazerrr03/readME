// Local verification (Windows + system Edge):
// 1. Clicking inside the active Settings window must not bump its z-index or
//    churn the DOM — that churn is what dismisses the native <select> popup.
// 2. Windows desktop icons mirror the macOS dock visuals (46px tiles, chips).
import { chromium } from '@playwright/test';

const URL = 'http://127.0.0.1:4173/?skipBoot=1';
const failures = [];
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` (${detail})` : ''}`);
  if (!ok) failures.push(name);
};

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
await page.addInitScript(() => {
  localStorage.setItem('portfolio-os:preferences', JSON.stringify({ version: 1, layout: 'windows', bootComplete: true }));
});
await page.goto(URL);
await page.locator('[data-desktop-mode="windows"]').waitFor();

// Open Settings via double-click on the desktop icon.
await page.locator('[data-windows-icons] [data-app-icon="settings"]').dblclick();
const appWindow = page.locator('[data-app-window="settings"]');
await appWindow.waitFor();
await page.waitForTimeout(350); // let entry animations settle

// 1. Select click must not restack/re-render the window.
const select = appWindow.locator('select[name="layout"]');
const zBefore = await appWindow.evaluate((el) => el.style.zIndex);
const domSnapshot = await appWindow.evaluate((el) => el.outerHTML.length);
await select.click();
await page.waitForTimeout(300);
const zAfter = await appWindow.evaluate((el) => el.style.zIndex);
const domAfter = await appWindow.evaluate((el) => el.outerHTML.length);
check('settings z-index unchanged after clicking the layout select', zBefore === zAfter, `${zBefore} -> ${zAfter}`);
check('settings DOM size unchanged after clicking the layout select', domSnapshot === domAfter, `${domSnapshot} -> ${domAfter}`);

// Select stays focused and interactive while its popup would be open.
await select.click();
await page.waitForTimeout(150);
check('layout select remains the active element', await select.evaluate((el) => el === document.activeElement));

// Choosing a value applies the layout without throwing.
await select.selectOption('macos');
await page.waitForTimeout(200);
check('layout switch to macos applies', await page.locator('[data-desktop-mode="macos"]').count() === 1);

// 2. Icon visual parity between Windows desktop and macOS dock.
const iconMetrics = async (selector) => page.evaluate((sel) => {
  const icon = document.querySelector(`${sel} [data-icon]`);
  const label = document.querySelector(`${sel} [data-app-label]`);
  const iconBox = icon.getBoundingClientRect();
  const labelStyle = getComputedStyle(label);
  return {
    tile: Math.round(iconBox.width),
    shadow: getComputedStyle(icon).boxShadow,
    labelBackground: labelStyle.backgroundColor,
    labelColor: labelStyle.color,
  };
}, selector);

await page.locator('[data-desktop-mode="macos"] [data-macos-dock]').waitFor();
const dock = await iconMetrics('[data-macos-dock]');

// Switch back to windows to measure desktop icons.
await page.evaluate(() => localStorage.setItem('portfolio-os:preferences', JSON.stringify({ version: 1, layout: 'windows', bootComplete: true })));
await page.goto(URL);
await page.locator('[data-desktop-mode="windows"]').waitFor();
const desktopIcons = await iconMetrics('[data-windows-icons]');

check('windows desktop icon tile matches dock tile (46px)', desktopIcons.tile === dock.tile, `desktop=${desktopIcons.tile} dock=${dock.tile}`);
check('windows desktop label uses the same chip as the dock',
  desktopIcons.labelBackground === dock.labelBackground && desktopIcons.labelColor === dock.labelColor,
  `${desktopIcons.labelBackground}/${desktopIcons.labelColor} vs ${dock.labelBackground}/${dock.labelColor}`);
check('windows desktop icon shadow adapts to amber on night',
  desktopIcons.shadow.includes('rgb(255, 180, 84)'), desktopIcons.shadow);
check('windows desktop grid keeps 5 icons',
  await page.locator('[data-windows-icons] [data-app-icon]').count() === 5);

await browser.close();
if (failures.length) {
  console.error(`\n${failures.length} check(s) failed.`);
  process.exit(1);
}
console.log('\nAll checks passed.');
