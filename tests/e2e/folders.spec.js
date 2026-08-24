import { test, expect } from '@playwright/test';

async function seedLayout(page, layout, locale = 'en') {
  await page.addInitScript((preferences) => {
    localStorage.setItem('portfolio-os:preferences', JSON.stringify(preferences));
  }, {
    version: 1,
    bootComplete: true,
    layout,
    locale,
    audioEnabled: false,
  });
}

test('collection launchers sit on the right edge in both desktop modes', async ({ page }) => {
  await seedLayout(page, 'windows');
  await page.goto('/');
  const { width } = page.viewportSize();
  const windowsFolders = await page.locator('[data-desktop-folders]').boundingBox();
  expect(Math.round(windowsFolders.x + windowsFolders.width)).toBe(width - 24);
  expect(Math.round(windowsFolders.y)).toBe(24);
  await expect(page.locator('[data-folder-toggle]')).toHaveCount(4);

  await seedLayout(page, 'macos');
  await page.goto('/');
  const macosFolders = await page.locator('[data-desktop-folders]').boundingBox();
  expect(Math.round(macosFolders.x + macosFolders.width)).toBe(width - 24);
  expect(Math.round(macosFolders.y)).toBe(56);
});

test('photos opens a centered folder view, then returns from the photo viewer', async ({ page }) => {
  await seedLayout(page, 'macos');
  await page.goto('/');

  await page.locator('[data-folder-toggle="photos"]').click();
  const window = page.locator('[data-app-window="photos"]');
  await expect(window).toBeVisible();
  await expect(window.locator('[data-folder-browser]')).toHaveAttribute('data-folder-view', 'folder');
  await expect(window.locator('[data-folder-item]')).toHaveCount(4);

  const coast = window.locator('[data-folder-item="coast"]');
  await coast.click();
  await expect(coast).toHaveAttribute('data-selected', 'true');
  await coast.dblclick();
  await expect(window.locator('[data-folder-browser]')).toHaveAttribute('data-folder-view', 'viewer');
  await expect(window.locator('[data-photos-count]')).toHaveText('01 / 04');
  await expect(window.locator('[data-photos-title]')).toHaveText('COAST 02:14');

  await window.locator('[data-photos-next]').click();
  await expect(window.locator('[data-photos-count]')).toHaveText('02 / 04');
  await expect(window.locator('[data-photos-title]')).toHaveText('MOONRISE');

  await window.locator('[data-folder-back]').click();
  await expect(window.locator('[data-folder-browser]')).toHaveAttribute('data-folder-view', 'folder');
  await expect(window.locator('[data-folder-item="moonrise"]')).toHaveAttribute('data-selected', 'true');

  await window.locator('[data-photos-tab="wallpapers"]').click();
  await window.locator('[data-photos-tab="photos"]').click();
  await expect(window.locator('[data-folder-item="moonrise"]')).toHaveAttribute('data-selected', 'true');
});

test('albums opens the player from the folder view and toggles playback', async ({ page }) => {
  await seedLayout(page, 'macos');
  await page.goto('/');

  await page.locator('[data-folder-toggle="albums"]').click();
  const window = page.locator('[data-app-window="albums"]');
  await expect(window.locator('[data-folder-item]')).toHaveCount(4);
  const episodeItem = window.locator('[data-folder-item="episode-33"]');
  const episodeCover = episodeItem.locator('[data-album-cover-image]');
  await expect(episodeCover).toHaveAttribute('src', 'media/covers/episode-33-pixel.png');
  expect(await episodeCover.evaluate((image) => image.complete && image.naturalWidth > 0)).toBe(true);
  const albumArtBox = await episodeItem.locator('[data-album-item-art]').boundingBox();
  const episodeCoverBox = await episodeCover.boundingBox();
  expect(episodeCoverBox.width).toBeGreaterThan(albumArtBox.width * 0.95);
  expect(episodeCoverBox.height).toBeGreaterThan(albumArtBox.height * 0.95);
  await window.locator('[data-folder-item="tide-study-0200"]').dblclick();
  await expect(window.locator('[data-folder-browser]')).toHaveAttribute('data-folder-view', 'viewer');
  await expect(window.locator('[data-player-track]')).toHaveText('TRK 02/04');
  await expect(window.locator('[data-albums-app]')).toHaveAttribute('data-player-status', 'playing');

  await window.locator('[data-player-toggle]').click();
  await expect(window.locator('[data-albums-app]')).toHaveAttribute('data-player-status', 'paused');
  await window.locator('[data-player-next]').click();
  await expect(window.locator('[data-player-track]')).toHaveText('TRK 03/04');
});

