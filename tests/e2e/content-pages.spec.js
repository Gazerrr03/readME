import { test, expect } from '@playwright/test';
import { articles } from '../../scripts/data/content.js';

const firstArticle = articles[0];

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
});

test('article URL loads and reloads as an independent document', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto(`/writing/${firstArticle.slug}/`);

  await expect(page.locator('[data-content-article]')).toBeVisible();
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('h1')).toHaveText(firstArticle.title.en);
  await expect(page.locator('[data-desktop-root]')).toHaveCount(0);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /August of last year/);
  await expect(page.locator('[data-content-return]')).toHaveAttribute('href', '?open=writing');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');

  const pathname = new URL(page.url()).pathname;
  await page.reload();
  await expect(page.locator('[data-content-article]')).toBeVisible();
  expect(new URL(page.url()).pathname).toBe(pathname);
  expect(errors).toEqual([]);
});

test('article language follows browser preference and changes without changing the URL', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'languages', { value: ['ja-JP'], configurable: true });
  });
  await page.goto(`/writing/${firstArticle.slug}/`);
  await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
  await expect(page.locator('h1')).toHaveText(firstArticle.title.ja);

  const url = page.url();
  await page.locator('[data-content-language]').selectOption('zh-CN');
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await expect(page.locator('h1')).toHaveText(firstArticle.title['zh-CN']);
  expect(page.url()).toBe(url);
  await expect.poll(() => page.evaluate(() => (
    JSON.parse(localStorage.getItem('portfolio-os:preferences')).locale
  ))).toBe('zh-CN');
});
