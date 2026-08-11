import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto('https://variant.com/shared/2a3a9f53-0434-416c-808e-841c5d289ae1?t=1786454077620', { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(6000);
await page.screenshot({ path: 'screenshots/variant-ring.png', fullPage: true });
const info = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll('body *').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 5 || r.height < 5) return;
    const cs = getComputedStyle(el);
    const text = el.children.length === 0 ? el.textContent?.trim().slice(0, 60) : '';
    if (text || el.tagName === 'IMG' || el.tagName === 'CANVAS' || el.tagName === 'SVG') {
      out.push({
        tag: el.tagName.toLowerCase(),
        text,
        rect: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)],
        transform: cs.transform !== 'none' ? cs.transform : undefined,
        font: `${cs.fontFamily.split(',')[0]} ${cs.fontSize} ${cs.fontWeight}`,
        color: cs.color, bg: cs.backgroundColor, radius: cs.borderRadius, border: cs.border,
      });
    }
  });
  return out.slice(0, 150);
});
console.log(JSON.stringify(info, null, 1));
await browser.close();
