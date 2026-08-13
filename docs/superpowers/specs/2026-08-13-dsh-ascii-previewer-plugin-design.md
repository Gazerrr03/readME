# DSH Client Plugin Design: ASCII Image Previewer

- **Date**: 2026-08-13
- **Status**: Approved in conversation; written for review
- **Author**: Qizhi (with agent)

## 1. Problem

The user runs a retro-computer-styled portfolio site (Two A.M.) whose environment
background is ASCII-rendered on canvas. They want, **inside the DeepSeek Harness
Web GUI** (the surface they use every day), a way to import an image and
immediately browse a live preview of that image converted to ASCII art — in the
same visual spirit as the retro terminal.

This is a Harness client plugin, not a feature of the portfolio site.

## 2. Form factor

- Package name: `@qizhi/ascii-previewer`
- Kind: DSH **client plugin** (`dsh.client` manifest, `platform: web`), installed
  into the `web` profile under `$DSH_HOME/profiles/web`.
- Entry point: a button `ASCII` in the session header's action strip, registered
  into the `conversation.session.header.actions` slot (kind `list`, scope
  `session`) — the same row family as the existing Jobs / Subagent buttons.
- The button opens a **retro-terminal styled overlay** (portal to `document.body`
  so it is never clipped): deep navy/black background, monospace glyphs, CRT
  glow accents, echoing the portfolio's retro screen aesthetic.

## 3. User flow (all client-side; zero host round-trips)

1. Click `ASCII` in the session header → overlay opens with a dashed drop zone,
   a "Choose image" button, and the hint that ⌘V paste also works.
2. Import an image via any of: file picker, drag & drop onto the overlay, or
   clipboard paste.
3. The ASCII conversion renders **immediately** in a `<pre>` inside the overlay.
   Large images are downsampled first, so rendering stays fast.
4. Live controls re-render on every change:
   - Width (columns of characters, 40–200)
   - Contrast
   - Brightness
   - Invert toggle
   - Character set (3 ramps):
     - Paul Bourke full-density `$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\|()1{}[]?-_+~<>i!lI;:,"^`. ` — same ramp as the site's environment renderer
     - Blocky `#@%`
     - Minimal ` .:-=+*#%@`
5. Footer actions: **Copy** the ASCII text, **Download** as `.txt`, **Close**.

## 4. Conversion algorithm

- Target grid: `W` columns × `H` rows, where
  `H = round(W × (imgHeight / imgWidth) × 0.5)` (a monospace glyph is about 2:1
  tall:wide, so rows sample roughly every second pixel row).
- Downsample the source image to `W × H` on an offscreen canvas
  (`drawImage` with smoothing) and read `ImageData`.
- Per-pixel luminance: `0.299R + 0.587G + 0.114B` (Rec. 601).
- Apply, in order: brightness offset, contrast (`(v - 128) × c + 128`), invert
  (`255 - v`); clamp to 0–255.
- Map luminance to a glyph index:
  `glyph = ramp[floor(lum / 256 × ramp.length)]`, dark → dense glyph,
  light → sparse glyph — the same mapping convention as
  `scripts/environment/environment-renderer.js`.
- Rows joined with `\n`; rendered in a scrollable `<pre>` with selectable text.

## 5. Technical implementation

### 5.1 Bundle

- No build step. The client bundle is a hand-written file in the
  `window.__ModuleLoader__.load({ id, factory })` format — the same shape as the
  shipped bundles of `dsh-client-ui-plan` / `dsh-client-ui-jobs`.
- The factory requires only `react` and `react-dom` (both are loader externals,
  used by existing bundles). Components are written with `jsx`/`jsxs` from
  `react/jsx-runtime` and `createPortal` from `react-dom` — no JSX syntax, so no
  transpilation is needed.
- CSS is injected at materialization time as a `<style data-plugin=...>` tag,
  guarded by `typeof document !== "undefined"` (the shipped pattern), which also
  keeps the bundle loadable in Node for unit tests.
- The bundle additionally exports a pure `convert` function (image data → ASCII
  string, parameterized by width/ramp/contrast/brightness/invert) so the core
  math can be unit-tested in Node.

### 5.2 Package manifest

```jsonc
{
  "name": "@qizhi/ascii-previewer",
  "type": "module",
  "exports": { "./client": "./lib/client.js", "./package.json": "./package.json" },
  "dsh": { "client": { "platform": "web" } }
}
```

- The node half of `dsh-client-modules` resolves `exports["./client"]`, hashes
  the bundle, serves it at `/plugins/@qizhi/ascii-previewer/client.js`, and
  injects it into `window.__DSH_BOOT__`.

### 5.3 Plugin body (cordis client plugin)

- `exports.inject = ["slots", "locale"]` (service names).
- `apply(ctx)`:
  1. `ctx.effect(() => ctx.locale.register("ascii", { en, zh }), ...)` — plugin
     owns its dictionary namespace; follows the GUI's active language.
  2. `ctx.slots.inject("conversation.session.header.actions", () =>
     ctx.slots.register({ name, id: "ascii-previewer", order: 30, locale: "ascii" },
     AsciiAction))` — same pattern as `dsh-client-ui-jobs`.
- The slot component receives the standard session kit (`sessionId`, `t`, …);
  the overlay is rendered via `createPortal(..., document.body)`.

### 5.4 Source location

- Sources live in the portfolio repo under `dsh-plugins/ascii-previewer/`
  (package.json, lib/client.js, README.md) so the user owns and versions them.
- Install: `dsh plugin --profile web add /abs/path/dsh-plugins/ascii-previewer`
  (official pnpm forwarder; the package lands as a profile dependency).
- Roster: add one row to the user layer `~/.dsh/profiles/web/cordis.patch.yml`:

  ```yaml
  - insert:
      - id: ascii-previewer
        name: '@qizhi/ascii-previewer'
  ```

### 5.5 Activation

- Client-package metadata is scanned at server boot and cached; **a new plugin
  takes effect only after restarting `dsh web`**. The restart is coordinated
  with the user (the running server hosts the session they are viewing).
- No change to the web-app bundle or any shipped patch is needed; the user
  profile layer is the only harness-side edit.

## 6. Testing

- **Node unit test** (`tests/unit/ascii-previewer.test.js`): load
  `lib/client.js` with a stubbed `window.__ModuleLoader__` and a `require` stub
  for `react`/`react-dom`, then assert `convert`:
  - luminance boundary mapping (black → densest glyph, white → sparsest),
  - invert flips the mapping,
  - width/height ratio math (`H = round(W × ratio × 0.5)`),
  - row count and column width of the produced string.
- **Smoke check**: after restart, `curl` the GUI index and confirm
  `window.__DSH_BOOT__` contains the plugin id; then manual check in the GUI:
  button visible in a session header, overlay opens, import + live preview +
  copy/download work.

## 7. Non-goals (YAGNI)

- No sending the ASCII art into the conversation (future idea).
- No server-side conversion, no image persistence, no gallery/history.
- No conversion of animated GIFs (first frame only).
