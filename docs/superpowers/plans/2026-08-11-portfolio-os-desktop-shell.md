# Portfolio OS Desktop Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a modular, multilingual portfolio operating-system shell with a first-visit boot sequence, Windows/macOS desktop layouts, 1-bit application icons, lightweight window management, Settings, optional audio, and a BOT standby mock.

**Architecture:** Use browser-native ES modules and a small immutable state core. Pure modules own preferences, localization, application metadata, boot state, and window transitions; DOM controllers subscribe to those modules and render the system shell. Automated unit tests cover pure behavior, while Playwright covers boot, desktop, windows, localization, keyboard access, and responsive flows.

**Tech Stack:** HTML5, CSS, browser-native JavaScript ES modules, Node.js 24 built-in test runner, Playwright Chromium, Python static server for local E2E tests.

## Global Constraints

- Default locale is English; supported locales are `en`, `zh-CN`, and `ja`.
- Localized titles are exactly `Two A.M., A Frequency That Does Not Exist`, `凌晨两点，不存在的频率`, and `午前二時、存在しない周波数`.
- Primary colors remain `#26159A` and `#FFFFFF`; the desktop grid remains 32 by 32 pixels.
- Use square corners, one-pixel strokes, hard blue shadows, serif display text, and monospace system text.
- Do not add gradients, glass, blur, soft shadows, modern rounded application tiles, or a desktop watermark.
- First boot is approximately five seconds, defaults to English, and can be skipped.
- System audio defaults to Off and initializes only after explicit opt-in.
- Desktop windows support open, focus, drag, minimize, restore, and close; they do not maximize or resize.
- Fine pointers single-click to select and double-click to open; coarse pointers single-tap to open.
- Windows-style mode uses upper-left icons and a bottom taskbar; macOS-style mode uses a top menu bar and bottom Dock.
- Projects, Writing, About, and Contact open localized `COMING SOON` windows.
- Settings preserves the existing Display, Mouse, and Network demonstrations and adds Layout, Language, Audio, and Replay Boot controls.
- The first release includes only a desktop BOT standby mock and a narrow-screen fallback, not the final AI or independent mobile shells.
- This directory is not currently a Git repository; every task ends with a fresh verification checkpoint instead of a commit.

---

## File Map

- `index.html`: minimal document shell, boot mount, desktop mount, and module entry.
- `package.json`: unit and browser test commands.
- `playwright.config.js`: Chromium configuration and local static server.
- `styles/tokens.css`: visual tokens and reset.
- `styles/shell.css`: document, desktop grid, shared shell, system messages.
- `styles/boot.css`: boot composition and motion states.
- `styles/icons.css`: 1-bit icon drawings and selection states.
- `styles/windows-mode.css`: Windows taskbar and desktop icon placement.
- `styles/macos-mode.css`: macOS menu bar and Dock placement.
- `styles/windows.css`: application window frame and controls.
- `styles/apps.css`: Settings, placeholders, and BOT standby visuals.
- `styles/responsive.css`: reduced motion and narrow-screen fallback.
- `scripts/state/preferences.js`: validated persistent preferences.
- `scripts/state/window-state.js`: pure window state transitions and geometry.
- `scripts/i18n/dictionaries.js`: all English, Chinese, and Japanese strings.
- `scripts/i18n/i18n.js`: locale lookup, switching, and subscriptions.
- `scripts/apps/app-registry.js`: stable application definitions.
- `scripts/apps/placeholder-app.js`: unfinished application UI.
- `scripts/apps/settings-app.js`: the current control panel plus real preferences.
- `scripts/boot.js`: boot state machine and rendering controller.
- `scripts/audio.js`: opt-in Web Audio cues.
- `scripts/desktop.js`: desktop chrome, icons, selection, activation, and layout rendering.
- `scripts/window-manager.js`: DOM window lifecycle, pointer dragging, and state rendering.
- `scripts/bot-standby.js`: desktop standby BOT and localized status response.
- `scripts/main.js`: dependency assembly and startup flow.
- `tests/unit/preferences.test.js`: preference validation and recovery.
- `tests/unit/i18n.test.js`: locale lookup and fallback.
- `tests/unit/app-registry.test.js`: application IDs and definitions.
- `tests/unit/window-state.test.js`: window lifecycle and geometry.
- `tests/e2e/shell.spec.js`: shell and theme smoke tests.
- `tests/e2e/boot.spec.js`: first/returning visit flows.
- `tests/e2e/desktop.spec.js`: layouts, icons, and activation.
- `tests/e2e/windows.spec.js`: multi-window behavior.
- `tests/e2e/settings.spec.js`: preferences and localization integration.
- `tests/e2e/accessibility.spec.js`: keyboard, reduced motion, and narrow screens.

---

### Task 1: Establish the Modular Shell and Test Harness

**Files:**
- Create: `package.json`
- Create: `playwright.config.js`
- Create: `tests/e2e/shell.spec.js`
- Create: `styles/tokens.css`
- Create: `styles/shell.css`
- Create: `scripts/main.js`
- Modify: `index.html`

**Interfaces:**
- Produces: document mounts `[data-boot-root]`, `[data-desktop-root]`, and module entry `scripts/main.js`.
- Produces: CSS tokens `--blue`, `--white`, `--grid-size`, `--stroke`, and `--hard-shadow`.

- [ ] **Step 1: Add the package and Playwright configuration**

```json
{
  "name": "two-am-portfolio-os",
  "private": true,
  "type": "module",
  "scripts": {
    "test:unit": "node --test tests/unit/*.test.js",
    "test:e2e": "playwright test",
    "test": "npm run test:unit && npm run test:e2e"
  },
  "devDependencies": {
    "@playwright/test": "^1.54.0"
  }
}
```

