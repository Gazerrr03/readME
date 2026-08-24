import { test, expect } from '@playwright/test';
import { createDefaultContentDocument } from '../../scripts/content/default-document.js';

test('apps render a published content snapshot', async ({ page }) => {
  const published = createDefaultContentDocument();
  published.fields['articles.flow-canvas-information-overload.title'].values['zh-CN'] = '发布后的文章标题';
  published.fields['about.bio'].values['zh-CN'] = '发布后的个人自述';
  await page.route('**/content/content.json', (route) => route.fulfill({ json: published }));
  await page.addInitScript(() => localStorage.setItem('portfolio-os:preferences', JSON.stringify({
    version: 1,
    bootComplete: true,
    layout: 'windows',
    locale: 'zh-CN',
    audioEnabled: false,
  })));
  await page.goto('/');

  await page.locator('[data-windows-icons] [data-app-icon="writing"]').dblclick();
  await expect(page.locator('[data-app-window="writing"]')).toContainText('发布后的文章标题');

  await page.locator('[data-windows-icons] [data-app-icon="about"]').dblclick();
  await expect(page.locator('[data-app-window="about"]')).toContainText('发布后的个人自述');
});
