import { test, expect } from '@playwright/test';

const savedPreferences = {
  version: 1,
  bootComplete: true,
  layout: 'windows',
  locale: 'en',
  audioEnabled: false,
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript((preferences) => {
    localStorage.setItem('portfolio-os:preferences', JSON.stringify(preferences));
  }, savedPreferences);
  await page.goto('/');
});

test('projects ring rotates on card click and navigates the front project', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  // Reduced motion disables the ring's auto-advance so the front card is deterministic.
  await page.emulateMedia({ reducedMotion: 'reduce' });

  await page.locator('[data-windows-icons] [data-app-icon="projects"]').dblclick();
  const appWindow = page.locator('[data-app-window="projects"]');

  await expect(appWindow.locator('[data-projects-crumb]')).toHaveText('Projects /');
  await expect(appWindow.locator('[data-projects-count]')).toHaveText('05 ITEMS');
  await expect(appWindow.locator('[data-projects-hint]')).toHaveText('DRAG · CLICK TO ROTATE');
  await expect(appWindow.locator('[data-projects-card]')).toHaveCount(10);
  await expect(appWindow.locator('[data-projects-position]')).toHaveText('01 / 05');

  const front = appWindow.locator('[data-projects-card][aria-current="true"]');
  await expect(front).toContainText('SIGNAL GARDEN');

  // keyboard rotates the ring to the next card
  await appWindow.locator('[data-projects-ring]').focus();
  await page.keyboard.press('ArrowRight');
  await expect(front).toContainText('DRIFT PROTOCOL');
  await expect(appWindow.locator('[data-projects-position]')).toHaveText('02 / 05');

  // clicking a side card brings it to the front
  await appWindow.locator('[data-projects-card][data-slot="0"]').click();
  await expect(front).toContainText('SIGNAL GARDEN');

  // clicking the front card navigates to its independent detail page
  await front.click();
  await expect(page).toHaveURL(/\/projects\/signal-garden\/$/);
  await expect(page.locator('[data-content-project] h1')).toHaveText('SIGNAL GARDEN');
  expect(errors).toEqual([]);
});

test('projects ring rotates by dragging with snap', async ({ page }) => {
  await page.locator('[data-windows-icons] [data-app-icon="projects"]').dblclick();
  const appWindow = page.locator('[data-app-window="projects"]');
  const ring = appWindow.locator('[data-projects-ring]');
  const first = appWindow.locator('[data-projects-card][data-slot="0"]');

  const before = await first.evaluate((el) => el.style.transform);
  const box = await ring.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 160, box.y + box.height / 2, { steps: 8 });
  await page.mouse.up();

  await expect(appWindow.locator('[data-projects-position]')).not.toHaveText('01 / 05');
  const after = await first.evaluate((el) => el.style.transform);
  expect(after).not.toEqual(before);
});

test('writing archive uses real links to independent article pages', async ({ page }) => {
  await page.locator('[data-windows-icons] [data-app-icon="writing"]').dblclick();
  const appWindow = page.locator('[data-app-window="writing"]');

  await expect(appWindow.locator('[data-writing-kicker]')).toHaveText('ARCHIVE');
  await expect(appWindow.locator('[data-writing-list] a')).toHaveCount(11);
  await expect(appWindow.locator('[data-writing-open]').nth(2)).toHaveAttribute(
    'href',
    'writing/move-the-mountain/',
  );
  await expect(appWindow.locator('[data-writing-open]').nth(2)).toContainText('Move the Mountain Elsewhere');
  await expect(appWindow.locator('[data-writing-tag]').first()).toHaveText('{设计}');
  await appWindow.locator('[data-writing-open]').first().click();
  await expect(page).toHaveURL(/\/writing\/flow-canvas-information-overload\/$/);
  await expect(page.locator('[data-content-article] h1')).toHaveText('When Information Starts Thinking for Me');
});