```js
// playwright.config.js
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    viewport: { width: 1440, height: 900 },
  },
  webServer: {
    command: 'python3 -m http.server 4173 --bind 127.0.0.1',
    port: 4173,
    reuseExistingServer: true,
  },
});
```

- [ ] **Step 2: Install the test dependency and browser**

Run:

```bash
npm install
npx playwright install chromium
```

Expected: both commands exit 0 and `node_modules/@playwright/test` exists.

- [ ] **Step 3: Write the failing shell test**

```js
// tests/e2e/shell.spec.js
import { test, expect } from '@playwright/test';

test('loads the portfolio OS shell with the English title', async ({ page }) => {
  await page.goto('/?skipBoot=1');
  await expect(page).toHaveTitle('Two A.M., A Frequency That Does Not Exist');
  await expect(page.locator('[data-system-shell]')).toBeVisible();
  await expect(page.locator('[data-desktop-root]')).toBeVisible();
});
```

- [ ] **Step 4: Run the test to prove the current page lacks the new shell**

Run: `npm run test:e2e -- --grep "loads the portfolio OS shell"`

Expected: FAIL because `[data-system-shell]` and the localized title do not exist.

- [ ] **Step 5: Replace the monolithic document with the minimal shell**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#ffffff" />
    <title>Two A.M., A Frequency That Does Not Exist</title>
    <link rel="stylesheet" href="./styles/tokens.css" />
    <link rel="stylesheet" href="./styles/shell.css" />
  </head>
  <body>
    <div data-system-shell>
      <section data-boot-root hidden></section>
      <main data-desktop-root aria-label="Portfolio desktop"></main>
    </div>
    <script type="module" src="./scripts/main.js"></script>
  </body>
