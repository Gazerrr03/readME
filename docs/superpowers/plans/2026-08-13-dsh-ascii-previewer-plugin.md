# DSH ASCII Previewer Client Plugin — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a DeepSeek Harness client plugin (`@qizhi/ascii-previewer`) that adds an `ASCII` button to the session header; clicking it opens a retro-terminal overlay where the user imports an image (picker / drag-drop / paste) and sees a live ASCII-art preview with width/contrast/brightness/invert/character-set controls plus copy and download.

**Architecture:** A cordis client plugin in the shipped `window.__ModuleLoader__.load({id, factory})` bundle format (no build step). The factory requires only `react` / `react-dom` / `react/jsx-runtime` (loader externals), registers a dictionary namespace and one slot contribution (`conversation.session.header.actions`, the same slot Jobs/Subagent use), and renders the overlay via `createPortal` to `document.body`. Conversion math is pure (`gridFor` + `convert`), exported for Node unit tests. Install via `dsh plugin --profile web add` + one insert row in the profile's `cordis.patch.yml`; a server restart activates it.

**Tech Stack:** Plain JS (ESM-style bundle wrapped in the loader factory), React 18 (externals), canvas 2D for downsampling, node:test for unit tests.

## Global Constraints

- Package name exactly `@qizhi/ascii-previewer`; source lives at `dsh-plugins/ascii-previewer/` in the portfolio repo.
- Bundle id in `window.__ModuleLoader__.load({ id })` MUST equal the package name.
- `package.json` MUST declare `dsh.client.platform: "web"` and `exports["./client"]` (node half throws otherwise).
- Plugin body exports: `inject` (service names array) and `apply(ctx)`; keep service deps minimal: `["slots", "locale"]`.
- Locale dictionaries keyed `{ zh, en }` only (client locale service supports exactly these two).
- Overlay and controls must not depend on host RPCs — everything runs in the browser.
- Conversion mapping convention: dark → densest glyph, light → sparsest glyph, same as `scripts/environment/environment-renderer.js`.
- Node unit test must load the real `lib/client.js` with a stubbed `window.__ModuleLoader__` and never need a real DOM.
- Harness-side edits are limited to: the profile install + one insert row in `~/.dsh/profiles/web/cordis.patch.yml`. No shipped bundle or web-app patch is modified.
- New client packages only activate after restarting `dsh web`; coordinate the restart with the user.

---

### Task 1: Scaffold the plugin package

**Files:**
- Create: `dsh-plugins/ascii-previewer/package.json`
- Create: `dsh-plugins/ascii-previewer/README.md`

**Interfaces:**
- Produces: package `@qizhi/ascii-previewer` with `exports["./client"]` → `lib/client.js` (created in Task 3) and `dsh.client.platform: "web"`.

- [ ] **Step 1: Create the package manifest**

`dsh-plugins/ascii-previewer/package.json`:

```json
{
  "name": "@qizhi/ascii-previewer",
  "version": "0.1.0",
  "description": "Import an image and preview it converted to ASCII art, live, inside the DeepSeek Harness GUI.",
  "private": true,
  "type": "module",
  "exports": {
    "./client": "./lib/client.js",
    "./package.json": "./package.json"
  },
  "dsh": {
    "client": {
      "platform": "web"
    }
  },
  "license": "MIT"
}
```

- [ ] **Step 2: Create the README**

`dsh-plugins/ascii-previewer/README.md` — short: what it does, install command (`dsh plugin --profile web add <abs path>`), the cordis.patch.yml insert snippet, and the restart requirement.

- [ ] **Step 3: Verify the manifest parses**

Run:
```bash
cd /Users/qizhi_dong/Projects/portfolio-blogs && node -e "const p = require('./dsh-plugins/ascii-previewer/package.json'); if (p.dsh?.client?.platform !== 'web') process.exit(1); if (!p.exports?.['./client']) process.exit(1); console.log('manifest ok')"
```
Expected: `manifest ok`

- [ ] **Step 4: Commit**

```bash
git add dsh-plugins/ascii-previewer
git commit -m "feat(ascii-previewer): scaffold plugin package manifest"
```

---

### Task 2: Conversion core (`gridFor` + `convert`) with unit tests

**Files:**
- Create: `tests/unit/ascii-previewer.test.js`
- Modify: `dsh-plugins/ascii-previewer/lib/client.js` (create the file; only the pure functions + bundle skeleton + exports in this task)

