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
  await expect(appWindow.locator('[data-writing-list] a')).toHaveCount(9);
  await expect(appWindow.locator('[data-writing-tag]').first()).toHaveText('{设计}');
  await appWindow.locator('[data-writing-open]').first().click();
  await expect(page).toHaveURL(/\/writing\/flow-canvas-information-overload\/$/);
  await expect(page.locator('[data-content-article] h1')).toHaveText('When Information Starts Thinking for Me');
});

test('about renders bio, timeline, stack, and now sections', async ({ page }) => {
  await page.locator('[data-windows-icons] [data-app-icon="about"]').dblclick();
  const appWindow = page.locator('[data-app-window="about"]');

  await expect(appWindow.locator('[data-about-masthead] h3')).toHaveText('QIZHI');
  await expect(appWindow.locator('[data-about-kicker]')).toHaveText(['BIO', 'TIMELINE', 'STACK', 'NOW']);
  await expect(appWindow.locator('[data-about-timeline] li')).toHaveCount(5);
  await expect(appWindow.locator('[data-about-now] dt').first()).toHaveText('LOCATION');
});

test('contact lists four channels with working links', async ({ page }) => {
  await page.locator('[data-windows-icons] [data-app-icon="contact"]').dblclick();
  const appWindow = page.locator('[data-app-window="contact"]');

  await expect(appWindow.locator('a[data-contact-row]')).toHaveCount(4);
  await expect(appWindow.locator('[data-contact-row="email"]')).toHaveAttribute('href', 'mailto:hello@two-am.example.net');
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

test('apps re-render localized content when the locale changes', async ({ page }) => {
  await page.locator('[data-windows-icons] [data-app-icon="writing"]').dblclick();
  await page.locator('[data-windows-icons] [data-app-icon="settings"]').dblclick();

  const settings = page.locator('[data-app-window="settings"]');
  await settings.getByLabel('Language').selectOption('zh-CN');

  const writing = page.locator('[data-app-window="writing"]');
  await expect(writing.locator('[data-writing-kicker]')).toHaveText('归档');
  await expect(writing.locator('[data-writing-list]')).toContainText('不存在的频率');
});