</html>
```

```css
/* styles/tokens.css */
:root {
  --blue: #26159a;
  --white: #ffffff;
  --grid-size: 32px;
  --stroke: 1px solid var(--blue);
  --hard-shadow: 12px 12px 0 var(--blue);
  --serif: "Times New Roman", "Songti SC", "Yu Mincho", serif;
  --mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { min-height: 100%; }
body { color: var(--blue); background: var(--white); font-family: var(--serif); }
button, input { color: inherit; font: inherit; }
```

```css
/* styles/shell.css */
[data-system-shell], [data-desktop-root] { min-height: 100vh; }
[data-desktop-root] {
  position: relative;
  overflow: hidden;
  background-color: var(--white);
  background-image:
    linear-gradient(90deg, var(--blue) 1px, transparent 1px),
    linear-gradient(var(--blue) 1px, transparent 1px);
  background-size: var(--grid-size) var(--grid-size);
}
```

```js
// scripts/main.js
const desktopRoot = document.querySelector('[data-desktop-root]');
desktopRoot.dataset.ready = 'true';
```

- [ ] **Step 6: Run the shell test**

Run: `npm run test:e2e -- --grep "loads the portfolio OS shell"`

Expected: PASS.

---

### Task 2: Add Validated Preferences and Complete Locale Dictionaries

**Files:**
- Create: `scripts/state/preferences.js`
- Create: `scripts/i18n/dictionaries.js`
- Create: `scripts/i18n/i18n.js`
- Create: `tests/unit/preferences.test.js`
- Create: `tests/unit/i18n.test.js`

**Interfaces:**
- Produces: `DEFAULT_PREFERENCES`, `loadPreferences(storage)`, and `savePreferences(storage, preferences)`.
- Produces: `createI18n(initialLocale)` with `locale`, `t(key)`, `setLocale(locale)`, and `subscribe(listener)`.
- Preference shape: `{ version: 1, bootComplete: boolean, layout: 'auto'|'windows'|'macos', locale: 'en'|'zh-CN'|'ja', audioEnabled: boolean }`.

- [ ] **Step 1: Write failing preference tests**

```js
// tests/unit/preferences.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_PREFERENCES, loadPreferences, savePreferences } from '../../scripts/state/preferences.js';

const memoryStorage = (value = null) => ({
  value,
  getItem() { return this.value; },
  setItem(_key, next) { this.value = next; },
});

test('uses defaults without saved preferences', () => {
  assert.deepEqual(loadPreferences(memoryStorage()), DEFAULT_PREFERENCES);
});

test('repairs invalid fields while preserving valid fields', () => {
  const storage = memoryStorage(JSON.stringify({
    version: 1,
    bootComplete: true,
    layout: 'invalid',
    locale: 'ja',
    audioEnabled: false,
  }));
  assert.deepEqual(loadPreferences(storage), {
    ...DEFAULT_PREFERENCES,
    bootComplete: true,
    locale: 'ja',
  });
});

test('corrupt JSON returns complete defaults', () => {
  assert.deepEqual(loadPreferences(memoryStorage('{broken')), DEFAULT_PREFERENCES);
});

test('save serializes the validated shape', () => {
  const storage = memoryStorage();
  savePreferences(storage, { ...DEFAULT_PREFERENCES, layout: 'macos' });
  assert.equal(JSON.parse(storage.value).layout, 'macos');
});
```

- [ ] **Step 2: Write failing i18n tests**

```js
// tests/unit/i18n.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { createI18n } from '../../scripts/i18n/i18n.js';

test('defaults to English and switches locale', () => {
  const i18n = createI18n('en');
  assert.equal(i18n.t('site.title'), 'Two A.M., A Frequency That Does Not Exist');
  i18n.setLocale('zh-CN');
  assert.equal(i18n.t('site.title'), '凌晨两点，不存在的频率');
});

test('falls back to English for an unknown key in a locale', () => {
  const i18n = createI18n('ja');
  assert.equal(i18n.t('protocol.build'), 'BUILD: 882.A');
});

test('rejects unsupported locales', () => {
  const i18n = createI18n('en');
  assert.throws(() => i18n.setLocale('fr'), /Unsupported locale/);
});
```

- [ ] **Step 3: Run unit tests and confirm missing modules fail**

Run: `npm run test:unit`

Expected: FAIL with module-not-found errors for preferences and i18n.

- [ ] **Step 4: Implement preference validation**

```js
// scripts/state/preferences.js
const STORAGE_KEY = 'portfolio-os:preferences';
export const DEFAULT_PREFERENCES = Object.freeze({
  version: 1,
  bootComplete: false,
  layout: 'auto',
  locale: 'en',
  audioEnabled: false,
});

const layouts = new Set(['auto', 'windows', 'macos']);
const locales = new Set(['en', 'zh-CN', 'ja']);

export function loadPreferences(storage = localStorage) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFERENCES };
    const parsed = JSON.parse(raw);
    if (parsed.version !== 1) return { ...DEFAULT_PREFERENCES };
    return {
      version: 1,
      bootComplete: typeof parsed.bootComplete === 'boolean' ? parsed.bootComplete : false,
      layout: layouts.has(parsed.layout) ? parsed.layout : 'auto',
      locale: locales.has(parsed.locale) ? parsed.locale : 'en',
      audioEnabled: typeof parsed.audioEnabled === 'boolean' ? parsed.audioEnabled : false,
    };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export function savePreferences(storage = localStorage, preferences) {
  const validated = loadPreferences({ getItem: () => JSON.stringify(preferences) });
  try { storage.setItem(STORAGE_KEY, JSON.stringify(validated)); } catch { /* in-memory session continues */ }
  return validated;
}
```

- [ ] **Step 5: Implement dictionaries and the observable i18n service**

Create `scripts/i18n/dictionaries.js` with the same keys in every locale. Use these exact first-release values; protocol option names such as `60Hz`, `IPv4-Bit`, and `128-Bit Mosaic` remain unchanged and do not require dictionary entries.

```js
export const dictionaries = Object.freeze({
  en: Object.freeze({
    'site.title': 'Two A.M., A Frequency That Does Not Exist',
    'boot.portfolioOs': 'PORTFOLIO OS', 'boot.initializing': 'INITIALIZING', 'boot.skip': 'Skip boot',
    'apps.projects': 'Projects', 'apps.writing': 'Writing', 'apps.about': 'About', 'apps.contact': 'Contact', 'apps.settings': 'Settings',
    'settings.system': 'System', 'settings.display': 'Display', 'settings.mouse': 'Mouse', 'settings.network': 'Network',
    'settings.desktopLayout': 'Desktop Layout', 'settings.auto': 'Auto', 'settings.windows': 'Windows', 'settings.macos': 'macOS',
    'settings.language': 'Language', 'settings.systemAudio': 'System Audio', 'settings.on': 'On', 'settings.off': 'Off',
    'settings.replayBoot': 'Replay Boot Sequence', 'settings.visualOutput': 'Visual Output',
    'settings.resolutionGridDensity': 'Resolution Grid Density', 'settings.syncFrequency': 'Sync Frequency',
    'settings.postProcessFilter': 'Post-Process Filter', 'settings.ditherOverlay': '1-Bit Dither Overlay',
    'settings.moireInterference': 'Moire Interference', 'settings.aliasedEdges': 'Aliased Edges',
    'settings.tactileInput': 'Tactile Input', 'settings.trackingSensitivity': 'Tracking Sensitivity',
    'settings.doubleClickThreshold': 'Double-Click Threshold', 'settings.pointerAcceleration': 'Pointer Acceleration',
    'settings.linearDecay': 'Linear Decay', 'settings.snapToGrid': 'Snap-to-Grid (8px)',
    'settings.signalProtocol': 'Signal Protocol', 'settings.packetDitherRate': 'Data Packet Dither Rate',
    'settings.protocolArchitecture': 'Protocol Architecture', 'settings.encryptionLevel': 'Encryption Level',
    'windows.minimize': 'Minimize', 'windows.close': 'Close', 'windows.comingSoon': 'COMING SOON',
    'windows.moduleNotMounted': 'MODULE NOT MOUNTED', 'desktop.ready': 'SYSTEM READY',
    'desktop.language': 'Language', 'desktop.audioOn': 'AUDIO ON', 'desktop.audioOff': 'AUDIO OFF',
    'bot.standby': 'BOT SERVICE: STANDBY', 'protocol.build': 'BUILD: 882.A',
    'language.en': 'EN', 'language.zh': '中文', 'language.ja': '日本語',
  }),
  'zh-CN': Object.freeze({
    'site.title': '凌晨两点，不存在的频率',
    'boot.portfolioOs': '作品集系统', 'boot.initializing': '正在启动', 'boot.skip': '跳过启动',
    'apps.projects': '项目', 'apps.writing': '文章', 'apps.about': '关于', 'apps.contact': '联系', 'apps.settings': '设置',
    'settings.system': '系统', 'settings.display': '显示', 'settings.mouse': '鼠标', 'settings.network': '网络',
    'settings.desktopLayout': '桌面布局', 'settings.auto': '自动', 'settings.windows': 'Windows', 'settings.macos': 'macOS',
    'settings.language': '语言', 'settings.systemAudio': '系统声音', 'settings.on': '开启', 'settings.off': '关闭',
    'settings.replayBoot': '重播启动动画', 'settings.visualOutput': '视觉输出',
    'settings.resolutionGridDensity': '网格密度', 'settings.syncFrequency': '同步频率',
    'settings.postProcessFilter': '后期处理滤镜', 'settings.ditherOverlay': '1-Bit 抖动叠加',
    'settings.moireInterference': '摩尔纹干扰', 'settings.aliasedEdges': '锯齿边缘',
    'settings.tactileInput': '触觉输入', 'settings.trackingSensitivity': '追踪灵敏度',
    'settings.doubleClickThreshold': '双击阈值', 'settings.pointerAcceleration': '指针加速度',
    'settings.linearDecay': '线性衰减', 'settings.snapToGrid': '吸附到网格（8px）',
    'settings.signalProtocol': '信号协议', 'settings.packetDitherRate': '数据包抖动率',
    'settings.protocolArchitecture': '协议架构', 'settings.encryptionLevel': '加密等级',
    'windows.minimize': '最小化', 'windows.close': '关闭', 'windows.comingSoon': '即将开放',
    'windows.moduleNotMounted': '模块尚未挂载', 'desktop.ready': '系统就绪',
    'desktop.language': '语言', 'desktop.audioOn': '声音开启', 'desktop.audioOff': '声音关闭',
    'bot.standby': 'BOT 服务：待机', 'protocol.build': 'BUILD: 882.A',
    'language.en': 'EN', 'language.zh': '中文', 'language.ja': '日本語',
  }),
  ja: Object.freeze({
    'site.title': '午前二時、存在しない周波数',
    'boot.portfolioOs': 'ポートフォリオOS', 'boot.initializing': '起動中', 'boot.skip': '起動をスキップ',
    'apps.projects': 'プロジェクト', 'apps.writing': '文章', 'apps.about': 'プロフィール', 'apps.contact': '連絡', 'apps.settings': '設定',
    'settings.system': 'システム', 'settings.display': 'ディスプレイ', 'settings.mouse': 'マウス', 'settings.network': 'ネットワーク',
    'settings.desktopLayout': 'デスクトップ配置', 'settings.auto': '自動', 'settings.windows': 'Windows', 'settings.macos': 'macOS',
    'settings.language': '言語', 'settings.systemAudio': 'システム音', 'settings.on': 'オン', 'settings.off': 'オフ',
    'settings.replayBoot': '起動シーケンスを再生', 'settings.visualOutput': '映像出力',
    'settings.resolutionGridDensity': 'グリッド密度', 'settings.syncFrequency': '同期周波数',
    'settings.postProcessFilter': 'ポストプロセスフィルター', 'settings.ditherOverlay': '1-Bitディザオーバーレイ',
    'settings.moireInterference': 'モアレ干渉', 'settings.aliasedEdges': 'エイリアスエッジ',
    'settings.tactileInput': '触覚入力', 'settings.trackingSensitivity': 'トラッキング感度',
    'settings.doubleClickThreshold': 'ダブルクリックしきい値', 'settings.pointerAcceleration': 'ポインター加速',
    'settings.linearDecay': 'リニア減衰', 'settings.snapToGrid': 'グリッドにスナップ（8px）',
    'settings.signalProtocol': '信号プロトコル', 'settings.packetDitherRate': 'データパケットディザ率',
    'settings.protocolArchitecture': 'プロトコル構成', 'settings.encryptionLevel': '暗号化レベル',
    'windows.minimize': '最小化', 'windows.close': '閉じる', 'windows.comingSoon': '近日公開',
    'windows.moduleNotMounted': 'モジュール未接続', 'desktop.ready': 'システム準備完了',
    'desktop.language': '言語', 'desktop.audioOn': '音声オン', 'desktop.audioOff': '音声オフ',
    'bot.standby': 'BOTサービス：待機中', 'protocol.build': 'BUILD: 882.A',
    'language.en': 'EN', 'language.zh': '中文', 'language.ja': '日本語',
  }),
});
```

```js
// scripts/i18n/i18n.js
import { dictionaries } from './dictionaries.js';