**Interfaces:**
- Produces (all exported from the bundle's materialized `module.exports`):
  - `gridFor(sourceWidth, sourceHeight, cols, aspect?) → {cols, rows}` — `rows = max(1, round(cols × (sourceHeight/sourceWidth) × (aspect ?? 0.5)))`, `cols = max(1, floor(cols))`.
  - `convert(imageData, options?) → {text, rows, cols}` — `imageData = {width, height, data}` (`data` is a `Uint8ClampedArray` RGBA); `options = {ramp?, contrast?, brightness?, invert?}`; 1 pixel = 1 cell; returns rows joined with `\n`.
  - `RAMPS = {standard, blocky, minimal}` — `standard` is Paul Bourke's full ramp `$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\|()1{}[]?-_+~<>i!lI;:,"^`. `; `blocky` = `@%#*+=-:. `; `minimal` = ` .:-=+*#%@`.

- [ ] **Step 1: Write the failing unit test**

`tests/unit/ascii-previewer.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';

// Load the real bundle in Node with a stubbed loader. The factory requires
// react/react-dom only for the UI; the stub keeps materialization side-effect
// free (CSS injection is guarded by `typeof document !== "undefined"`).
let entry = null;
globalThis.window = {
  __ModuleLoader__: {
    load(registered) { entry = registered; },
  },
};

await import('../../dsh-plugins/ascii-previewer/lib/client.js');

assert.ok(entry, 'bundle registers with window.__ModuleLoader__');
assert.equal(entry.id, '@qizhi/ascii-previewer');

const stubRequire = (spec) => ({ __stub: spec });
const exports_ = entry.factory(stubRequire);
const { convert, gridFor, RAMPS } = exports_;

test('gridFor honours the 2:1 cell aspect ratio', () => {
  assert.deepEqual(gridFor(100, 100, 50), { cols: 50, rows: 25 });
  assert.deepEqual(gridFor(200, 100, 100), { cols: 100, rows: 25 });
  assert.deepEqual(gridFor(100, 100, 40, 1), { cols: 40, rows: 40 });
  assert.deepEqual(gridFor(10, 10, 0), { cols: 1, rows: 1 });
});

test('convert maps black to the densest glyph and white to the sparsest', () => {
  const ramp = RAMPS.standard;
  const data = new Uint8ClampedArray([
    0, 0, 0, 255, 255, 255, 255, 255,
    128, 128, 128, 255, 0, 0, 0, 255,
  ]);
  const out = convert({ width: 2, height: 2, data }, { ramp });
  assert.equal(out.cols, 2);
  assert.equal(out.rows, 2);
  const lines = out.text.split('\n');
  assert.equal(lines.length, 2);
  assert.equal(lines[0].length, 2);
  assert.equal(lines[0][0], ramp[0], 'black -> densest');
  assert.equal(lines[0][1], ramp[ramp.length - 1], 'white -> sparsest');
  assert.equal(lines[1][1], ramp[0]);
  assert.ok(lines[1][0] === ramp[Math.floor(ramp.length / 2)], 'mid gray -> middle glyph');
});

test('invert flips the mapping', () => {
  const ramp = RAMPS.standard;
  const data = new Uint8ClampedArray([
    0, 0, 0, 255, 255, 255, 255, 255,
  ]);
  const out = convert({ width: 2, height: 1, data }, { ramp, invert: true });
  const [line] = out.text.split('\n');
  assert.equal(line[0], ramp[ramp.length - 1]);
  assert.equal(line[1], ramp[0]);
});

test('brightness shifts black toward lighter glyphs', () => {
  const ramp = RAMPS.standard;
  const data = new Uint8ClampedArray([0, 0, 0, 255]);
  const plain = convert({ width: 1, height: 1, data }, { ramp }).text;
  const lifted = convert({ width: 1, height: 1, data }, { ramp, brightness: 128 }).text;
  assert.equal(plain, ramp[0]);
  const liftedIndex = ramp.indexOf(lifted);
  assert.ok(liftedIndex > 0, `expected a lighter glyph, got index ${liftedIndex}`);
});

test('convert guards degenerate input', () => {
  const out = convert({ width: 0, height: 0, data: new Uint8ClampedArray(0) }, {});
  assert.deepEqual(out, { text: '', rows: 0, cols: 0 });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/unit/ascii-previewer.test.js`
Expected: FAIL — `Cannot find module '../../dsh-plugins/ascii-previewer/lib/client.js'` (bundle does not exist yet).

- [ ] **Step 3: Create the bundle skeleton with the pure core**

`dsh-plugins/ascii-previewer/lib/client.js`:

```js
window.__ModuleLoader__.load({
  id: '@qizhi/ascii-previewer',
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

    var react = require('react');
    var reactDom = require('react-dom');
    var jsxRuntime = require('react/jsx-runtime');
    var jsx = jsxRuntime.jsx;
    var jsxs = jsxRuntime.jsxs;
    var Fragment = jsxRuntime.Fragment;

    /* ---- ASCII conversion core (pure; exported for unit tests) ---- */

    var RAMP_STANDARD = '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,"^`. ';
    var RAMP_BLOCKY = '@%#*+=-:. ';
    var RAMP_MINIMAL = ' .:-=+*#%@';
    var RAMPS = { standard: RAMP_STANDARD, blocky: RAMP_BLOCKY, minimal: RAMP_MINIMAL };

    function gridFor(sourceWidth, sourceHeight, cols, aspect) {
      var targetCols = Math.max(1, Math.floor(cols || 1));
      var ratio = sourceHeight / Math.max(1, sourceWidth);
      var targetRows = Math.max(1, Math.round(targetCols * ratio * (aspect == null ? 0.5 : aspect)));
      return { cols: targetCols, rows: targetRows };
    }

    function luminanceAt(data, offset) {
      return 0.299 * data[offset] + 0.587 * data[offset + 1] + 0.114 * data[offset + 2];
    }

    function convert(imageData, options) {
      var opts = options || {};
      var ramp = opts.ramp || RAMP_STANDARD;
      var contrast = opts.contrast == null ? 1 : opts.contrast;
      var brightness = opts.brightness || 0;
      var invert = Boolean(opts.invert);
      var width = imageData.width;
      var height = imageData.height;
      if (width < 1 || height < 1) return { text: '', rows: 0, cols: 0 };
      var lines = [];
      for (var row = 0; row < height; row += 1) {
        var line = '';
        for (var col = 0; col < width; col += 1) {
          var offset = (row * width + col) * 4;
          var value = luminanceAt(imageData.data, offset);
          value = (value - 128) * contrast + 128 + brightness;
          if (invert) value = 255 - value;
          if (value < 0) value = 0;
          else if (value > 255) value = 255;
          var index = Math.min(ramp.length - 1, Math.floor((value / 256) * ramp.length));
          line += ramp[index];
        }
        lines.push(line);
      }
      return { text: lines.join('\n'), rows: height, cols: width };
    }

    exports.gridFor = gridFor;
    exports.convert = convert;
    exports.RAMPS = RAMPS;
    return module.exports;
  },
});
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test tests/unit/ascii-previewer.test.js`
Expected: PASS (all 5 tests).

- [ ] **Step 5: Commit**

```bash
git add dsh-plugins/ascii-previewer/lib/client.js tests/unit/ascii-previewer.test.js
git commit -m "feat(ascii-previewer): pure ASCII conversion core with unit tests"
```

---

### Task 3: Client plugin body — header action, overlay UI, i18n

**Files:**
- Modify: `dsh-plugins/ascii-previewer/lib/client.js` (add CSS, dictionaries, `AsciiAction`, `AsciiOverlay`, `apply`/`inject`; keep the Task 2 core intact)

**Interfaces:**
- Consumes: `gridFor`, `convert`, `RAMPS` from Task 2 (same file, same signatures).
- Produces: `exports.apply(ctx)` (registers `ascii` namespace + `conversation.session.header.actions` entry `id: "ascii-previewer", order: 30`) and `exports.inject = ["slots", "locale"]`.

- [ ] **Step 1: Extend the bundle with CSS, dictionaries, and the UI**

Append inside the factory (before `exports.gridFor = ...`), and add the plugin body after the core exports. The complete file becomes:

```js
window.__ModuleLoader__.load({
  id: '@qizhi/ascii-previewer',
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

    var react = require('react');
    var reactDom = require('react-dom');
    var jsxRuntime = require('react/jsx-runtime');
    var jsx = jsxRuntime.jsx;
    var jsxs = jsxRuntime.jsxs;
    var Fragment = jsxRuntime.Fragment;

    /* ---- styles (shipped injection pattern; skipped in Node) ---- */

    var css = [
      '.qza-action{background:#111a42;color:#93b4ff;border:1px solid #2a3a75;font:inherit;font-size:11px;letter-spacing:.06em;padding:2px 10px;cursor:pointer;border-radius:4px}',
      '.qza-action:hover{background:#1b2a6b;color:#cfe0ff}',
      '.qza-overlay{position:fixed;inset:0;z-index:2147483000;background:rgba(2,6,23,.9);display:flex;align-items:center;justify-content:center;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}',
      '.qza-panel{width:min(94vw,1080px);height:min(88vh,720px);background:#0b1026;border:1px solid #3b5bdb;box-shadow:0 0 0 1px #000,0 0 42px rgba(59,91,219,.35),inset 0 0 60px rgba(59,91,219,.12);color:#e8ecff;display:flex;flex-direction:column;border-radius:6px;overflow:hidden}',
      '.qza-header{display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-bottom:1px solid #22305c;background:#0d1330;flex:none}',
      '.qza-title{font-size:12px;letter-spacing:.18em;color:#93b4ff;text-transform:uppercase}',
      '.qza-close{background:none;border:1px solid #3b5bdb;color:#93b4ff;cursor:pointer;font:inherit;font-size:11px;padding:2px 10px}',
      '.qza-body{flex:1;display:flex;min-height:0}',
      '.qza-controls{width:216px;flex:none;padding:12px;border-right:1px solid #22305c;overflow-y:auto;display:flex;flex-direction:column;gap:14px;font-size:11px}',
      '.qza-field{display:flex;flex-direction:column;gap:4px}',
      '.qza-label{color:#8ba3ff;letter-spacing:.08em}',
      '.qza-range{width:100%;accent-color:#4d7cff}',
      '.qza-ramps{display:flex;gap:4px}',
      '.qza-ramp{flex:1;padding:4px 0;font:inherit;font-size:10px;background:#111a42;color:#93b4ff;border:1px solid #2a3a75;cursor:pointer}',
      '.qza-ramp[data-active="true"]{background:#2447c9;color:#fff;border-color:#5b7fff}',
      '.qza-toggle-row{display:flex;align-items:center;gap:6px}',
      '.qza-stage{flex:1;min-width:0;display:flex;flex-direction:column;padding:10px;gap:8px}',
      '.qza-dropzone{flex:1;min-height:0;border:1px dashed #33508f;border-radius:4px;display:flex;align-items:center;justify-content:center;cursor:pointer;background:rgba(59,91,219,.05);overflow:hidden}',
      '.qza-dropzone[data-active="true"]{border-color:#7d9dff;background:rgba(93,133,255,.12)}',
      '.qza-hint{text-align:center;color:#6b7fc4;font-size:12px;line-height:1.9;padding:12px}',
      '.qza-pre{margin:0;width:100%;height:100%;overflow:auto;font-size:9px;line-height:1.05;white-space:pre;color:#d6e2ff;text-shadow:0 0 4px rgba(120,160,255,.35);padding:10px;box-sizing:border-box;background:#070b1d;user-select:text}',
      '.qza-footer{display:flex;gap:8px;padding:8px 12px;border-top:1px solid #22305c;background:#0d1330;align-items:center;flex:none}',
      '.qza-btn{background:#111a42;color:#93b4ff;border:1px solid #2a3a75;font:inherit;font-size:11px;letter-spacing:.06em;padding:4px 12px;cursor:pointer}',
      '.qza-btn:hover:not(:disabled){background:#1b2a6b;color:#cfe0ff}',
      '.qza-btn:disabled{opacity:.5;cursor:default}',
      '.qza-btn-primary{background:#2447c9;border-color:#5b7fff;color:#fff}',
      '.qza-status{margin-left:auto;color:#8ba3ff;font-size:11px}',
      '.qza-error{color:#ff9db0}',
    ].join('');

    var tagId = '@qizhi/ascii-previewer/ascii.css';
    if (
      typeof document !== 'undefined'
      && document.querySelector('style[data-plugin-css=' + JSON.stringify(tagId) + ']') === null
    ) {
      var tag = document.createElement('style');
      tag.dataset.plugin = '@qizhi/ascii-previewer';
      tag.dataset.pluginCss = tagId;
      tag.textContent = css;
      document.head.appendChild(tag);
    }

    /* ---- dictionaries ---- */

    var zh = {
      'action.title': 'ASCII 图片转换',
      'overlay.title': 'ASCII 转换预览',
      'import.choose': '选择图片',
      'import.drag': '拖拽图片到此处',
      'import.paste': '或按 ⌘V 粘贴',
      'import.error': '无法读取该图片',
      width: '宽度',
      contrast: '对比度',
      brightness: '亮度',
      invert: '反色',
      charset: '字符集',
      'charset.standard': '全密度',
      'charset.blocky': '粗块',
      'charset.minimal': '极简',
      copy: '复制',
      copied: '已复制',
      download: '下载 .txt',
      close: '关闭',
    };
    var en = {
      'action.title': 'ASCII image converter',
      'overlay.title': 'ASCII preview',
      'import.choose': 'Choose an image',
      'import.drag': 'Drag & drop an image here',
      'import.paste': 'or press ⌘V to paste',
      'import.error': 'Could not read that image',
      width: 'Width',
      contrast: 'Contrast',
      brightness: 'Brightness',
      invert: 'Invert',
      charset: 'Character set',
      'charset.standard': 'Full',
      'charset.blocky': 'Blocky',
      'charset.minimal': 'Minimal',
      copy: 'Copy',
      copied: 'Copied',
      download: 'Download .txt',
      close: 'Close',
    };

    /* ---- ASCII conversion core (pure; exported for unit tests) ---- */

    var RAMP_STANDARD = '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,"^`. ';
    var RAMP_BLOCKY = '@%#*+=-:. ';
    var RAMP_MINIMAL = ' .:-=+*#%@';
    var RAMPS = { standard: RAMP_STANDARD, blocky: RAMP_BLOCKY, minimal: RAMP_MINIMAL };

    function gridFor(sourceWidth, sourceHeight, cols, aspect) {
      var targetCols = Math.max(1, Math.floor(cols || 1));
      var ratio = sourceHeight / Math.max(1, sourceWidth);
      var targetRows = Math.max(1, Math.round(targetCols * ratio * (aspect == null ? 0.5 : aspect)));
      return { cols: targetCols, rows: targetRows };
    }

    function luminanceAt(data, offset) {
      return 0.299 * data[offset] + 0.587 * data[offset + 1] + 0.114 * data[offset + 2];
    }

    function convert(imageData, options) {
      var opts = options || {};
      var ramp = opts.ramp || RAMP_STANDARD;
      var contrast = opts.contrast == null ? 1 : opts.contrast;
      var brightness = opts.brightness || 0;
      var invert = Boolean(opts.invert);
      var width = imageData.width;
      var height = imageData.height;
      if (width < 1 || height < 1) return { text: '', rows: 0, cols: 0 };
      var lines = [];
      for (var row = 0; row < height; row += 1) {
        var line = '';
        for (var col = 0; col < width; col += 1) {
          var offset = (row * width + col) * 4;
          var value = luminanceAt(imageData.data, offset);
          value = (value - 128) * contrast + 128 + brightness;
          if (invert) value = 255 - value;
          if (value < 0) value = 0;
          else if (value > 255) value = 255;
          var index = Math.min(ramp.length - 1, Math.floor((value / 256) * ramp.length));
          line += ramp[index];
        }
        lines.push(line);
      }
      return { text: lines.join('\n'), rows: height, cols: width };
    }

    /* ---- UI components ---- */

    function AsciiAction(props) {
      var opened = react.useState(false);
      var isOpen = opened[0];
      var setOpen = opened[1];
      var t = props.t || function (key) { return key; };
      return jsxs(Fragment, { children: [
        jsx('button', {
          type: 'button',
          className: 'qza-action',
          title: t('action.title'),
          'aria-label': t('action.title'),
          onClick: function () { setOpen(true); },
        }, 'ASCII'),
        isOpen
          ? reactDom.createPortal(
            jsx(AsciiOverlay, {
              t: t,
              onClose: function () { setOpen(false); },
            }),
            document.body,
          )
          : null,
      ] });
    }

    function AsciiOverlay(props) {
      var t = props.t;
      var onClose = props.onClose;

      var imageState = react.useState(null);
      var loadedImage = imageState[0];
      var setImage = imageState[1];

      var settingsState = react.useState({
        width: 100, contrast: 1, brightness: 0, invert: false, ramp: 'standard',
      });
      var settings = settingsState[0];
      var setSettings = settingsState[1];

      var previewState = react.useState(null);
      var result = previewState[0];
      var setPreview = previewState[1];

      var statusState = react.useState(null);
      var statusValue = statusState[0];
      var setStatus = statusState[1];

      var dragState = react.useState(false);
      var isDragActive = dragState[0];
      var setDragActive = dragState[1];

      var fileInputRef = react.useRef(null);
      var statusTimerRef = react.useRef(null);

      var patch = function (patchValue) {
        setSettings(Object.assign({}, settings, patchValue));
      };

      var importFile = function (file) {
        if (!file || file.type.indexOf('image/') !== 0) {
          setStatus({ error: t('import.error') });
          return;
        }
        var url = URL.createObjectURL(file);
        var img = new Image();
        img.onload = function () {
          URL.revokeObjectURL(url);
          setImage(img);
          setStatus(null);
        };
        img.onerror = function () {
          URL.revokeObjectURL(url);
          setStatus({ error: t('import.error') });
        };
        img.src = url;
      };

      react.useEffect(function () {
        if (!loadedImage) { setPreview(null); return; }
        var grid = gridFor(loadedImage.naturalWidth, loadedImage.naturalHeight, settings.width);
        var canvas = document.createElement('canvas');
        canvas.width = grid.cols;
        canvas.height = grid.rows;
        var ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(loadedImage, 0, 0, grid.cols, grid.rows);
        var imageData = ctx.getImageData(0, 0, grid.cols, grid.rows);
        setPreview(convert({ width: grid.cols, height: grid.rows, data: imageData.data }, {
          ramp: RAMPS[settings.ramp] || RAMPS.standard,
          contrast: settings.contrast,
          brightness: settings.brightness,
          invert: settings.invert,
        }));
      }, [loadedImage, settings]);

      react.useEffect(function () {
        var onPaste = function (event) {
          var items = event.clipboardData && event.clipboardData.items;
          if (!items) return;
          for (var i = 0; i < items.length; i += 1) {
            var item = items[i];
            if (item.kind === 'file' && item.type.indexOf('image/') === 0) {
              var file = item.getAsFile();
              if (file) { importFile(file); return; }
            }
          }
        };
        document.addEventListener('paste', onPaste);
        return function () { document.removeEventListener('paste', onPaste); };
      }, []);

      react.useEffect(function () {
        var onKeyDown = function (event) {
          if (event.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKeyDown);
        return function () { document.removeEventListener('keydown', onKeyDown); };
      }, [onClose]);

      var copy = function () {
        if (!result) return;
        navigator.clipboard.writeText(result.text).then(function () {
          setStatus({ copied: true });
          if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
          statusTimerRef.current = setTimeout(function () { setStatus(null); }, 1600);
        }, function () {
          setStatus({ error: t('import.error') });
        });
      };

      var download = function () {
        if (!result) return;
        var blob = new Blob([result.text], { type: 'text/plain;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'ascii-art.txt';
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
      };

      var onDragOver = function (event) { event.preventDefault(); setDragActive(true); };
      var onDragLeave = function () { setDragActive(false); };
      var onDrop = function (event) {
        event.preventDefault();
        setDragActive(false);
        var files = event.dataTransfer && event.dataTransfer.files;
        if (files && files.length > 0) importFile(files[0]);
      };

      var gridLabel = result ? result.cols + ' x ' + result.rows : '';

      return jsx('div', {
        className: 'qza-overlay',
        onDragOver: onDragOver,
        onDragLeave: onDragLeave,
        onDrop: onDrop,
        children: jsx('div', {
          className: 'qza-panel',
          children: [
            jsx('div', {
              className: 'qza-header',
              children: [
                jsx('span', { className: 'qza-title' }, t('overlay.title')),
                jsx('button', { type: 'button', className: 'qza-close', onClick: onClose }, t('close')),
              ],
            }),
            jsx('div', {
              className: 'qza-body',
              children: [
                jsx('div', {
                  className: 'qza-controls',
                  children: [
                    jsx('div', {
                      className: 'qza-field',
                      children: [
                        jsx('label', { className: 'qza-label' }, t('width') + ' · ' + settings.width),
                        jsx('input', {
                          type: 'range', className: 'qza-range',
                          min: '40', max: '200', step: '10',
                          value: settings.width,
                          onChange: function (event) { patch({ width: Number(event.target.value) }); },
                        }),
                      ],
                    }),
                    jsx('div', {
                      className: 'qza-field',
                      children: [
                        jsx('label', { className: 'qza-label' }, t('contrast') + ' · ' + settings.contrast.toFixed(2)),
                        jsx('input', {
                          type: 'range', className: 'qza-range',
                          min: '20', max: '300', step: '5',
                          value: Math.round(settings.contrast * 100),
                          onChange: function (event) { patch({ contrast: Number(event.target.value) / 100 }); },
                        }),
                      ],
                    }),
                    jsx('div', {
                      className: 'qza-field',
                      children: [
                        jsx('label', { className: 'qza-label' }, t('brightness') + ' · ' + settings.brightness),
                        jsx('input', {
                          type: 'range', className: 'qza-range',
                          min: '-100', max: '100', step: '5',
                          value: settings.brightness,
                          onChange: function (event) { patch({ brightness: Number(event.target.value) }); },
                        }),
                      ],
                    }),
                    jsx('div', {
                      className: 'qza-field',
                      children: [
                        jsx('span', { className: 'qza-label' }, t('charset')),
                        jsx('div', {
                          className: 'qza-ramps',
                          children: ['standard', 'blocky', 'minimal'].map(function (key) {
                            return jsx('button', {
                              type: 'button',
                              className: 'qza-ramp',
                              'data-active': String(settings.ramp === key),
                              onClick: function () { patch({ ramp: key }); },
                            }, t('charset.' + key));
                          }),
                        }),
                      ],
                    }),
                    jsx('div', {
                      className: 'qza-toggle-row',
                      children: [
                        jsx('input', {
                          type: 'checkbox', id: 'qza-invert',
                          checked: settings.invert,
                          onChange: function (event) { patch({ invert: event.target.checked }); },
                        }),
                        jsx('label', { className: 'qza-label', htmlFor: 'qza-invert' }, t('invert')),
                      ],
                    }),
                  ],
                }),
                jsx('div', {
                  className: 'qza-stage',
                  children: [
                    result
                      ? jsx('pre', { className: 'qza-pre' }, result.text)
                      : jsx('div', {
                        className: 'qza-dropzone',
                        'data-active': String(isDragActive),
                        onClick: function () { if (fileInputRef.current) fileInputRef.current.click(); },
                        children: [
                          jsx('input', {
                            ref: fileInputRef,
                            type: 'file',
                            accept: 'image/*',
                            style: { display: 'none' },
                            onChange: function (event) {
                              var file = event.target.files && event.target.files[0];
                              if (file) importFile(file);
                            },
                          }),
                          jsx('div', {
                            className: 'qza-hint',
                            children: [t('import.choose'), ' / ', t('import.drag'), ' / ', t('import.paste')],
                          }),
                        ],
                      }),
                    jsx('div', {
                      className: 'qza-footer',
                      children: [
                        jsx('button', {
                          type: 'button',
                          className: 'qza-btn qza-btn-primary',
                          disabled: !result,
                          onClick: copy,
                        }, statusValue && statusValue.copied ? t('copied') : t('copy')),
                        jsx('button', {
                          type: 'button',
                          className: 'qza-btn',
                          disabled: !result,
                          onClick: download,
                        }, t('download')),
                        result ? jsx('span', { className: 'qza-status' }, gridLabel) : null,
                        statusValue && statusValue.error
                          ? jsx('span', { className: 'qza-status qza-error' }, statusValue.error)
                          : null,
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      });
    }

    /* ---- plugin body ---- */

    var NS = 'ascii';
    var inject = ['slots', 'locale'];

    function apply(ctx) {
      ctx.effect(function () {
        return ctx.locale.register(NS, { zh: zh, en: en });
      }, 'ascii-previewer: dictionaries');
      ctx.slots.inject('conversation.session.header.actions', function () {
        return ctx.slots.register({
          name: 'conversation.session.header.actions',
          id: 'ascii-previewer',
          order: 30,
          locale: NS,
        }, AsciiAction);
      });
    }

    exports.apply = apply;
    exports.inject = inject;
    exports.gridFor = gridFor;
    exports.convert = convert;
    exports.RAMPS = RAMPS;
    return module.exports;
  },
});
```

- [ ] **Step 2: Run the unit tests (bundle must still materialize in Node)**

Run: `node --test tests/unit/ascii-previewer.test.js`
Expected: PASS — the Task 2 tests keep passing because the CSS branch is guarded and the factory's `require` is stubbed.

- [ ] **Step 3: Syntax-check the bundle in Node with the real loader stub**

Run:
```bash
cd /Users/qizhi_dong/Projects/portfolio-blogs && node -e "
let entry = null;
globalThis.window = { __ModuleLoader__: { load: (e) => { entry = e; } } };
import('./dsh-plugins/ascii-previewer/lib/client.js').then(() => {
  const m = entry.factory((s) => ({}));
  if (typeof m.apply !== 'function' || typeof m.convert !== 'function') process.exit(1);
  if (!Array.isArray(m.inject) || m.inject.join(',') !== 'slots,locale') process.exit(1);
  console.log('bundle ok');
});
"
```
Expected: `bundle ok`

- [ ] **Step 4: Commit**

```bash
git add dsh-plugins/ascii-previewer/lib/client.js
git commit -m "feat(ascii-previewer): header action, retro overlay UI, and i18n"
```

---

### Task 4: Install into the web profile, register the row, restart, verify

**Files:**
- Modify: `~/.dsh/profiles/web/cordis.patch.yml` (append one insert row)
- Modify: `~/.dsh/profiles/web/package.json` (via `dsh plugin`, automatic)

**Interfaces:**
- Consumes: package `@qizhi/ascii-previewer` from Task 3 with `dsh.client.platform: "web"` and `exports["./client"]`.

- [ ] **Step 1: Confirm tooling is available**

Run: `which dsh && which pnpm`
Expected: both resolve to paths. If `pnpm` is missing, install it (`npm install -g pnpm`) before continuing.

- [ ] **Step 2: Install the plugin into the web profile**

Run (from the repo root so the path is absolute):
```bash
cd /Users/qizhi_dong/Projects/portfolio-blogs && dsh plugin --profile web add "$PWD/dsh-plugins/ascii-previewer"
```
Expected: pnpm output ending with the install summary; a warning "declares no dsh.bundle — installed as a plain dependency" is expected and harmless.

Verify the package resolves from the profile:
```bash
cd ~/.dsh/profiles/web && node -e "console.log(require.resolve('@qizhi/ascii-previewer/package.json'))"
```
Expected: a path ending in `node_modules/@qizhi/ascii-previewer/package.json`.

- [ ] **Step 3: Register the Loader entry in the user patch layer**

Append to `~/.dsh/profiles/web/cordis.patch.yml` (keep the existing `[]` untouched; the file becomes a two-element array):

```yaml
# User-installed client plugin: import an image and preview it as ASCII art.
- insert:
    - id: ascii-previewer
      name: '@qizhi/ascii-previewer'
```

- [ ] **Step 4: Sanity-check the patch parses**

Run:
```bash
cd ~/.dsh/profiles/web && node -e "
const fs = require('fs');
const yaml = require('@deepseek-ai/dsh/node_modules/js-yaml') || require('js-yaml');
"
```
If `js-yaml` is not resolvable from the profile, validate structurally instead:
```bash
node -e "const s = require('fs').readFileSync(process.env.HOME + '/.dsh/profiles/web/cordis.patch.yml','utf8'); if (!s.includes('ascii-previewer')) process.exit(1); console.log('patch ok')"
```
Expected: `patch ok`

- [ ] **Step 5: Restart `dsh web` (coordinated with the user)**

Client-package metadata is scanned at server boot, so the running server must be restarted for the plugin to activate. Ask the user to restart the server (the command that launched it, typically `dsh web` or `dsh --profile web` in the terminal that owns it), or — with the user's explicit go-ahead — kill the process listening on 3080 and relaunch it as a managed background job. Do NOT start a replacement server on your own.

- [ ] **Step 6: Verify the plugin is in the boot graph**

After the server is back up, run:
```bash
curl -s http://127.0.0.1:3080/ | grep -o 'ascii-previewer' | head -1
curl -s "http://127.0.0.1:3080/plugins/@qizhi/ascii-previewer/client.js" | head -c 60
```
Expected: first command prints `ascii-previewer`; second prints `window.__ModuleLoader__.load({` (bundle is served).

- [ ] **Step 7: Manual GUI verification**

In the harness GUI: open/continue a session, confirm the `ASCII` button appears in the session header, click it, and verify: overlay opens with the drop zone; import via file picker AND via drag-drop; the preview renders immediately; each control (width/contrast/brightness/invert/character set) re-renders live; Copy and Download work; Escape and the close button close the overlay.

- [ ] **Step 8: Commit any repo-side doc note**

The harness-side edits (profile patch, profile package.json) live outside this repo, so nothing new to commit here unless a README note was added; close the plan.

---

## Self-Review

- **Spec coverage:** §3 flow (button, three import paths, live controls, copy/download) → Task 3; §4 algorithm (Rec.601 luminance, contrast/brightness/invert ordering, Bourke ramp, 2:1 aspect) → Task 2 + Task 3 overlay; §5.1 bundle format → Task 2/3; §5.2 manifest → Task 1; §5.3 plugin body → Task 3; §5.4 install + roster → Task 4; §5.5 restart → Task 4 Step 5; §6 tests → Task 2 unit tests + Task 4 verification. No gaps.
- **Placeholder scan:** no TBD/TODO; every code step carries full source.
- **Type consistency:** `gridFor(sourceWidth, sourceHeight, cols, aspect?)` and `convert(imageData, options?)` signatures are identical across Task 2 (test), Task 2 (impl), and Task 3 (overlay callsite); exports named `apply`/`inject`/`gridFor`/`convert`/`RAMPS` everywhere; slot id `ascii-previewer` and `order: 30` used once, in Task 3.
