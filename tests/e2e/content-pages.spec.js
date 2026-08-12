import { test, expect } from '@playwright/test';
import { articles, projects } from '../../scripts/data/content.js';

const firstArticle = articles[0];
const firstProject = projects[0];

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

test('project URL loads a standalone detail with its live preview and actions', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });

  await page.goto(`/projects/${firstProject.slug}/`);

  const project = page.locator('[data-content-project]');
  await expect(project).toBeVisible();
  await expect(project.locator('h1')).toHaveText(firstProject.title.en);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(project).toContainText(String(firstProject.year));
  await expect(project).toContainText(firstProject.kind);
  await expect(project).toContainText(firstProject.status);
  await expect(project).toContainText(firstProject.stack);
  await expect(project.locator('[data-content-project-canvas]')).toBeAttached();
  await expect(project.locator('a', { hasText: 'OPEN' })).toHaveAttribute('target', '_blank');
  await expect(project.locator('a', { hasText: 'SOURCE' })).toHaveAttribute('target', '_blank');
  await expect(page.locator('[data-content-return]')).toHaveAttribute('href', '?open=projects');
  await expect(page.locator('[data-desktop-root]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('explicit returns open the corresponding desktop app', async ({ page }) => {
  await page.goto(`/writing/${firstArticle.slug}/`);
  await page.evaluate(() => {
    localStorage.setItem('portfolio-os:preferences', JSON.stringify({
      version: 1,
      bootComplete: true,
      layout: 'windows',
      locale: 'en',
      audioEnabled: false,
    }));
  });
  await page.locator('[data-content-return]').click();
  await expect(page).toHaveURL(/\?open=writing$/);
  await expect(page.locator('[data-app-window="writing"]')).toBeVisible();

  await page.goto(`/projects/${firstProject.slug}/`);
  await page.locator('[data-content-return]').click();
  await expect(page).toHaveURL(/\?open=projects$/);
  await expect(page.locator('[data-app-window="projects"]')).toBeVisible();
});

test('article landmarks, locale control, and sibling navigation remain stable', async ({ page }) => {
  await page.goto(`/writing/${firstArticle.slug}/`);

  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('[data-content-language]')).toHaveAccessibleName('Language');

  const originalUrl = page.url();
  await page.locator('[data-content-language]').selectOption('zh-CN');
  await expect(page).toHaveURL(originalUrl);
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');

  await page.locator('[data-content-next]').click();
  await expect(page).toHaveURL(new RegExp(`/writing/${articles[1].slug}/$`));
  await expect(page.locator('h1')).toHaveText(articles[1].title['zh-CN']);
});

test('browser Back returns from an article to the open desktop app', async ({ page }) => {
  await page.goto('/?skipBoot=1&open=writing');
  await expect(page.locator('[data-app-window="writing"]')).toBeVisible();
  await page.locator('[data-writing-open]').first().click();
  await expect(page).toHaveURL(new RegExp(`/writing/${firstArticle.slug}/$`));

  await page.goBack();
  await expect(page).toHaveURL(/\?skipBoot=1&open=writing$/);
  await expect(page.locator('[data-app-window="writing"]')).toBeVisible();
});

test('content layouts remain contained on mobile and at 200 percent zoom', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/projects/${firstProject.slug}/`);
  await expect(page.locator('[data-content-project]')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`/writing/${firstArticle.slug}/`);
  await page.locator('body').evaluate((body) => { body.style.zoom = '2'; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expect(page.locator('[data-content-header]')).toBeVisible();
  await expect(page.locator('[data-content-pagination]')).toBeVisible();
});

test('reduced motion keeps the project preview static', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`/projects/${firstProject.slug}/`);
  const canvas = page.locator('[data-content-project-canvas]');
  await expect(canvas).toBeVisible();

  const firstFrame = await canvas.screenshot();
  await page.waitForTimeout(500);
  const secondFrame = await canvas.screenshot();
  expect(secondFrame.equals(firstFrame)).toBe(true);
});

test('GitHub Pages project base resolves content, modules, and sibling links', async ({ page }) => {
  const failed = [];
  page.on('response', (response) => {
    if (response.status() >= 400) failed.push(`${response.status()} ${response.url()}`);
  });

  await page.goto(`/readME/writing/${firstArticle.slug}/`);
  await expect(page.locator('[data-content-article]')).toBeVisible();
  await page.reload();
  await expect(page.locator('[data-content-article]')).toBeVisible();
  await page.locator('[data-content-next]').click();
  await expect(page).toHaveURL(new RegExp(`/readME/writing/${articles[1].slug}/$`));
  expect(failed).toEqual([]);
});

test('generated pages and critical assets return successful responses', async ({ request }) => {
  for (const path of [
    `/writing/${firstArticle.slug}/`,
    '/styles/content-page.css',
    '/scripts/pages/content-page.js',
    '/media/music/tide-study-0200.wav',
  ]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
  }
});
