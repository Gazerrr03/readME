import { test, expect } from '@playwright/test';

async function selectField(page, fieldId) {
  await page.locator('[data-field-search]').fill(fieldId);
  await page.locator(`[data-field-nav="${fieldId}"]`).click();
  return page.locator(`[data-field-id="${fieldId}"]`);
}

test('edits Chinese while generated locales remain read only', async ({ page }) => {
  await page.route('**/api/translate', (route) => route.fulfill({
    json: {
      translations: [{
        id: 'ui.site.title',
        values: { en: 'A New Two A.M.', ja: '新しい午前二時' },
      }],
    },
  }));
  await page.goto('/writing/');
  await expect(page.locator('[data-writing-review]')).toBeVisible();
  await page.locator('[data-field-search]').fill('site.title');
  await page.locator('[data-field-nav="ui.site.title"]').click();
  const editor = page.locator('[data-field-id="ui.site.title"]');
  await editor.locator('[data-source-input]').fill('新的凌晨两点');
  await expect(editor.locator('[data-locale-value="en"]')).toHaveAttribute('readonly', '');
  await expect(page.locator('[data-save-status]')).toContainText('已保存');
  await expect(editor.locator('[data-locale-value="en"]')).toHaveValue('A New Two A.M.');
  await expect(editor.locator('[data-locale-value="ja"]')).toHaveValue('新しい午前二時');
});

test('mobile review mode switches between editor and preview without overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/writing/');
  await expect(page.getByRole('tab', { name: '编辑' })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('tab', { name: '预览' }).click();
  await expect(page.locator('iframe[title="站点交互预览"]')).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  expect(overflow).toBe(false);
});

test('live preview updates an open reader without losing site interactions', async ({ page }) => {
  await page.setViewportSize({ width: 1800, height: 1000 });
  await page.addInitScript(() => localStorage.setItem('portfolio-os:preferences', JSON.stringify({
    version: 1,
    bootComplete: true,
    layout: 'windows',
    locale: 'zh-CN',
    audioEnabled: false,
  })));
  await page.route('**/api/translate', (route) => route.fulfill({
    json: {
      translations: [{
        id: 'articles.flow-canvas-information-overload.title',
        values: { en: 'Information Thinks, Reviewed', ja: '情報が考える、校閲版' },
      }],
    },
  }));
  await page.goto('/writing/');

  const preview = page.frameLocator('[data-review-preview]');
  await preview.locator('[data-app-icon="writing"]').click();
  const writingWindow = preview.locator('[data-app-window="writing"]');
  await writingWindow.locator('[data-writing-open]').first().click();
  await expect(writingWindow.locator('[data-writing-reader]')).toBeVisible();

  const editor = await selectField(page, 'articles.flow-canvas-information-overload.title');
  await editor.locator('[data-source-input]').fill('信息开始替我思考（审校版）');
  await expect(writingWindow.locator('[data-writing-reader] h3')).toHaveText('信息开始替我思考（审校版）');
  await expect(writingWindow).toHaveAttribute('data-window-fullscreen', 'true');

  await writingWindow.locator('[data-writing-back]').click();
  await preview.locator('[data-app-icon="projects"]').click();
  const projectsWindow = preview.locator('[data-app-window="projects"]');
  const before = await projectsWindow.boundingBox();
  await projectsWindow.locator('[data-window-titlebar]').dragTo(
    preview.locator('[data-windows-taskbar] [data-system-title]'),
  );
  const after = await projectsWindow.boundingBox();
  expect(after.x).not.toBe(before.x);

  const ring = projectsWindow.locator('[data-projects-ring]');
  const position = projectsWindow.locator('[data-projects-position]');
  await ring.focus();
  await ring.press('ArrowRight');
  await expect(position).not.toHaveText('01 / 05');
  await projectsWindow.locator('[data-window-close]').click();
  await expect(projectsWindow).toHaveCount(0);

  await preview.locator('[data-app-icon="settings"]').click();
  const settings = preview.locator('[data-app-window="settings"]');
  await settings.getByLabel('语言').selectOption('en');
  await expect(preview.locator('[data-system-title]').first()).toHaveText('Two A.M., A Frequency That Does Not Exist');
});

test('failed translations persist and recover once when the route reopens', async ({ page }) => {
  let attempts = 0;
  await page.route('**/api/translate', (route) => {
    attempts += 1;
    if (attempts === 1) return route.fulfill({ status: 503, body: 'unavailable' });
    return route.fulfill({
      json: {
        translations: [{
          id: 'ui.site.title',
          values: { en: 'Recovered Two A.M.', ja: '復旧した午前二時' },
        }],
      },
    });
  });
  await page.goto('/writing/');
  let editor = await selectField(page, 'ui.site.title');
  await editor.locator('[data-source-input]').fill('恢复后的凌晨两点');
  await expect(page.locator('[data-task-status]')).toHaveText('等待自动重试');

  await page.reload();
  editor = await selectField(page, 'ui.site.title');
  await expect(editor.locator('[data-locale-value="en"]')).toHaveValue('Recovered Two A.M.');
  await expect(editor.locator('[data-locale-value="ja"]')).toHaveValue('復旧した午前二時');
  await expect(page.locator('[data-queue-summary]')).toHaveText('待处理 0');
  expect(attempts).toBe(2);

  await page.reload();
  editor = await selectField(page, 'ui.site.title');
  await expect(editor.locator('[data-locale-value="en"]')).toHaveValue('Recovered Two A.M.');
  expect(attempts).toBe(2);
});

test('a delayed translation cannot overwrite a newer Chinese revision', async ({ page }) => {
  let firstRoute;
  let resolveFirstRequest;
  const firstRequest = new Promise((resolve) => { resolveFirstRequest = resolve; });
  let attempts = 0;
  await page.route('**/api/translate', (route) => {
    attempts += 1;
    if (attempts === 1) {
      firstRoute = route;
      resolveFirstRequest();
      return undefined;
    }
    return route.fulfill({
      json: {
        translations: [{
          id: 'ui.site.title',
          values: { en: 'Second revision', ja: '第二版' },
        }],
      },
    });
  });
  await page.goto('/writing/');
  const editor = await selectField(page, 'ui.site.title');
  await editor.locator('[data-source-input]').fill('中文第一版');
  await firstRequest;
  await editor.locator('[data-source-input]').fill('中文第二版');
  await expect(editor.locator('[data-locale-value="en"]')).toHaveValue('Second revision');

  await firstRoute.fulfill({
    json: {
      translations: [{
        id: 'ui.site.title',
        values: { en: 'First revision', ja: '第一版' },
      }],
    },
  });
  await expect(editor.locator('[data-locale-value="en"]')).toHaveValue('Second revision');
  await expect(editor.locator('[data-locale-value="ja"]')).toHaveValue('第二版');
});
