/* Finds what actually paints the desktop surface white in screenshots. */
import { chromium } from '@playwright/test';

const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await page.addInitScript(() => {
  localStorage.setItem('portfolio-os:preferences', JSON.stringify({
    version: 1, bootComplete: true, layout: 'windows', locale: 'en', audioEnabled: false,
  }));
});
await page.goto('http://127.0.0.1:4173');
await page.waitForSelector('[data-bot-sprite]');
await page.waitForTimeout(400);

const report = await page.evaluate(() => {
  const root = document.querySelector('[data-desktop-root]');
  const rootBox = root.getBoundingClientRect();
  const cs = getComputedStyle(root);
  const info = (el) => el && ({
    tag: el.tagName,
    data: JSON.stringify(el.dataset),
    box: el.getBoundingClientRect().toJSON(),
    bg: getComputedStyle(el).backgroundColor,
    bgImage: getComputedStyle(el).backgroundImage,
    opacity: getComputedStyle(el).opacity,
    zIndex: getComputedStyle(el).zIndex,
    position: getComputedStyle(el).position,
    hidden: el.hidden,
  });
  const pseudo = (el, p) => {
    const s = getComputedStyle(el, p);
    return { content: s.content, bg: s.backgroundColor, display: s.display };
  };
  // every element overlapping the desktop center point
  const cx = 720, cy = 450;
  const stack = document.elementsFromPoint(cx, cy);
  return {
    forcedColors: matchMedia('(forced-colors: active)').matches,
    rootBox: rootBox.toJSON(),
    rootBg: cs.backgroundColor,
    rootBgImage: cs.backgroundImage,
    rootPseudoBefore: pseudo(root, '::before'),
    rootPseudoAfter: pseudo(root, '::after'),
    stackAtCenter: stack.map(info),
  };
});
console.log(JSON.stringify(report, null, 2));
await browser.close();
