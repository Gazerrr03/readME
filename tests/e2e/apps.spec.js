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

test('projects ring rotates on card click and opens a detail view', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  // Reduced motion disables the ring's auto-advance so the front card is deterministic.
  await page.emulateMedia({ reducedMotion: 'reduce' });

  await page.locator('[data-app-icon="projects"]').click();
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

  // clicking the front card opens its detail view
  await front.click();
  const detail = appWindow.locator('[data-projects-detail]');
  await expect(detail.locator('h3')).toHaveText('SIGNAL GARDEN');
  await expect(detail).toContainText('YEAR');
  await expect(detail).toContainText('2026');
  await expect(detail).toContainText('[OK]');
  await expect(detail.locator('canvas[data-projects-canvas]')).toBeAttached();
  await expect(detail.locator('a', { hasText: 'OPEN' })).toHaveAttribute('target', '_blank');
  await expect(appWindow.locator('[data-projects-crumb]')).toHaveText('Projects / SIGNAL GARDEN');

  // back returns to the ring with the same card in front
  await appWindow.locator('[data-projects-back]').click();
  await expect(appWindow.locator('[data-projects-card]')).toHaveCount(10);
  await expect(appWindow.locator('[data-projects-card][aria-current="true"]')).toContainText('SIGNAL GARDEN');
  expect(errors).toEqual([]);
});

test('projects ring rotates by dragging with snap', async ({ page }) => {
  await page.locator('[data-app-icon="projects"]').click();
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

test('writing opens a fullscreen reader and returns to the archive', async ({ page }) => {
  await page.locator('[data-app-icon="writing"]').click();
  const appWindow = page.locator('[data-app-window="writing"]');

  await expect(appWindow.locator('[data-writing-kicker]')).toHaveText('ARCHIVE');
  await expect(appWindow.locator('[data-writing-list] button')).toHaveCount(9);
  await expect(appWindow.locator('[data-writing-tag]').first()).toHaveText('{设计}');

  const windowed = await appWindow.boundingBox();
  await appWindow.locator('[data-writing-open]').first().click();

  const cover = appWindow.locator('[data-writing-cover]');
  const article = appWindow.locator('[data-writing-article]');

  await expect(cover).toHaveAttribute('data-writing-cover-variant', /^0[1-4]$/);
  await expect(cover).toHaveAttribute('data-writing-title-tier', /^(short|medium|long)$/);
  await expect(cover.locator('[data-writing-cover-index]')).toHaveText('01');
  await expect(cover.locator('h3')).toHaveText('When Information Starts Thinking for Me');
  await expect(cover.locator('[data-writing-meta]')).toContainText('{设计}');
  await expect(cover.locator('[data-writing-scroll-cue]')).toHaveAttribute('aria-hidden', 'true');
  await expect(article.locator('[data-writing-lead]')).toContainText('August of last year');

  await expect(appWindow.locator('[data-writing-reader] h3')).toHaveText('When Information Starts Thinking for Me');
  await expect(appWindow.locator('[data-writing-lead]')).toContainText('August of last year');
  await expect(appWindow.locator('[data-writing-section]')).toHaveCount(13);
  await expect(appWindow.locator('[data-writing-body] a')).toHaveCount(7);
  await expect(appWindow.locator('[data-writing-position]')).toHaveText('01 / 09');
  await expect(appWindow.locator('[data-writing-meta]')).toContainText('{设计}');
  await expect(appWindow).toHaveAttribute('data-window-fullscreen', 'true');

  const maximized = await appWindow.boundingBox();
  expect(maximized.width).toBeGreaterThan(windowed.width + 400);

  await appWindow.locator('[data-writing-goto]').last().click();
  await expect(appWindow.locator('[data-writing-reader] h3')).toHaveText('A Frequency That Does Not Exist');
  await expect(appWindow.locator('[data-writing-position]')).toHaveText('02 / 09');
  await expect.poll(() => appWindow.locator('[data-window-content]').evaluate((element) => element.scrollTop)).toBe(0);

  await appWindow.locator('[data-writing-goto]').first().click();
  await expect(appWindow.locator('[data-writing-reader] h3')).toHaveText('When Information Starts Thinking for Me');
  await expect.poll(() => appWindow.locator('[data-window-content]').evaluate((element) => element.scrollTop)).toBe(0);

  await appWindow.locator('[data-writing-back]').click();
  await expect(appWindow.locator('[data-writing-list] button')).toHaveCount(9);
  await expect(appWindow).toHaveAttribute('data-window-fullscreen', 'false');
});

test('about renders bio, timeline, stack, and now sections', async ({ page }) => {
  await page.locator('[data-app-icon="about"]').click();
  const appWindow = page.locator('[data-app-window="about"]');

  await expect(appWindow.locator('[data-about-masthead] h3')).toHaveText('QIZHI');
  await expect(appWindow.locator('[data-about-kicker]')).toHaveText(['BIO', 'TIMELINE', 'STACK', 'NOW']);
  await expect(appWindow.locator('[data-about-timeline] li')).toHaveCount(5);
  await expect(appWindow.locator('[data-about-now] dt').first()).toHaveText('LOCATION');
});

test('contact lists four channels with working links', async ({ page }) => {
  await page.locator('[data-app-icon="contact"]').click();
  const appWindow = page.locator('[data-app-window="contact"]');

  await expect(appWindow.locator('a[data-contact-row]')).toHaveCount(4);
  await expect(appWindow.locator('[data-contact-row="email"]')).toHaveAttribute('href', 'mailto:hello@two-am.example.net');
  await expect(appWindow.locator('[data-contact-footer]')).toContainText('RECEIVING [OK]');
});

test('narrow screens show the ring and open details with back navigation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  await page.locator('[data-app-icon="projects"]').click();
  const appWindow = page.locator('[data-app-window="projects"]');

  await expect(appWindow.locator('[data-projects-card]')).toHaveCount(10);
  const front = appWindow.locator('[data-projects-card][aria-current="true"]');
  await expect(front).toContainText('SIGNAL GARDEN');

  await front.click();
  await expect(appWindow.locator('[data-projects-detail] h3')).toHaveText('SIGNAL GARDEN');
  await expect(appWindow.locator('[data-projects-back]')).toBeVisible();

  await appWindow.locator('[data-projects-back]').click();
  await expect(appWindow.locator('[data-projects-card]')).toHaveCount(10);
});

test('apps re-render localized content when the locale changes', async ({ page }) => {
  await page.locator('[data-app-icon="writing"]').click();
  await page.locator('[data-app-icon="settings"]').click();

  const settings = page.locator('[data-app-window="settings"]');
  await settings.getByLabel('Language').selectOption('zh-CN');

  const writing = page.locator('[data-app-window="writing"]');
  await expect(writing.locator('[data-writing-kicker]')).toHaveText('归档');
  await expect(writing.locator('[data-writing-list]')).toContainText('不存在的频率');
});