test('about renders personal identity, experience, works, toolbox, and now sections', async ({ page }) => {
  await page.locator('[data-windows-icons] [data-app-icon="about"]').dblclick();
  const appWindow = page.locator('[data-app-window="about"]');

  await expect(appWindow.locator('[data-about-banner-canvas]')).toHaveCount(1);
  await expect(appWindow.locator('[data-about-banner-kicker]')).toHaveText('GAZERRR / 03');
  await expect(appWindow.locator('[data-about-banner-trail]')).toHaveText('IDEAS → SYSTEMS → EXPERIMENTS → ITERATION');
  await expect(appWindow.locator('[data-about-avatar]')).toHaveAttribute('data-about-avatar-state', 'ready');
  await expect(appWindow.locator('[data-about-avatar]')).toHaveAttribute('aria-label', 'Qizhi’s GitHub avatar');
  await expect(appWindow.locator('[data-about-masthead] h3')).toHaveText('Qizhi（Gazerrr）');
  await expect(appWindow.locator('[data-about-kicker]')).toHaveText(['BIO', 'EXPERIENCE', 'WORKS', 'TOOLBOX', 'NOW']);
  await expect(appWindow.locator('[data-about-experience] li')).toHaveCount(1);
  await expect(appWindow.locator('[data-about-experience]')).toContainText('Tencent IEG');
  await expect(appWindow.locator('[data-about-work]')).toHaveCount(2);
  await expect(appWindow.locator('[data-about-work-name]')).toHaveText(['Flovvas', 'Skillcraft']);
  await expect(appWindow.locator('[data-about-work-meta]').first()).toHaveText('CO-BUILDER / PRIVATE WORK');
  await expect(appWindow.locator('[data-about-now] dt').first()).toHaveText('FOCUS');
});

test('contact lists four channels with working links', async ({ page }) => {
  await page.locator('[data-windows-icons] [data-app-icon="contact"]').dblclick();
  const appWindow = page.locator('[data-app-window="contact"]');

  await expect(appWindow.locator('a[data-contact-row]')).toHaveCount(4);
  await expect(appWindow.locator('[data-contact-row="email"]')).toHaveAttribute('href', 'mailto:gazerrr030303@gmail.com');
  await expect(appWindow.locator('[data-contact-row="github"]')).toHaveAttribute('href', 'https://github.com/Gazerrr03');
  await expect(appWindow.locator('[data-contact-row="github"]')).toContainText('@Gazerrr03');
  await expect(appWindow.locator('[data-contact-footer]')).toContainText('RECEIVING [OK]');
});

test('narrow screens navigate the front project to its independent page', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  await page.locator('[data-taskbar-pins] [data-app-icon="projects"]').click();
  const appWindow = page.locator('[data-app-window="projects"]');

  await expect(appWindow.locator('[data-projects-card]')).toHaveCount(10);
  const front = appWindow.locator('[data-projects-card][aria-current="true"]');
  await expect(front).toContainText('SIGNAL GARDEN');

  await front.click();
  await expect(page).toHaveURL(/\/projects\/signal-garden\/$/);
  await expect(page.locator('[data-content-project] h1')).toHaveText('SIGNAL GARDEN');
});

test('about graphics fit a narrow screen without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  await page.locator('[data-taskbar-pins] [data-app-icon="about"]').click();
  const appWindow = page.locator('[data-app-window="about"]');

  await expect(appWindow.locator('[data-about-avatar][data-about-avatar-state="ready"]')).toHaveCount(1);
  await expect(appWindow.locator('[data-about-banner-trail]')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    await page.evaluate(() => window.innerWidth),
  );
});

test('apps re-render localized content when the locale changes', async ({ page }) => {
  await page.locator('[data-windows-icons] [data-app-icon="about"]').dblclick();
  await page.locator('[data-windows-icons] [data-app-icon="writing"]').dblclick();
  await page.locator('[data-windows-icons] [data-app-icon="settings"]').dblclick();

  const settings = page.locator('[data-app-window="settings"]');
  await settings.getByLabel('Language').selectOption('zh-CN');

  const about = page.locator('[data-app-window="about"]');
  await expect(about.locator('[data-about-kicker]')).toHaveText(['自述', '经历', '作品', '工具箱', '当前']);
  await expect(about.locator('[data-about-banner-trail]')).toHaveText('想法 → 系统 → 实验 → 迭代');
  await expect(about.locator('[data-about-avatar-label]')).toHaveText('GITHUB 头像');
  await expect(about.locator('[data-about-avatar]')).toHaveAttribute('aria-label', 'Qizhi 的 GitHub 头像');
  await expect(about.locator('[data-about-role]')).toHaveText('产品工程师 / AI 与 Agent 系统');
  await expect(about.locator('[data-about-work-description]').first()).toContainText('无限画布');

  const writing = page.locator('[data-app-window="writing"]');
  await expect(writing.locator('[data-writing-kicker]')).toHaveText('归档');
  await expect(writing.locator('[data-writing-list]')).toContainText('仿生 Agent 会梦见范斯沃斯吗');
});