test('mobile content items open with a single tap', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seedLayout(page, 'windows');
  await page.goto('/');

  await page.locator('[data-folder-toggle="photos"]').click();
  const window = page.locator('[data-app-window="photos"]');
  await window.locator('[data-folder-item="moonrise"]').click();
  await expect(window.locator('[data-folder-browser]')).toHaveAttribute('data-folder-view', 'viewer');
  await expect(window.locator('[data-photos-title]')).toHaveText('MOONRISE');
});

test('games and books expose their own collection windows', async ({ page }) => {
  await seedLayout(page, 'windows');
  await page.goto('/');

  await page.locator('[data-folder-toggle="games"]').click();
  const games = page.locator('[data-app-window="games"]');
  await expect(games.locator('[data-folder-browser]')).toHaveAttribute('data-folder-view', 'folder');
  await expect(games.locator('[data-folder-item]')).toHaveCount(0);
  await expect(games.locator('[data-games-empty]')).toContainText('NO GAME MODULES MOUNTED');
  await expect(games.locator('[data-game-mount]')).toHaveText('MOUNT /GAMES/*.HTML');
  await games.locator('[data-window-close]').click();

  await page.locator('[data-folder-toggle="books"]').click();
  const books = page.locator('[data-app-window="books"]');
  await expect(books.locator('[data-folder-browser]')).toHaveAttribute('data-folder-view', 'folder');
  await expect(books.locator('[data-folder-item]')).toHaveCount(0);
  await expect(books.locator('[data-bookshelf-stage]')).toBeVisible();
  await expect(books.locator('[data-bookshelf-canvas]')).toBeVisible();
  await expect(books.locator('[data-bookshelf-empty]')).toHaveCount(0);
});

test('bookshelf canvas uses the dark surface as its backdrop', async ({ page }) => {
  await seedLayout(page, 'macos');
  await page.goto('/');

  await page.locator('[data-folder-toggle="books"]').click();
  const canvas = page.locator('[data-app-window="books"] [data-bookshelf-canvas]');
  await expect(canvas).toHaveAttribute('data-bookshelf-scene', 'ready');

  const screenshot = (await canvas.screenshot()).toString('base64');
  const pixel = await page.evaluate(async (encoded) => {
    const bytes = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));
    const bitmap = await createImageBitmap(new Blob([bytes], { type: 'image/png' }));
    const probe = document.createElement('canvas');
    probe.width = bitmap.width;
    probe.height = bitmap.height;
    probe.getContext('2d').drawImage(bitmap, 0, 0);
    return [...probe.getContext('2d').getImageData(bitmap.width - 8, 8, 1, 1).data];
  }, screenshot);

  expect(pixel).toEqual([14, 35, 64, 255]);
});

test('collection labels and viewer titles follow the locale', async ({ page }) => {
  await seedLayout(page, 'windows', 'zh-CN');
  await page.goto('/');

  await expect(page.locator('[data-folder-toggle="photos"]')).toContainText('照片');
  await expect(page.locator('[data-folder-toggle="albums"]')).toContainText('唱片');
  await expect(page.locator('[data-folder-toggle="games"]')).toContainText('游戏');
  await expect(page.locator('[data-folder-toggle="books"]')).toContainText('书本');

  await page.locator('[data-folder-toggle="photos"]').click();
  const window = page.locator('[data-app-window="photos"]');
  await window.locator('[data-folder-item="coast"]').dblclick();
  await expect(window.locator('[data-photos-title]')).toHaveText('海岸 02:14');
});

test('Escape returns from a viewer to its folder and restores the selected item', async ({ page }) => {
  await seedLayout(page, 'windows');
  await page.goto('/');

  await page.locator('[data-folder-toggle="photos"]').click();
  const window = page.locator('[data-app-window="photos"]');
  const item = window.locator('[data-folder-item="moonrise"]');
  await item.dblclick();
  await window.locator('[data-folder-browser]').press('Escape');

  await expect(window.locator('[data-folder-browser]')).toHaveAttribute('data-folder-view', 'folder');
  await expect(window.locator('[data-folder-item="moonrise"]')).toBeFocused();
});
