/* Structured visual check of the real blog reader in the writing app.
 * Cannot read screenshots in this environment, so assert geometry/computed
 * styles via Playwright and still save captures for the user.
 */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const BASE = 'http://127.0.0.1:4173';
const OUT = new URL('../screenshots/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
let failures = 0;
const check = (name, ok, detail = '') => {
  console.log(`${ok ? '✔' : '✘'} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures += 1;
};

async function openContext(locale) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.addInitScript((preferences) => {
    localStorage.setItem('portfolio-os:preferences', JSON.stringify(preferences));
  }, { version: 1, bootComplete: true, layout: 'windows', locale, audioEnabled: false });
  await page.goto(BASE);
  await page.locator('[data-app-icon="writing"]').click();
  const window_ = page.locator('[data-app-window="writing"]');
  await window_.locator('[data-writing-open]').first().click();
  return { context, page, window_ };
}

// --- English reader ---
{
  const { context, page, window_ } = await openContext('en');

  check('reader opens pinned real blog',
    await window_.locator('[data-writing-reader] h3').textContent() === 'When Information Starts Thinking for Me');

  check('first paragraph (after section head) carries the lead drop-cap',
    await window_.locator('[data-writing-body] > p[data-writing-lead]').count() === 1
      && await window_.locator('[data-writing-body] > p:first-of-type').getAttribute('data-writing-lead') !== null);

  check('lead contains prologue opener',
    (await window_.locator('[data-writing-lead]').textContent()).includes('August of last year'));

  check('13 section headings render as h4',
    await window_.locator('[data-writing-section]').count() === 13);

  check('first heading is 前言-equivalent Prologue',
    (await window_.locator('[data-writing-section]').first().textContent()) === 'Prologue');

  check('section heading is serif with top border',
    await window_.locator('[data-writing-section]').first().evaluate((el) => {
      const s = getComputedStyle(el);
      return s.fontFamily.includes('serif') && s.borderTopStyle === 'solid';
    }));

  check('7 reference links render with target=_blank',
    await window_.locator('[data-writing-body] a').count() === 7
      && await window_.locator('[data-writing-body] a[target="_blank"]').count() === 7);

  check('position is 01 / 09',
    (await window_.locator('[data-writing-position]').textContent()) === '01 / 09');

  check('reader is fullscreen',
    await window_.getAttribute('data-window-fullscreen') === 'true');

  // Scroll to a middle section to show heading + prose band.
  await window_.locator('[data-writing-section]').nth(3).scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${OUT}writing-reader-sections.png` });

  // Scroll to references (links + Mem0 series heading).
  await window_.locator('[data-writing-section]').last().scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${OUT}writing-reader-references.png` });

  // Back to top for the main capture.
  await window_.evaluate((el) => { el.scrollTop = 0; });
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${OUT}writing-reader.png` });

  await context.close();
}

// --- Chinese reader ---
{
  const { context, page, window_ } = await openContext('zh-CN');

  check('zh title renders',
    await window_.locator('[data-writing-reader] h3').textContent() === '当信息开始替我思考');

  check('zh lead keeps native opening',
    (await window_.locator('[data-writing-lead]').textContent()).includes('去年的八月'));

  check('zh first section is 前言',
    (await window_.locator('[data-writing-section]').first().textContent()) === '前言');

  check('zh reference link keeps Chinese annotation',
    (await window_.locator('[data-writing-body] a').first().textContent()).includes('记忆悖论'));

  await page.screenshot({ path: `${OUT}writing-reader-zh.png` });
  await context.close();
}

// --- Japanese reader ---
{
  const { context, page, window_ } = await openContext('ja');

  check('ja title renders',
    await window_.locator('[data-writing-reader] h3').textContent() === '情報が、私の代わりに考え始めるとき');

  check('ja lead keeps native opener',
    (await window_.locator('[data-writing-lead]').textContent()).includes('去年の八月'));

  check('ja section count matches',
    await window_.locator('[data-writing-section]').count() === 13);

  await page.screenshot({ path: `${OUT}writing-reader-ja.png` });
  await context.close();
}

await browser.close();
console.log(failures === 0 ? '\nall checks passed' : `\n${failures} checks FAILED`);
process.exit(failures === 0 ? 0 : 1);
