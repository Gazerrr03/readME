import { test, expect } from '@playwright/test';

const saveKey = 'qizhi:mosslight:v1';
async function openIsland(page, path = '/games/mosslight/?lang=en') {
  await page.goto(path);
  await expect(page.locator('#game')).toHaveAttribute('data-game-state', 'exploring');
  await expect(page.locator('#world')).toHaveAttribute('data-frame', /\d+/);
}
async function resumeAt(page, position) {
  await page.addInitScript(({ key, position, seed }) => {
    if (sessionStorage.getItem(seed)) return;
    const save = JSON.parse(localStorage.getItem(key));
    localStorage.setItem(key, JSON.stringify({ ...save, ...position }));
    sessionStorage.setItem(seed, 'used');
  }, { key: saveKey, position, seed: `journey-fixture:${Date.now()}` });
  await page.reload();
  await expect(page.locator('#game')).toHaveAttribute('data-game-state', 'exploring');
}

test('island renders colored moving pixels and keyboard exploration persists', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await openIsland(page);
  const pixels = await page.locator('#world').evaluate(canvas => {
    const sample = document.createElement('canvas');
    sample.width = 80;
    sample.height = 60;
    const context = sample.getContext('2d');
    context.drawImage(canvas, 0, 0, 80, 60);
    const { data } = context.getImageData(0, 0, 80, 60);
    const colors = new Set();
    let colorful = 0;
    for (let i = 0; i < data.length; i += 4) {
      const rgb = [...data.slice(i, i + 3)];
      colors.add(rgb.join(','));
      if (Math.max(...rgb) - Math.min(...rgb) > 30) colorful++;
    }
    return { colors: colors.size, colorful };
  });
  expect(pixels.colors).toBeGreaterThan(100);
  expect(pixels.colorful).toBeGreaterThan(1500);
  const before = await page.locator('#world').evaluate(canvas => canvas.toDataURL());
  await page.locator('#world').focus();
  await page.keyboard.down('w');
  await expect.poll(async () => Number((await page.locator('#world').getAttribute('data-position')).split(',')[1])).toBeLessThan(5.6);
  await page.keyboard.up('w');
  expect(await page.locator('#world').evaluate(canvas => canvas.toDataURL())).not.toBe(before);
  await page.reload();
  await expect(page.locator('#game')).toHaveAttribute('data-game-state', 'exploring');
  expect(Number((await page.locator('#world').getAttribute('data-position')).split(',')[1])).toBeLessThan(5.6);
  expect(errors).toEqual([]);
});

test('all three encounters, healing, lighthouse ending and restart work', async ({ page }) => {
  await openIsland(page, '/readME/games/mosslight/?lang=zh-CN');
  for (const [id, x, z, action] of [['fern', -6, .5, 'soothe'], ['tide', 6, 4.5, 'pulse'], ['ember', 6, -4.5, 'soothe']]) {
    await resumeAt(page, { x, z });
    await page.locator('#interact').click();
    await expect(page.locator('#game')).toHaveAttribute('data-game-state', 'encounter');
    await page.locator(`[data-turn="${action}"]`).click();
    await page.locator(`[data-turn="${action}"]`).click();
    await page.locator('[data-turn="befriend"]').click();
    await expect(page.locator('#game')).toHaveAttribute('data-game-state', 'exploring');
    expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).friends, saveKey)).toContain(id);
  }
  await expect(page.locator('#count')).toHaveText('3 / 3');
  await resumeAt(page, { x: -3, z: 5, hp: 4, berries: 0 });
  await page.locator('#interact').click();
  await expect(page.locator('#health-label')).toContainText('18 / 18');
  await resumeAt(page, { x: 0, z: -6.5 });
  await page.locator('#interact').click();
  await expect(page.locator('#dialog')).toContainText('为每个人亮起');
  await page.getByRole('button', { name: '继续留在岛上' }).click();
  await page.reload();
  await expect(page.locator('#quest')).toHaveText('岛屿重新亮起');
  await page.getByRole('button', { name: '精灵图鉴' }).click();
  await expect(page.locator('.journal-row[data-found="true"]')).toHaveCount(3);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: '暂停', exact: true }).click();
  await page.getByRole('button', { name: '新的旅程' }).click();
  await page.getByRole('button', { name: '重新开始' }).click();
  await expect(page.locator('#count')).toHaveText('0 / 3');
  await expect(page.locator('#world')).toHaveAttribute('data-position', '0.00,7.00');
});

