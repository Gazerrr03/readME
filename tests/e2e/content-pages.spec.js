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

test('article language follows browser preference and switches sync the URL', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'languages', { value: ['ja-JP'], configurable: true });
  });
  await page.goto(`/writing/${firstArticle.slug}/`);
  await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
  await expect(page.locator('h1')).toHaveText(firstArticle.title.ja);

  await page.locator('[data-content-language]').selectOption('zh-CN');
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await expect(page.locator('h1')).toHaveText(firstArticle.title['zh-CN']);
  await expect(page).toHaveURL(new RegExp(`/writing/${firstArticle.slug}/\\?lang=zh-CN$`));
  await expect.poll(() => page.evaluate(() => (
    JSON.parse(localStorage.getItem('portfolio-os:preferences')).locale
  ))).toBe('zh-CN');
});

test('lang query parameter wins over stored preference', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('portfolio-os:preferences', JSON.stringify({
      version: 1, locale: 'en', bootComplete: true,
    }));
  });
  await page.goto(`/writing/${firstArticle.slug}/?lang=ja`);
  await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
  await expect(page.locator('h1')).toHaveText(firstArticle.title.ja);
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

  await page.locator('[data-content-language]').selectOption('zh-CN');
  await expect(page).toHaveURL(/lang=zh-CN$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');

  await page.locator('[data-content-next]').click();
  await expect(page).toHaveURL(new RegExp(`/writing/${articles[1].slug}/$`));
  await expect(page.locator('h1')).toHaveText(articles[1].title['zh-CN']);
});

test('article masthead exposes published, edited, minutes and a clickable tag', async ({ page }) => {
  await page.goto(`/writing/${firstArticle.slug}/`);

  const meta = page.locator('[data-content-article-meta]');
  await expect(meta.locator('[data-content-published]'))
    .toContainText(`PUBLISHED ${firstArticle.date}`);
  if (firstArticle.edited !== firstArticle.date) {
    await expect(meta.locator('[data-content-edited]'))
      .toContainText(`LAST EDITED ${firstArticle.edited}`);
  } else {
    await expect(meta.locator('[data-content-edited]')).toHaveCount(0);
  }
  await expect(meta.locator('[data-content-minutes]')).toContainText('MIN');
  await expect(page.locator('[data-content-tag]')).toHaveText(`{${firstArticle.tag}}`);
  await expect(page.locator('[data-content-tag]')).toHaveAttribute('href', '../../?open=writing');
});

test('long-form articles render quotes, field notes and markdown editions', async ({ page }) => {
  const longForm = articles.find((article) => article.notes);
  await page.goto(`/writing/${longForm.slug}/`);

  await expect(page.locator('[data-content-quote]').first()).toBeVisible();
  await expect(page.locator('[data-content-field-notes-rule]')).toBeAttached();
  await expect(page.locator('[data-content-field-notes]')).toContainText('FIELD NOTES');
  await expect(page.locator('[data-content-rights]')).toContainText('QIZHI');

  for (const [locale, file] of [['en', 'en.md'], ['zh-CN', 'zh.md'], ['ja', 'ja.md']]) {
    const link = page.locator(`[data-content-markdown="${locale}"]`);
    await expect(link).toHaveAttribute('href', file);
  }
});

test('timeline, share and notes tools operate on the article', async ({ page }) => {
  const longForm = articles.find((article) => article.notes);
  await page.goto(`/writing/${longForm.slug}/?lang=en`);

  // Timeline panel scrolls to a section anchor.
  await page.locator('[data-tool-open="timeline"]').click();
  await expect(page.locator('[data-tool-panel-timeline]')).toBeVisible();
  const firstItem = page.locator('[data-tool-timeline-item]').first();
  await firstItem.click();
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(100);

  // Share panel exposes the current URL, copy and email actions.
  await page.locator('[data-tool-open="share"]').click();
  await expect(page.locator('[data-tool-panel-share]')).toBeVisible();
  const shareUrl = await page.locator('[data-tool-share-url]').inputValue();
  expect(shareUrl).toContain(`/writing/${longForm.slug}/`);
  await expect(page.locator('[data-tool-share-email]')).toHaveAttribute('href', /^mailto:/);

  // Panels are mutually exclusive and closable.
  await page.locator('[data-tool-close]').click();
  await expect(page.locator('[data-article-tools-panel]')).toBeHidden();
});

test('selecting text saves a highlight that can be exported and removed', async ({ page }) => {
  const longForm = articles.find((article) => article.notes);
  await page.goto(`/writing/${longForm.slug}/?lang=en`);

  const lead = page.locator('[data-content-article-lead]');
  const box = await lead.boundingBox();
  await page.mouse.move(box.x + 10, box.y + 8);
  await page.mouse.down();
  await page.mouse.move(box.x + 180, box.y + 8, { steps: 8 });
  await page.mouse.up();

  const highlightButton = page.locator('[data-tool-highlight]');
  await expect(highlightButton).toBeVisible();
  await highlightButton.click();

  await expect(lead.locator('[data-note-mark]')).toHaveCount(1);
  await expect(page.locator('[data-tool-open="notes"]')).toContainText('[1]');

  await page.locator('[data-tool-open="notes"]').click();
  await expect(page.locator('[data-tool-note-item]')).toHaveCount(1);
  await expect(page.locator('[data-tool-notes-export]')).toBeVisible();

  const stored = await page.evaluate((slug) => (
    JSON.parse(localStorage.getItem(`article-notes:${slug}`))
  ), longForm.slug);
  expect(stored).toHaveLength(1);

  await page.locator('[data-tool-note-remove]').click();
  await expect(page.locator('[data-tool-note-item]')).toHaveCount(0);
  await expect(lead.locator('[data-note-mark]')).toHaveCount(0);
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
    `/writing/${firstArticle.slug}/en.md`,
    `/writing/${firstArticle.slug}/zh.md`,
    `/writing/${firstArticle.slug}/ja.md`,
    '/styles/content-page.css',
    '/scripts/pages/content-page.js',
    '/media/music/tide-study-0200.wav',
  ]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
  }
});