export function createI18n(initialLocale = 'en') {
  let locale = initialLocale in dictionaries ? initialLocale : 'en';
  const listeners = new Set();
  return {
    get locale() { return locale; },
    t(key) {
      return dictionaries[locale][key] ?? dictionaries.en[key] ?? key;
    },
    setLocale(next) {
      if (!(next in dictionaries)) throw new Error(`Unsupported locale: ${next}`);
      if (locale === next) return;
      locale = next;
      listeners.forEach((listener) => listener(locale));
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
```

- [ ] **Step 6: Run unit tests**

Run: `npm run test:unit`

Expected: all preference and i18n tests PASS.

---

### Task 3: Define the Application Registry and 1-Bit Icon System

**Files:**
- Create: `scripts/apps/app-registry.js`
- Create: `styles/icons.css`
- Create: `tests/unit/app-registry.test.js`
- Modify: `index.html`

**Interfaces:**
- Consumes: i18n keys under `apps.*`.
- Produces: `APP_REGISTRY`, `getApp(id)`, and `getApps()`.
- Application shape: `{ id, titleKey, icon, defaultSize: { width, height }, renderer }`.

- [ ] **Step 1: Write the registry test**

```js
// tests/unit/app-registry.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { getApp, getApps } from '../../scripts/apps/app-registry.js';

test('registers the five first-release applications in desktop order', () => {
  assert.deepEqual(getApps().map(({ id }) => id), [
    'projects', 'writing', 'about', 'contact', 'settings',
  ]);
});

test('returns one stable definition per application', () => {
  assert.equal(getApp('projects').titleKey, 'apps.projects');
  assert.equal(getApp('settings').renderer, 'settings');
  assert.equal(getApp('missing'), null);
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `node --test tests/unit/app-registry.test.js`

Expected: FAIL because the registry does not exist.

- [ ] **Step 3: Implement the immutable registry**

```js
// scripts/apps/app-registry.js
const apps = Object.freeze([
  { id: 'projects', titleKey: 'apps.projects', icon: 'folder', defaultSize: { width: 520, height: 360 }, renderer: 'placeholder' },
  { id: 'writing', titleKey: 'apps.writing', icon: 'document', defaultSize: { width: 520, height: 360 }, renderer: 'placeholder' },
  { id: 'about', titleKey: 'apps.about', icon: 'identity', defaultSize: { width: 480, height: 340 }, renderer: 'placeholder' },
  { id: 'contact', titleKey: 'apps.contact', icon: 'signal', defaultSize: { width: 480, height: 340 }, renderer: 'placeholder' },
  { id: 'settings', titleKey: 'apps.settings', icon: 'controls', defaultSize: { width: 900, height: 600 }, renderer: 'settings' },
]);

export const APP_REGISTRY = apps;
export const getApps = () => apps.slice();
export const getApp = (id) => apps.find((app) => app.id === id) ?? null;
```

- [ ] **Step 4: Draw the five icons in CSS**

Add icon elements using `data-icon="folder|document|identity|signal|controls"`. Each uses a 46 by 46 pixel square frame, one-pixel border, white fill, and four-pixel blue hard shadow. Build glyphs with CSS borders, text, and pseudo-elements; do not add image assets or rounded corners.

- [ ] **Step 5: Link `styles/icons.css` and run tests**

Run:

```bash
node --test tests/unit/app-registry.test.js
npm run test:e2e -- --grep "loads the portfolio OS shell"
```

Expected: both commands PASS.

---

### Task 4: Implement the Boot State Machine

**Files:**
- Create: `scripts/boot.js`
- Create: `styles/boot.css`
- Create: `tests/e2e/boot.spec.js`
- Modify: `index.html`
- Modify: `scripts/main.js`

**Interfaces:**
- Consumes: preferences service, i18n service, audio service facade.
- Produces: `createBootController({ root, i18n, preferences, persistPreferences, onComplete })` with `start()`, `skip()`, and `replay()`.
- Uses exact step IDs: `projects`, `writing`, `about`, `contact`, `settings`, `bot`.

- [ ] **Step 1: Write failing boot-flow tests**

```js
// tests/e2e/boot.spec.js
import { test, expect } from '@playwright/test';

test('first visit shows English boot and skip persists completion', async ({ page }) => {
  await page.goto('/?skipBoot=1');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/');
  await expect(page.locator('[data-boot-root]')).toBeVisible();
  await expect(page.getByText('Two A.M., A Frequency That Does Not Exist')).toBeVisible();
  await page.getByRole('button', { name: 'Skip boot' }).click();
  await expect(page.locator('[data-desktop-root]')).toBeVisible();
  await page.reload();
  await expect(page.locator('[data-boot-root]')).toBeHidden();
});

test('reduced motion exposes the final boot state immediately', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByText('BOT [OK]')).toBeVisible();
});
```

- [ ] **Step 2: Run the boot tests and confirm failure**

Run: `npm run test:e2e -- tests/e2e/boot.spec.js`

Expected: FAIL because no boot controller or Skip button exists.

- [ ] **Step 3: Implement boot state and controller**

```js
// scripts/boot.js
export const BOOT_STEPS = Object.freeze([
  { id: 'projects', at: 400 },
  { id: 'writing', at: 950 },
  { id: 'about', at: 1500 },
  { id: 'contact', at: 2050 },
  { id: 'settings', at: 2600 },
  { id: 'bot', at: 3150 },
]);

export function createBootController({ root, i18n, preferences, persistPreferences, onComplete }) {
  let timers = [];
  const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };
  const finish = () => {
    clearTimers();
    preferences.bootComplete = true;
    persistPreferences(preferences);
    root.hidden = true;
    onComplete();
  };
  return {
    start({ force = false } = {}) {
      if (preferences.bootComplete && !force) return onComplete();
      root.hidden = false;
      root.dataset.phase = 'running';
      const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      BOOT_STEPS.forEach(({ id, at }) => {
        const apply = () => root.querySelector(`[data-boot-step="${id}"]`).dataset.status = 'ok';
        reduced ? apply() : timers.push(setTimeout(apply, at));
      });
      if (!reduced) timers.push(setTimeout(finish, 5000));
    },
    skip: finish,
    replay() {
      preferences.bootComplete = false;
      this.start({ force: true });
    },
  };
}
```

Render the localized title, build ID, six steps, progress indicator, and localized Skip button before `start()` runs. Use CSS stepped transitions and ensure reduced motion sets every step to its final visual state.

- [ ] **Step 4: Integrate startup in `scripts/main.js`**

Load preferences and i18n first. Define `persistPreferences = (next) => savePreferences(localStorage, next)` and pass it into the Boot controller. Keep the desktop root hidden until `onComplete`; support `?skipBoot=1` only as a local test helper and do not persist that query-string bypass.

- [ ] **Step 5: Run boot and shell tests**

Run: `npm run test:e2e -- tests/e2e/boot.spec.js tests/e2e/shell.spec.js`

Expected: all tests PASS.

---

### Task 5: Render Windows and macOS Desktop Modes

**Files:**
- Create: `scripts/desktop.js`
- Create: `styles/windows-mode.css`
- Create: `styles/macos-mode.css`
- Create: `tests/e2e/desktop.spec.js`
- Modify: `scripts/main.js`
- Modify: `index.html`

**Interfaces:**
- Consumes: application registry, i18n, preferences, and `onOpen(appId)` callback.
- Produces: `detectDesktopMode({ platform, userAgent }, layoutPreference)`.
- Produces: `createDesktopController({ root, apps, i18n, preferences, onOpen, onPreferenceChange })` with `render()`, `setMode(mode)`, and `setSelectedApp(appId)`.

- [ ] **Step 1: Write failing desktop tests**

```js
// tests/e2e/desktop.spec.js
import { test, expect } from '@playwright/test';

async function seedLayout(page, layout) {
  await page.addInitScript((selectedLayout) => {
    localStorage.setItem('portfolio-os:preferences', JSON.stringify({
      version: 1, bootComplete: true, layout: selectedLayout, locale: 'en', audioEnabled: false,
    }));
  }, layout);
}

test('Windows mode shows five icons and the taskbar', async ({ page }) => {
  await seedLayout(page, 'windows');
  await page.goto('/');
  await expect(page.locator('[data-desktop-mode="windows"]')).toBeVisible();
  await expect(page.locator('[data-app-icon]')).toHaveCount(5);
  await expect(page.locator('[data-windows-taskbar]')).toBeVisible();
});

test('macOS mode shows the menu bar and Dock', async ({ page }) => {
  await seedLayout(page, 'macos');
  await page.goto('/');
  await expect(page.locator('[data-desktop-mode="macos"]')).toBeVisible();
  await expect(page.locator('[data-macos-menu]')).toBeVisible();
  await expect(page.locator('[data-macos-dock]')).toBeVisible();
});
```

- [ ] **Step 2: Run the desktop tests and confirm failure**

Run: `npm run test:e2e -- tests/e2e/desktop.spec.js`

Expected: FAIL because desktop modes and icons are not rendered.

- [ ] **Step 3: Implement platform detection**

```js
export function detectDesktopMode(environment, preference) {
  if (preference === 'windows' || preference === 'macos') return preference;
  const source = `${environment.platform ?? ''} ${environment.userAgent ?? ''}`.toLowerCase();
  return source.includes('mac') ? 'macos' : 'windows';
}
```

- [ ] **Step 4: Render shared icons and mode-specific chrome**

Use one icon DOM list for both modes. Apply `data-desktop-mode` to the desktop root and change placement through CSS. Render:

- Windows: upper-left icon grid and bottom `[data-windows-taskbar]`.
- macOS: top `[data-macos-menu]` and bottom `[data-macos-dock]`.
- Both: language controls, audio status, localized site title in system chrome, and BOT mount point.

Implement selected-icon state, fine-pointer double-click activation, coarse-pointer single-tap activation, arrow-key navigation, and Enter activation.

- [ ] **Step 5: Run desktop tests**

Run: `npm run test:e2e -- tests/e2e/desktop.spec.js`

Expected: all desktop-mode tests PASS.

---

### Task 6: Implement Pure Window State and the DOM Window Manager

**Files:**
- Create: `scripts/state/window-state.js`
- Create: `scripts/window-manager.js`
- Create: `styles/windows.css`
- Create: `tests/unit/window-state.test.js`
- Create: `tests/e2e/windows.spec.js`
- Modify: `scripts/main.js`

**Interfaces:**
- Produces immutable transitions: `createWindowState()`, `openWindow(state, app, bounds)`, `focusWindow(state, appId)`, `minimizeWindow(state, appId)`, `restoreWindow(state, appId)`, `closeWindow(state, appId)`, `moveWindow(state, appId, position, bounds)`, and `clampGeometry(geometry, bounds)`.
- Window shape: `{ appId, x, y, width, height, z, status: 'normal'|'minimized' }`.
- Produces `createWindowManager({ root, taskSurface, registry, i18n, renderers })` with `open`, `focus`, `minimize`, `restore`, `close`, `reclamp`, and `getState`.

- [ ] **Step 1: Write failing state tests**

```js
// tests/unit/window-state.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createWindowState, openWindow, minimizeWindow, restoreWindow, closeWindow, moveWindow,
} from '../../scripts/state/window-state.js';

const app = { id: 'projects', defaultSize: { width: 520, height: 360 } };
const bounds = { x: 0, y: 24, width: 1280, height: 656 };

test('opening the same app focuses one instance', () => {
  const once = openWindow(createWindowState(), app, bounds);
  const twice = openWindow(once, app, bounds);
  assert.equal(twice.windows.length, 1);
  assert.equal(twice.activeId, 'projects');
});

test('minimize, restore, and close preserve valid state', () => {
  const opened = openWindow(createWindowState(), app, bounds);
  const minimized = minimizeWindow(opened, 'projects');
  assert.equal(minimized.windows[0].status, 'minimized');
  const restored = restoreWindow(minimized, 'projects');
  assert.equal(restored.windows[0].status, 'normal');
  assert.equal(closeWindow(restored, 'projects').windows.length, 0);
});

test('moving clamps a reachable title bar inside bounds', () => {
  const opened = openWindow(createWindowState(), app, bounds);
  const moved = moveWindow(opened, 'projects', { x: -900, y: 900 }, bounds);
  assert.ok(moved.windows[0].x >= -456);
  assert.ok(moved.windows[0].y <= 656 - 32);
});
```

- [ ] **Step 2: Run the state test and confirm failure**

Run: `node --test tests/unit/window-state.test.js`

Expected: FAIL because window-state exports do not exist.

- [ ] **Step 3: Implement immutable transitions**

Use a 32-pixel reachable title-bar requirement and 24-pixel cascade offsets. `openWindow` restores an existing minimized window and focuses an existing normal window. Every transition returns a new state object and new windows array.

```js
export function createWindowState() {
  return { windows: [], activeId: null, nextZ: 1, cascade: 0 };
}
```

Implement `clampGeometry` with explicit minimum and maximum coordinates derived from desktop bounds and title-bar reachability.

- [ ] **Step 4: Run state tests**

Run: `node --test tests/unit/window-state.test.js`

Expected: all window-state tests PASS.

- [ ] **Step 5: Write failing browser window tests**

```js
// tests/e2e/windows.spec.js
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('portfolio-os:preferences', JSON.stringify({
    version: 1, bootComplete: true, layout: 'windows', locale: 'en', audioEnabled: false,
  })));
  await page.goto('/');
});

test('opens one placeholder window and restores it from the taskbar', async ({ page }) => {
  await page.locator('[data-app-icon="projects"]').dblclick();
  await page.locator('[data-app-icon="projects"]').dblclick();
  await expect(page.locator('[data-app-window="projects"]')).toHaveCount(1);
  await page.locator('[data-app-window="projects"] [data-window-minimize]').click();
  await expect(page.locator('[data-app-window="projects"]')).toBeHidden();
  await page.locator('[data-running-app="projects"]').click();
  await expect(page.locator('[data-app-window="projects"]')).toBeVisible();
});
```

- [ ] **Step 6: Render DOM windows and controls**

The manager renders one article per open window with `data-app-window`, a title bar, localized title, minimize button, close button, and application-content mount. Pointer dragging updates the pure state then re-renders geometry. Taskbar and Dock running entries call the same restore/focus method.

- [ ] **Step 7: Run all window tests**

Run:

```bash
node --test tests/unit/window-state.test.js
npm run test:e2e -- tests/e2e/windows.spec.js
```

Expected: both suites PASS.

---

### Task 7: Port Settings and Connect Live Preferences

**Files:**
- Create: `scripts/apps/placeholder-app.js`
- Create: `scripts/apps/settings-app.js`
- Create: `styles/apps.css`
- Create: `tests/e2e/settings.spec.js`
- Modify: `scripts/main.js`
- Modify: `scripts/apps/app-registry.js`
- Modify: `index.html`

**Interfaces:**
- Consumes: i18n, preference update function, boot `replay`, and audio `setEnabled` callback.
- Produces renderers `renderPlaceholderApp({ app, i18n })` and `renderSettingsApp({ i18n, preferences, updatePreferences, replayBoot })`.

- [ ] **Step 1: Write failing Settings integration tests**

```js
// tests/e2e/settings.spec.js
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('portfolio-os:preferences', JSON.stringify({
    version: 1, bootComplete: true, layout: 'windows', locale: 'en', audioEnabled: false,
  })));
  await page.goto('/');
  await page.locator('[data-app-icon="settings"]').dblclick();
});

test('switches desktop mode without closing Settings', async ({ page }) => {
  await page.getByLabel('Desktop Layout').selectOption('macos');
  await expect(page.locator('[data-desktop-mode="macos"]')).toBeVisible();
  await expect(page.locator('[data-app-window="settings"]')).toBeVisible();
});

test('switches the complete open UI to Chinese', async ({ page }) => {
  await page.getByLabel('Language').selectOption('zh-CN');
  await expect(page).toHaveTitle('凌晨两点，不存在的频率');
  await expect(page.locator('[data-app-window="settings"]')).toContainText('设置');
  await expect(page.locator('[data-app-icon="projects"]')).toContainText('项目');
});
```

- [ ] **Step 2: Run Settings tests and confirm failure**

Run: `npm run test:e2e -- tests/e2e/settings.spec.js`

Expected: FAIL because the Settings renderer and controls do not exist.

- [ ] **Step 3: Port the current control panel into `settings-app.js`**

Preserve these existing sections and interaction values:

- Display: Resolution Grid Density `72`, Sync Frequency `60Hz`, `75Hz`, `120Hz`, Post-Process filters.
- Mouse: Tracking Sensitivity `45`, Double-Click Threshold data bars, pointer acceleration toggles.
- Network: Data Packet Dither Rate `90`, protocol radio options, encryption toggles.

Add an actual System section with labeled controls for `Desktop Layout`, `Language`, `System Audio`, and `Replay Boot Sequence`. Bind each control to the shared preference update function rather than local component state.

- [ ] **Step 4: Implement the shared placeholder renderer**

Render the localized application title, localized `COMING SOON`, application ID, and `MODULE NOT MOUNTED` status in the same straight-edged, dithered visual system. Do not create four separate placeholder components.

- [ ] **Step 5: Subscribe all visible UI to locale and preference changes**

On locale changes, update:

- Document title and `html[lang]`.
- Desktop icon labels.
- Taskbar or menu-bar text.
- Running application entries.
- Open window titles.
- Settings labels.
- Placeholder contents.
- BOT standby message.

On layout changes, re-render chrome and call `windowManager.reclamp()` without modifying its open/minimized state.

- [ ] **Step 6: Run Settings and existing suites**

Run:

```bash
npm run test:unit
npm run test:e2e -- tests/e2e/settings.spec.js tests/e2e/windows.spec.js tests/e2e/desktop.spec.js
```

Expected: all tests PASS.

---

### Task 8: Add Opt-In Audio and the BOT Standby Mock

**Files:**
- Create: `scripts/audio.js`
- Create: `scripts/bot-standby.js`
- Modify: `styles/apps.css`
- Modify: `scripts/main.js`
- Modify: `tests/e2e/settings.spec.js`

**Interfaces:**
- Produces `createAudioService()` with `enabled`, `setEnabled(value)`, and `play(cue)` where cue is `boot`, `click`, `window`, or `notice`.
- Produces `createBotStandby({ root, i18n, onNotice })` with `render()` and `destroy()`.

- [ ] **Step 1: Add failing browser checks for audio preference and BOT status**

```js
test('audio stays off until explicitly enabled', async ({ page }) => {
  await expect(page.getByLabel('System Audio')).not.toBeChecked();
  await page.getByLabel('System Audio').check();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('portfolio-os:preferences')));
  expect(stored.audioEnabled).toBe(true);
});

test('BOT click shows a standby system message', async ({ page }) => {
  await page.locator('[data-app-window="settings"] [data-window-close]').click();
  await page.locator('[data-bot-standby]').click();
  await expect(page.getByRole('status')).toContainText('BOT SERVICE: STANDBY');
});
```

- [ ] **Step 2: Run focused tests and confirm failure**

Run: `npm run test:e2e -- tests/e2e/settings.spec.js --grep "audio|BOT"`

Expected: FAIL because audio and BOT services are absent.

- [ ] **Step 3: Implement generated Web Audio cues**

Create `AudioContext` only inside `setEnabled(true)` after the user interaction. Generate short oscillator/gain cues in code; do not add media files. Wrap initialization and playback in error handling that preserves the enabled preference while allowing silent operation.

- [ ] **Step 4: Render and position the BOT standby control**

Use a square 1-bit face, monospace `STANDBY` label, and hard shadow. Position above the active taskbar or Dock. Clicking emits one localized polite status message and does not create an app window.

- [ ] **Step 5: Run focused and regression tests**

Run:

```bash
npm run test:e2e -- tests/e2e/settings.spec.js
npm run test:e2e -- tests/e2e/desktop.spec.js tests/e2e/windows.spec.js
```

Expected: all tests PASS.

---

### Task 9: Complete Responsive, Accessibility, and Full-System Verification

**Files:**
- Create: `styles/responsive.css`
- Create: `tests/e2e/accessibility.spec.js`
- Modify: `index.html`
- Modify: `styles/shell.css`
- Modify: `styles/windows.css`
- Modify: `scripts/desktop.js`
- Modify: `scripts/window-manager.js`

**Interfaces:**
- Consumes all completed shell modules.
- Produces the final narrow-screen fallback and final verification evidence.

- [ ] **Step 1: Write failing accessibility and responsive tests**

```js
// tests/e2e/accessibility.spec.js
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('portfolio-os:preferences', JSON.stringify({
    version: 1, bootComplete: true, layout: 'windows', locale: 'en', audioEnabled: false,
  })));
});

test('keyboard selects and opens an application', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-app-icon="projects"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-app-window="projects"]')).toBeVisible();
  await expect(page.locator('[data-window-close]')).toBeFocused();
});

test('1280x720 keeps desktop chrome and a window reachable', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await page.locator('[data-app-icon="settings"]').dblclick();
  const titleBar = page.locator('[data-app-window="settings"] [data-window-titlebar]');
  await expect(titleBar).toBeInViewport();
  await expect(page.locator('[data-windows-taskbar]')).toBeInViewport();
});

test('390x844 uses one-app fallback without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.locator('[data-app-icon="settings"]').click();
  await expect(page.locator('[data-app-window="settings"]')).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  expect(overflow).toBe(false);
});
```

- [ ] **Step 2: Run the new tests and record failures**

Run: `npm run test:e2e -- tests/e2e/accessibility.spec.js`

Expected: at least the narrow-screen and focus-management assertions FAIL before the final accessibility work.

- [ ] **Step 3: Implement the narrow-screen fallback**

At `max-width: 760px` or coarse-pointer constrained layouts:

- Replace desktop free placement with a single-column or compact icon grid.
- Open one full-screen application surface at a time.
- Hide taskbar/Dock running-window complexity while retaining language and Settings access.
- Disable pointer dragging and multi-window overlap.
- Keep the BOT standby control visible without covering navigation.
- Preserve the 32-pixel grid, title, palette, and 1-bit icons.

- [ ] **Step 4: Complete focus and ARIA behavior**

- Add descriptive labels to icon buttons, language buttons, audio state, window controls, and boot Skip.
- Move focus to the Close button when a window opens.
- Return focus to the launching icon when its window closes.
- Mark inactive application content hidden from the accessibility tree.
- Expose system messages through `role="status"` with polite announcements.
- Keep visible two-pixel focus outlines in the blue system style.

- [ ] **Step 5: Verify reduced motion and CJK text fitting**

Add tests that emulate reduced motion, switch to `zh-CN` and `ja`, open Settings and every placeholder app, and assert no system-control bounding box exceeds its containing taskbar, menu bar, Dock, icon, or window title region.

- [ ] **Step 6: Run the complete automated suite**

Run:

```bash
npm test
```

Expected: unit and Playwright suites finish with zero failures.

- [ ] **Step 7: Perform final browser visual verification**

Using the local site, capture and inspect these states:

- 1440 by 900 Windows desktop after boot.
- 1440 by 900 macOS desktop with one normal and one minimized window.
- 1280 by 720 Settings window.
- 390 by 844 narrow-screen fallback.
- English, Chinese, and Japanese system chrome.
- Reduced-motion first boot.

Confirm the canvas is nonblank, the 32-pixel grid is visible, text does not overlap, the BOT clears system chrome, windows remain reachable, and browser console logs contain no application errors.

- [ ] **Step 8: Final file and scope audit**

Run:

```bash
rg -n "TODO|TBD|FIXME|console\.log|Bluer Flight" index.html styles scripts tests
rg -n "border-radius|backdrop-filter|linear-gradient" styles
```

Expected:

- First command finds no stale title, debug statements, or unfinished markers.
- Any `linear-gradient` result is limited to the required grid, dither, scanline, or 1-bit icon patterns.
- `border-radius` and `backdrop-filter` do not appear in production styles.

---

## Completion Gate

Implementation is complete only when:

1. `npm test` exits 0 with zero failing tests.
2. Fresh browser screenshots cover both desktop modes, the 1280 by 720 desktop, the 390 by 844 fallback, and all three locales.
3. Fresh console inspection reports no application errors.
4. The exact localized titles and default-English behavior match the approved design specification.
5. The current Settings demonstrations remain functional inside the new application window.
6. The independent mobile shells and real BOT remain outside this implementation.