test('touch controls stop on release and the mobile HUD stays inside the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openIsland(page);
  const north = page.locator('[data-direction="up"]');
  const box = await north.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect.poll(async () => Number((await page.locator('#world').getAttribute('data-position')).split(',')[1])).toBeLessThan(6);
  await page.mouse.up();
  const stopped = await page.locator('#world').getAttribute('data-position');
  await page.waitForTimeout(160);
  await expect(page.locator('#world')).toHaveAttribute('data-position', stopped);
  const bounds = await page.locator('.hud, .quest, #direction-pad, .traveler, #interact').evaluateAll(nodes => nodes.map(node => {
    const r = node.getBoundingClientRect();
    return { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
  }));
  expect(bounds.every(r => r.left >= 0 && r.top >= 0 && r.right <= 390 && r.bottom <= 844)).toBe(true);
  await resumeAt(page, { x: 6, z: 4.5 });
  await page.locator('#interact').click();
  const battle = await page.locator('#encounter').boundingBox();
  expect(battle.y).toBeGreaterThan(130);
  expect(battle.x + battle.width).toBeLessThanOrEqual(390);
});

test('OS game window launches and suspends rendering when minimized', async ({ page }) => {
  test.setTimeout(60000);
  await page.addInitScript(() => localStorage.setItem('portfolio-os:preferences', JSON.stringify({ version: 1, bootComplete: true, layout: 'macos', locale: 'en', audioEnabled: false })));
  await page.goto('/');
  await page.locator('[data-folder-toggle="games"]').click();
  const app = page.locator('[data-app-window="games"]');
  await app.locator('[data-folder-item="mosslight"]').dblclick();
  const game = page.frameLocator('[data-game-frame]');
  await expect(game.locator('#game')).toHaveAttribute('data-rendering', 'true');
  const bounds = await page.locator('[data-game-frame]').boundingBox();
  expect(bounds.height).toBeGreaterThan(450);
  await app.locator('[data-window-mac-minimize]').click();
  await expect(game.locator('#game')).toHaveAttribute('data-rendering', 'false');
  const stopped = await game.locator('#world').getAttribute('data-frame');
  await page.waitForTimeout(150);
  await expect(game.locator('#world')).toHaveAttribute('data-frame', stopped);
  await page.locator('[data-folder-toggle="games"]').click();
  await expect(game.locator('#game')).toHaveAttribute('data-rendering', 'true');
  await page.locator('[data-environment-open="projects"]').click({ position: { x: 10, y: 10 } });
  await expect(game.locator('#game')).toHaveAttribute('data-rendering', 'false');
  await game.locator('#world').click({ position: { x: 25, y: 170 } });
  await expect(app).toHaveAttribute('data-window-active', 'true');
  await expect(game.locator('#game')).toHaveAttribute('data-rendering', 'true');
  await app.locator('[data-folder-back]').click();
  await expect(app.locator('[data-folder-item="mosslight"]')).toBeVisible();
  await expect(app.locator('[data-game-frame]')).toHaveCount(0);
});

test('unavailable storage does not prevent play and WebGL failure gives a retry', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage disabled'); } }));
  await openIsland(page);
  await expect(page.locator('#notice')).toContainText('cannot be saved');
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) {
      return type.startsWith('webgl') ? null : original.call(this, type, ...args);
    };
  });
  await page.reload();
  await expect(page.locator('#game')).toHaveAttribute('data-game-state', 'error');
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
});
