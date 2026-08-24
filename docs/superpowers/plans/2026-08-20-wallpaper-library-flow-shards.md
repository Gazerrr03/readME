# Wallpaper Library and Flow Shards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a selectable wallpaper library to Photos, a model-free Three.js/GPGPU Flow Shards wallpaper, and an unlinked `/setting/` author lab with plain-language controls and local JSON export.

**Architecture:** A static wallpaper registry exposes metadata, normalized defaults, control schemas, and lazy renderer factories. A stable desktop wallpaper manager owns exactly one active renderer and swaps candidates transactionally, while Photos consumes metadata only and `/setting/` reuses the same renderer/configuration code. Existing `blue-fluid-halftone` remains the default raw-WebGL renderer; Three.js loads only for Flow Shards.

**Tech Stack:** Vanilla ES modules, Node `node:test`, Playwright, raw WebGL2, vendored Three.js (`vendor/three.module.min.js`), CSS, GitHub Pages-compatible static routes.

**Spec:** `docs/superpowers/specs/2026-08-20-wallpaper-library-flow-shards-design.md`

## Global Constraints

- Keep `blue-fluid-halftone` as the official default and do not rewrite its existing shader.
- Do not load `.glb`, `.gltf`, `.obj`, `.fbx`, a CDN, or any external 3D model; the repeated visible geometry is one procedural `BoxGeometry`.
- Dynamically import vendored Three.js only when `flow-shards` is selected or previewed.
- Photos must preserve the existing four-photo behavior and must use static wallpaper previews rather than card-level WebGL canvases.
- Wallpaper application is two-step: open a wallpaper detail, then press the apply button.
- `/setting/` is a real static route, is absent from public navigation/app registration, and includes `noindex,nofollow`; it is not authentication.
- `/setting/` drafts, explicit local-homepage overrides, and official committed defaults remain separate.
- The first implementation targets desktop visuals. Existing reduced-motion, page-hidden, tablet/phone static, fallback, and cleanup behavior must not regress.
- Visible and depth materials must consume the same deformation GLSL so the cast shadow follows the moving/stretched instances.
- Use a default `96 × 96` simulation, quality tiers `64 × 64`, `96 × 96`, `128 × 128`, and a Flow renderer DPR cap of `1.5`.
- At most one desktop wallpaper renderer and one author-lab preview renderer may run in their respective pages.
- Use TDD for behavioral code: add one focused failing test, observe the expected failure, implement the minimum behavior, then rerun the focused and related suites.

---

### Task 1: Wallpaper Registry, Semantic Configuration, Storage, and Preferences

**Files:**

- Create: `scripts/environment/background/wallpaper-registry.js`
- Create: `scripts/environment/background/wallpaper-storage.js`
- Create: `scripts/environment/background/wallpapers/flow-shards/config.js`
- Modify: `scripts/environment/background/background-assets.js`
- Modify: `scripts/state/preferences.js`
- Create: `tests/unit/wallpaper-registry.test.js`
- Create: `tests/unit/wallpaper-storage.test.js`
- Create: `tests/unit/flow-shards-config.test.js`
- Modify: `tests/unit/preferences.test.js`

**Interfaces:**

- Produces: `DEFAULT_WALLPAPER_ID`, `getWallpaperDescriptor(id)`, `isWallpaperId(id)`, `listWallpaperMetadata()`.
- Produces: `FLOW_SHARDS_DEFAULT_CONFIG`, `FLOW_SHARDS_CONTROLS`, `FLOW_SHARDS_PRESETS`, `normalizeFlowShardsConfig(input)`, `mapFlowShardsConfig(input)`, `matchFlowShardsPreset(input)`.
- Produces: `normalizeWallpaperConfig(id, input)`, `serializeWallpaperConfig(id, input)`.
- Produces: `loadWallpaperDraft(storage, id)`, `saveWallpaperDraft(storage, id, config)`, `loadWallpaperPreview(storage, id)`, `saveWallpaperPreview(storage, id, config)`.
- Updates: `DEFAULT_PREFERENCES.wallpaperId` and version-1 validation.

- [ ] **Step 1: Write failing registry and preference tests**

Add literal behavior assertions:

```js
test('registry exposes two unique static metadata records without renderer factories', () => {
  const metadata = listWallpaperMetadata();
  assert.deepEqual(metadata.map(({ id }) => id), ['blue-fluid-halftone', 'flow-shards']);
  assert.equal(new Set(metadata.map(({ id }) => id)).size, metadata.length);
  assert.equal(metadata.some((entry) => 'loadRenderer' in entry), false);
  assert.equal(getWallpaperDescriptor('missing'), null);
});

test('preferences preserve known wallpaper ids and repair unknown ids', () => {
  assert.equal(loadPreferences(memoryStorage(JSON.stringify({
    ...DEFAULT_PREFERENCES,
    wallpaperId: 'flow-shards',
  }))).wallpaperId, 'flow-shards');
  assert.equal(loadPreferences(memoryStorage(JSON.stringify({
    ...DEFAULT_PREFERENCES,
    wallpaperId: 'unknown',
  }))).wallpaperId, 'blue-fluid-halftone');
});
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run:

```bash
node --test tests/unit/wallpaper-registry.test.js tests/unit/preferences.test.js
```

Expected: FAIL because `wallpaper-registry.js` and `wallpaperId` validation do not exist.

- [ ] **Step 3: Add the registry and backward-compatible background export**

Use a frozen descriptor list. `listWallpaperMetadata()` must explicitly project safe fields rather than spreading the descriptor:

```js
export const DEFAULT_WALLPAPER_ID = 'blue-fluid-halftone';

const descriptors = Object.freeze([
  Object.freeze({
    id: DEFAULT_WALLPAPER_ID,
    kind: 'shader',
    title: Object.freeze({ en: 'Blue Fluid', 'zh-CN': '蓝色流体', ja: 'ブルーフルイド' }),
    description: Object.freeze({
      en: 'A quiet blue halftone current.',
      'zh-CN': '安静流动的蓝色半色调背景。',
      ja: '静かに流れる青いハーフトーン背景。',
    }),
    previewSrc: 'assets/background/previews/blue-fluid-halftone.png',
    defaultConfig: Object.freeze({}),
    controls: Object.freeze([]),
    loadRenderer: () => import('./shader-background.js'),
  }),
  Object.freeze({
    id: 'flow-shards',
    kind: 'three',
    title: Object.freeze({ en: 'Flow Shards', 'zh-CN': '流动晶片', ja: 'フローシャード' }),
    description: Object.freeze({
      en: 'Thousands of illuminated shards following a procedural flow field.',
      'zh-CN': '数千枚发光晶片沿程序化流场穿行。',
      ja: '数千の光るシャードがプロシージャルな流れを進みます。',
    }),
    previewSrc: 'assets/background/previews/flow-shards.png',
    defaultConfig: FLOW_SHARDS_DEFAULT_CONFIG,
    controls: FLOW_SHARDS_CONTROLS,
    loadRenderer: () => import('./wallpapers/flow-shards/index.js'),
  }),
]);
```

Make `background-assets.js` import `getWallpaperDescriptor(DEFAULT_WALLPAPER_ID)` and continue exporting it as `DESKTOP_BACKGROUND`, so existing imports survive until Task 2.

- [ ] **Step 4: Add the failing semantic-config tests**

Cover repair, stable output, presets, and physical range mapping with hand-derived values:

```js
test('flow config repairs unknown, malformed, and out-of-range values', () => {
  assert.deepEqual(normalizeFlowShardsConfig({
    density: 'huge', speed: -5, glow: 140,
    backgroundColor: 'navy', shardColor: '#abcdef', ignored: true,
  }), {
    ...FLOW_SHARDS_DEFAULT_CONFIG,
    speed: 0,
    glow: 100,
    shardColor: '#ABCDEF',
  });
});

test('density tiers and semantic endpoints map to bounded renderer values', () => {
  assert.equal(mapFlowShardsConfig({ density: 'low' }).simulationSize, 64);
  assert.equal(mapFlowShardsConfig({ density: 'medium' }).simulationSize, 96);
  assert.equal(mapFlowShardsConfig({ density: 'high' }).simulationSize, 128);
  assert.equal(mapFlowShardsConfig({ speed: 0 }).timeScale, 0.12);
  assert.equal(mapFlowShardsConfig({ speed: 100 }).timeScale, 1.15);
});

test('wallpaper export is deterministic and excludes unknown fields', () => {
  const first = serializeWallpaperConfig('flow-shards', { speed: 42, ignored: true });
  const second = serializeWallpaperConfig('flow-shards', { ignored: false, speed: 42 });
  assert.equal(first, second);
  assert.deepEqual(JSON.parse(first), {
    schemaVersion: 1,
    wallpaperId: 'flow-shards',
    config: normalizeFlowShardsConfig({ speed: 42 }),
  });
});
```

- [ ] **Step 5: Run the config tests and verify RED**

Run:

```bash
node --test tests/unit/flow-shards-config.test.js tests/unit/wallpaper-registry.test.js
```

Expected: FAIL because the config exports are missing.

- [ ] **Step 6: Implement the 12-control semantic configuration**

Use this exact normalized key order and defaults:

```js
export const FLOW_SHARDS_DEFAULT_CONFIG = Object.freeze({
  density: 'medium',
  speed: 42,
  vortexSize: 58,
  turbulence: 62,
  motionRange: 55,
  shardSize: 46,
  trailLength: 62,
  glow: 58,
  shadow: 56,
  fog: 44,
  backgroundColor: '#0B1D32',
  shardColor: '#C9E8FF',
});
```

Define `calm`, `reference`, and `intense` presets. `reference` equals the defaults; `calm` uses `low/24/72/35/42/42/38/28/45/58`; `intense` uses `high/68/40/82/70/50/78/78/65/30`; both presets retain the two default colors. Normalize each number to an integer in `0..100`, accept only the three density strings, uppercase valid six-digit hex colors, discard unknown fields, and return a new object.

Map normalized values using linear interpolation with these endpoints:

```js
{
  simulationSize: { low: 64, medium: 96, high: 128 }[config.density],
  timeScale: lerp(0.12, 1.15, config.speed / 100),
  noiseScale: lerp(1.6, 0.28, config.vortexSize / 100),
  curlStrength: lerp(0.15, 1.8, config.turbulence / 100),
  lifeSeconds: lerp(4, 14, config.motionRange / 100),
  spawnRadius: lerp(1.6, 5.5, config.motionRange / 100),
  baseSize: lerp(0.035, 0.18, config.shardSize / 100),
  stretch: lerp(0.2, 3.8, config.trailLength / 100),
  bloomStrength: lerp(0, 1.35, config.glow / 100),
  bloomThreshold: lerp(1.05, 0.48, config.glow / 100),
  shadowOpacity: lerp(0, 0.62, config.shadow / 100),
  fogAmount: config.fog / 100,
}
```

Build `FLOW_SHARDS_CONTROLS` in the same order as the config: one density select, nine labeled ranges, then two color inputs. Labels/descriptions/endpoints must be localized objects for `en`, `zh-CN`, and `ja`. Presets are separate buttons and do not add a thirteenth stored field.

- [ ] **Step 7: Add failing storage tests**

Use in-memory storage to prove draft/preview separation and corrupted-data recovery:

```js
test('draft and applied preview are separate normalized records', () => {
  const storage = memoryStorage();
  saveWallpaperDraft(storage, 'flow-shards', { speed: 77 });
  assert.equal(loadWallpaperDraft(storage, 'flow-shards').speed, 77);
  assert.equal(loadWallpaperPreview(storage, 'flow-shards'), null);
  saveWallpaperPreview(storage, 'flow-shards', { speed: 31 });
  assert.equal(loadWallpaperDraft(storage, 'flow-shards').speed, 77);
  assert.equal(loadWallpaperPreview(storage, 'flow-shards').speed, 31);
});
```

- [ ] **Step 8: Run storage tests and verify RED**

Run:

```bash
node --test tests/unit/wallpaper-storage.test.js
```

Expected: FAIL because `wallpaper-storage.js` does not exist.

- [ ] **Step 9: Implement defensive local storage envelopes**

Use exact keys `portfolio-os:wallpaper-lab:v1` and `portfolio-os:wallpaper-preview:v1`. The draft envelope is `{ version: 1, drafts: { [id]: config } }`; the preview envelope is `{ version: 1, wallpaperId, config }`. Catch storage access and JSON errors. Return `null` for a missing/mismatched preview. Normalize before saving and again after loading.

- [ ] **Step 10: Verify Task 1 and commit**

Run:

```bash
npm run test:unit
git diff --check
```

Expected: all unit tests pass and `git diff --check` prints nothing.

Commit:

```bash
git add scripts/environment/background scripts/state/preferences.js tests/unit
git commit -m "feat(wallpaper): add registry and semantic configuration"
```

---

### Task 2: Transactional Wallpaper Manager and Desktop Integration

**Files:**

- Create: `scripts/environment/background/wallpaper-manager.js`
- Modify: `scripts/environment/background/shader-background.js`
- Modify: `scripts/environment/background/background-controller.js`
- Modify: `scripts/environment/environment-controller.js`
- Modify: `scripts/main.js`
- Modify: `styles/environment.css`
- Create: `tests/unit/wallpaper-manager.test.js`
- Modify: `tests/unit/background-controller.test.js`
- Modify: `tests/e2e/environment.spec.js`
- Modify: `tests/e2e/ui-kit.spec.js`

**Interfaces:**

- Consumes: Task 1 registry, config, preview storage, and `preferences.wallpaperId`.
- Produces: `createWallpaperManager({ document, initialId, storage, transitionMs, registry })`.
- Manager returns: `{ element, ready, currentId, applyWallpaper(id, options), updateConfig(config), setMotionState(state), destroy() }`.
- Renderer modules export: `createWallpaperRenderer({ document, descriptor, config, onError })` and return the common renderer contract.
- Environment controller adds: `applyWallpaper(id)` and `updateWallpaperConfig(config)`.

- [ ] **Step 1: Write failing manager lifecycle tests**

Create focused fake renderers with real elements and controllable `ready` promises. Assert user-visible state, not mock call existence:

```js
test('candidate becomes active only after ready and then destroys the old renderer', async () => {
  const harness = createManagerHarness({ transitionMs: 0 });
  await harness.manager.ready;
  const oldElement = harness.manager.element.querySelector('[data-wallpaper-surface]');
  const pending = harness.manager.applyWallpaper('flow-shards');
  assert.equal(harness.manager.currentId, 'blue-fluid-halftone');
  harness.resolveFlow();
  assert.deepEqual(await pending, { ok: true, id: 'flow-shards' });
  assert.equal(harness.manager.currentId, 'flow-shards');
  assert.equal(oldElement.dataset.destroyed, 'true');
});

test('failed and stale candidates never replace the current wallpaper', async () => {
  const harness = createManagerHarness({ transitionMs: 0 });
  await harness.manager.ready;
  const failed = harness.manager.applyWallpaper('flow-shards');
  harness.rejectFlow(new Error('shader compile failed'));
  assert.equal((await failed).ok, false);
  assert.equal(harness.manager.currentId, 'blue-fluid-halftone');
  assert.equal(harness.manager.element.querySelectorAll('[data-wallpaper-active="true"]').length, 1);
});
```

Also cover motion propagation, rapid A→B→A cancellation, local preview config precedence, `updateConfig`, and destroying pending/active resources.

- [ ] **Step 2: Run manager tests and verify RED**

Run:

```bash
node --test tests/unit/wallpaper-manager.test.js
```

Expected: FAIL because the manager module does not exist.

- [ ] **Step 3: Implement the stable host and candidate transaction**

Create a `div` host with:

```html
<div
  data-environment-background
  data-background-id="blue-fluid-halftone"
  data-background-kind="shader"
  data-wallpaper-state="loading"
  aria-hidden="true">
</div>
```

Manager rules:

1. Resolve known descriptor and normalized config; use a matching local preview override before the descriptor default.
2. Dynamically import the renderer module and call `createWallpaperRenderer`.
3. Append the candidate with `data-wallpaper-active="false"` and opacity 0; forward the latest motion state immediately.
4. Await `renderer.ready`; reject malformed renderers.
5. Ignore/destroy candidates whose request token is no longer current.
6. Activate the latest candidate, update host datasets, crossfade for `transitionMs` (`0` under reduced motion/tests), then destroy the old renderer.
7. Return `{ ok: false, id, error }` without throwing to UI callers on an apply failure.
8. On initial non-default failure, try `blue-fluid-halftone`; on default failure retain a CSS-only host and set `data-wallpaper-fallback="renderer-unavailable"`.
9. Pass `onError`; an active runtime error triggers the same fallback path once, without an infinite default-retry loop.

Do not persist preferences inside the manager. Persistence belongs to the successful caller in `main.js` or `/setting/`.

- [ ] **Step 4: Adapt the existing blue shader without rewriting it**

Export this thin alias from `shader-background.js`:

```js
export function createWallpaperRenderer({ document, descriptor }) {
  return createShaderBackground({ document, asset: descriptor });
}
```

Its existing Canvas becomes the inner `[data-wallpaper-surface]`. Preserve all shader source, motion, fallback, resize, and destroy behavior.

- [ ] **Step 5: Run manager tests and verify GREEN**

Run:

```bash
node --test tests/unit/wallpaper-manager.test.js tests/unit/shader-background.test.js
```

Expected: all focused tests pass.

- [ ] **Step 6: Write failing desktop-integration tests**

Update the background test to expect a stable `DIV` host and one inner surface. Update Playwright assertions so `[data-environment-background]` retains the existing ID/kind/opacity semantics while its child Canvas owns renderer dimensions:

```js
await expect(background).toHaveAttribute('data-background-id', 'blue-fluid-halftone');
await expect(background.locator('[data-wallpaper-surface]')).toHaveCount(1);
await expect.poll(() => background.locator('[data-wallpaper-surface]').evaluate((node) => (
  node.tagName === 'CANVAS' && node.width > 0 && node.height > 0
))).toBe(true);
```

Add a browser-level controller test that calls `controller.applyWallpaper('missing')` and observes `{ ok: false }` while semantic widgets remain mounted.

- [ ] **Step 7: Run integration tests and verify RED**

Run:

```bash
node --test tests/unit/background-controller.test.js
npx playwright test tests/e2e/environment.spec.js tests/e2e/ui-kit.spec.js
```

Expected: FAIL because the old controller still exposes a Canvas directly and has no apply API.

- [ ] **Step 8: Connect manager, environment, preferences, and CSS**

Make `createDesktopBackground()` return the manager. Pass `initialWallpaperId`, storage, and optional registry through `createDesktopEnvironmentController`; expose delegated `applyWallpaper` and `updateWallpaperConfig` methods even when the environment is temporarily unmounted (return a non-throwing failure in that case).

In `main.js`, initialize the environment with `preferences.wallpaperId` and define:

```js
const applyWallpaper = async (id) => {
  const result = await environment.applyWallpaper(id);
  if (result.ok) updatePreferences({ wallpaperId: result.id });
  return result;
};
```

Keep this function ready for Task 4 Photos injection. Update environment CSS so the host clips absolute surfaces, inner surfaces fill the host, candidates transition opacity, and focused opacity remains on the host.

- [ ] **Step 9: Verify Task 2 and commit**

Run:

```bash
npm run test:unit
npx playwright test tests/e2e/environment.spec.js tests/e2e/ui-kit.spec.js
git diff --check
```

Expected: all commands pass.

Commit:

```bash
git add scripts/environment scripts/main.js styles/environment.css tests/unit tests/e2e/environment.spec.js tests/e2e/ui-kit.spec.js
git commit -m "feat(wallpaper): add transactional desktop switching"
```

---

### Task 3: Flow Shards Three.js/GPGPU Renderer

**Files:**

- Create: `scripts/environment/background/wallpapers/flow-shards/shaders.js`
- Create: `scripts/environment/background/wallpapers/flow-shards/simulation.js`
- Create: `scripts/environment/background/wallpapers/flow-shards/materials.js`
- Create: `scripts/environment/background/wallpapers/flow-shards/bloom.js`
- Create: `scripts/environment/background/wallpapers/flow-shards/index.js`
- Create: `tests/unit/flow-shards-state.test.js`
- Create: `tests/e2e/flow-shards.spec.js`

**Interfaces:**

- Consumes: Task 1 normalized/mapped Flow config and Task 2 renderer contract.
- Produces: `createWallpaperRenderer({ document, descriptor, config, onError })`.
- Produces pure helpers: `createOriginState(size, seed)`, `stateUvForIndex(index, size)`, `safeDirection(current, previous)` for unit tests and renderer setup.
- Internal factories: `createFlowSimulation`, `createShardMaterials`, `createBloomPipeline`.

- [ ] **Step 1: Write failing deterministic-state tests**

```js
test('origin state is deterministic and encodes xyz plus life for every instance', () => {
  const first = createOriginState(2, 882);
  const second = createOriginState(2, 882);
  assert.equal(first.length, 16);
  assert.deepEqual([...first], [...second]);
  for (let index = 3; index < first.length; index += 4) {
    assert.ok(first[index] >= 0 && first[index] <= 1);
  }
});

test('state UVs point to texel centers and zero velocity has a finite fallback', () => {
  assert.deepEqual(stateUvForIndex(0, 2), [0.25, 0.25]);
  assert.deepEqual(stateUvForIndex(3, 2), [0.75, 0.75]);
  assert.deepEqual(safeDirection([1, 1, 1], [1, 1, 1]), [0, 1, 0]);
});
```

- [ ] **Step 2: Run state tests and verify RED**

Run:

```bash
node --test tests/unit/flow-shards-state.test.js
```

Expected: FAIL because simulation helpers do not exist.

- [ ] **Step 3: Implement deterministic origin/state helpers**

Use a small seeded integer PRNG local to `simulation.js`; never use `Math.random()` for origin state. Each RGBA texel stores world-space origin XYZ and a normalized life offset. `stateUvForIndex()` returns texel centers. `safeDirection()` normalizes `current - previous` and returns `[0, 1, 0]` below epsilon `1e-5`.

- [ ] **Step 4: Write the failing browser renderer test**

Seed preferences with `wallpaperId: 'flow-shards'`, open the desktop, and require a real Three.js surface rather than accepting fallback:

```js
test('Flow Shards initializes one live Three.js surface without model requests', async ({ page }) => {
  const modelRequests = [];
  page.on('request', (request) => {
    if (/\.(glb|gltf|obj|fbx)(\?|$)/i.test(request.url())) modelRequests.push(request.url());
  });
  await seedFlowShards(page);
  await page.goto('/');
  const host = page.locator('[data-environment-background]');
  await expect(host).toHaveAttribute('data-background-id', 'flow-shards');
  const surface = host.locator('[data-wallpaper-renderer="three-webgl2"]');
  await expect(surface).toHaveCount(1);
  await expect(surface).toHaveAttribute('data-simulation-size', '96');
  await expect.poll(() => surface.getAttribute('data-wallpaper-frame').then(Number)).toBeGreaterThan(1);
  expect(modelRequests).toEqual([]);
});
```

Add a second test that opens a window and verifies `data-background-motion="focused"`, then hides/reveals the page through the controller-facing state hook and confirms the frame counter stops/resumes.

- [ ] **Step 5: Run the browser test and verify RED**

Run:

```bash
npx playwright test tests/e2e/flow-shards.spec.js
```

Expected: FAIL because the lazy Flow renderer module is missing.

- [ ] **Step 6: Implement capability detection and ping-pong simulation**

In `index.js`, dynamically import `../../../../../vendor/three.module.min.js`. Create `WebGLRenderer` with alpha disabled, antialias disabled, a DPR cap of `1.5`, and shadows enabled. Require WebGL2, vertex texture units, `EXT_color_buffer_float`, and a complete float render target; throw a descriptive initialization error so the manager can fall back.

In `simulation.js`:

- Create a float `DataTexture` from deterministic origins.
- Create two nearest-filtered RGBA float `WebGLRenderTarget`s without depth/stencil.
- Render the simulation with a fullscreen triangle and orthographic camera.
- Initially read origin; after every step expose `{ currentTexture, previousTexture }`, then alternate the write target.
- Store position in RGB and life in A. Increase life by `delta / lifeSeconds`; respawn from origin when life wraps.
- Use a simplex-noise-derived curl-like field controlled by `timeScale`, `noiseScale`, `curlStrength`, and `spawnRadius`.
- Clamp frame delta to `1 / 20` second to avoid explosive jumps after stalls.

Export `resize` only where resources depend on viewport size; the state texture itself depends on density, not viewport.

- [ ] **Step 7: Implement instanced geometry and shared beauty/depth deformation**

Create one source `BoxGeometry`, copy its attributes/index into `InstancedBufferGeometry`, set `instanceCount = size * size`, and add `aStateUv` plus one deterministic random scalar per instance.

`shaders.js` must export one shared GLSL chunk that:

1. Samples current and previous state textures.
2. Computes a safe velocity direction with a stable up-vector fallback.
3. Builds an orthonormal basis.
4. Applies base size, speed-limited axial stretch, world translation, and life easing.
5. Exposes the same deformed position to both materials.

Patch a `MeshStandardMaterial` vertex shader at `#include <beginnormal_vertex>` and `#include <begin_vertex>`; transform the normal with the same basis. Patch a `MeshDepthMaterial` with the exact same chunk at `#include <begin_vertex>`. Assign it as `mesh.customDepthMaterial`. Add one shadow-casting directional light, low ambient light, and a procedural plane receiver; BoxGeometry remains the only repeated modeled object.

- [ ] **Step 8: Implement the internal three-level bloom pipeline**

In `bloom.js`, render the lit scene into a full-size target, extract pixels above `bloomThreshold`, blur three half-resolution/downsampled levels horizontally and vertically, and composite them with the original using `bloomStrength`. Reuse targets each frame, skip threshold/blur when strength is zero, and resize/dispose every target explicitly.

- [ ] **Step 9: Implement renderer lifecycle and live config updates**

The returned Canvas must set:

```js
canvas.dataset.wallpaperSurface = '';
canvas.dataset.wallpaperRenderer = 'three-webgl2';
canvas.dataset.simulationSize = String(mapped.simulationSize);
canvas.dataset.wallpaperFrame = '0';
```

Behavior:

- Resolve `ready` after the first successful composite frame.
- `running`: full delta; `focused`: multiply simulation delta by `0.25` and bloom strength by `0.55`; `static`: draw one stable frame and stop RAF.
- Pause RAF while `document.hidden`; resume without catching up elapsed time.
- Update uniforms in place for ordinary config changes.
- On density change, build replacement simulation/geometry/material resources, render one valid frame, swap, and dispose the old set.
- On `webglcontextlost`, prevent default, stop RAF, mark the Canvas, and call `onError` once; do not attempt to render invalid resources.
- `destroy()` cancels RAF, removes listeners, and disposes Box/plane/fullscreen geometry, materials, DataTexture, state targets, shadow resources, bloom targets, and renderer.

- [ ] **Step 10: Verify Task 3 and commit**

Run:

```bash
node --test tests/unit/flow-shards-config.test.js tests/unit/flow-shards-state.test.js
npx playwright test tests/e2e/flow-shards.spec.js tests/e2e/environment.spec.js
git diff --check
```

Expected: all commands pass without shader compilation warnings in browser console.

Commit:

```bash
git add scripts/environment/background/wallpapers/flow-shards tests/unit/flow-shards-state.test.js tests/e2e/flow-shards.spec.js
git commit -m "feat(wallpaper): add Flow Shards GPU pipeline"
```

---

### Task 4: Photos Wallpaper Library and Two-Step Application

**Files:**

- Create: `modules/interactive-buttons/photos/wallpapers-view.js`
- Modify: `modules/interactive-buttons/photos/photos-app.js`
- Modify: `scripts/main.js`
- Modify: `scripts/i18n/dictionaries.js`
- Modify: `styles/apps.css`
- Create: `tests/e2e/wallpapers.spec.js`
- Modify: `tests/e2e/folders.spec.js`

**Interfaces:**

- Consumes: `listWallpaperMetadata()`, the mutable preferences object, and Task 2 `applyWallpaper(id)`.
- Produces: `createWallpapersView({ document, i18n, wallpapers, currentId, applyWallpaper })`.
- `renderPhotosApp` gains optional `wallpapers`, `getCurrentWallpaperId`, and `applyWallpaper` dependencies for behavior tests and main integration.

- [ ] **Step 1: Write the failing Photos regression and wallpaper-flow tests**

Keep the existing photo test and add explicit tab behavior:

```js
test('Photos preserves four photos and applies a wallpaper through a static two-step preview', async ({ page }) => {
  await seedLayout(page, 'macos');
  await page.goto('/');
  await page.locator('[data-folder-toggle="photos"]').click();
  const window = page.locator('[data-app-window="photos"]');
  await expect(window.locator('[data-photos-tab="photos"]')).toHaveAttribute('aria-selected', 'true');
  await expect(window.locator('[data-folder-item]')).toHaveCount(4);
  await window.locator('[data-photos-tab="wallpapers"]').click();
  await expect(window.locator('[data-wallpaper-card]')).toHaveCount(2);
  await expect(window.locator('canvas')).toHaveCount(0);
  await window.locator('[data-wallpaper-card="flow-shards"]').click();
  await expect(window.locator('[data-wallpaper-detail="flow-shards"]')).toBeVisible();
  await window.locator('[data-wallpaper-apply]').click();
  await expect(page.locator('[data-environment-background]')).toHaveAttribute('data-background-id', 'flow-shards');
  await expect.poll(() => page.evaluate(() => (
    JSON.parse(localStorage.getItem('portfolio-os:preferences')).wallpaperId
  ))).toBe('flow-shards');
});
```

Add a refresh assertion and a keyboard `Enter` path. In `folders.spec.js`, keep the original viewer assertions and verify switching tabs away/back preserves the selected photo.

- [ ] **Step 2: Run the Photos tests and verify RED**

Run:

```bash
npx playwright test tests/e2e/folders.spec.js tests/e2e/wallpapers.spec.js
```

Expected: FAIL because the two tabs and wallpaper view do not exist.

- [ ] **Step 3: Build the tab shell without changing the existing photo browser**

Wrap the current `createFolderBrowser` result in a Photos shell with a `tablist`. Create the photo browser once, retain it while hidden, and keep the module-level photo selection behavior intact. Tabs use buttons with `role="tab"`, `aria-selected`, and `aria-controls`; panels use `role="tabpanel"` and `hidden`.

Use these data contracts:

```text
data-photos-tab="photos|wallpapers"
data-photos-panel="photos|wallpapers"
data-wallpaper-card="<id>"
data-wallpaper-detail="<id>"
data-wallpaper-current="true|false"
data-wallpaper-apply
data-wallpaper-apply-status="idle|applying|success|error"
```

- [ ] **Step 4: Build the static wallpaper grid/detail state**

Cards contain an `<img>` using `previewSrc`, localized title, and current badge. A single click or `Enter` opens the detail panel immediately; do not reuse the Photos double-click policy. Detail uses the same static image and renders the apply button. During application disable the button, set an `aria-live="polite"` status, await `applyWallpaper(id)`, then update the local current ID only on `{ ok: true }`. On failure keep the old badge and show a localized error.

- [ ] **Step 5: Wire main, localization, and styles**

In `main.js`, wrap the Photos renderer and inject Task 2's `applyWallpaper`, `() => preferences.wallpaperId`, and `listWallpaperMetadata()`. Add all tab, current/applying/success/error, description, and back labels to all three dictionaries.

Style the tab bar and cards within the existing OS visual language. Use fixed-aspect static previews, visible focus outlines, a scrollable detail on short desktop windows, and no nested WebGL surfaces.

- [ ] **Step 6: Verify Task 4 and commit**

Run:

```bash
npx playwright test tests/e2e/folders.spec.js tests/e2e/wallpapers.spec.js tests/e2e/apps.spec.js
npm run test:unit
git diff --check
```

Expected: all commands pass.

Commit:

```bash
git add modules/interactive-buttons/photos scripts/main.js scripts/i18n/dictionaries.js styles/apps.css tests/e2e
git commit -m "feat(photos): add selectable wallpaper library"
```

---

### Task 5: Unlinked `/setting/` Author Lab

**Files:**

- Create: `setting/index.html`
- Create: `setting/setting.js`
- Create: `setting/setting.css`
- Create: `tests/e2e/wallpaper-setting.spec.js`
- Modify: `tests/e2e/content-pages.spec.js`

**Interfaces:**

- Consumes: registry descriptor/control schema, config normalizer/presets/serializer, draft/preview storage, preferences load/save, and wallpaper manager.
- Produces no public navigation entry.

- [ ] **Step 1: Write the failing route, persistence, and export tests**

```js
test('author lab loads Flow Shards, autosaves a draft, and applies only on command', async ({ page }) => {
  await page.goto('/setting/?wallpaper=flow-shards');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,nofollow');
  await expect(page.locator('[data-wallpaper-lab]')).toHaveAttribute('data-wallpaper-id', 'flow-shards');
  await expect(page.locator('[data-wallpaper-control]')).toHaveCount(12);
  await page.locator('[data-wallpaper-control="speed"]').fill('77');
  await expect.poll(() => page.evaluate(() => (
    JSON.parse(localStorage.getItem('portfolio-os:wallpaper-lab:v1')).drafts['flow-shards'].speed
  ))).toBe(77);
  expect(await page.evaluate(() => localStorage.getItem('portfolio-os:wallpaper-preview:v1'))).toBeNull();
  await page.locator('[data-wallpaper-apply-local]').click();
  await expect.poll(() => page.evaluate(() => (
    JSON.parse(localStorage.getItem('portfolio-os:wallpaper-preview:v1')).config.speed
  ))).toBe(77);
});

test('downloaded JSON is normalized and deterministic', async ({ page }) => {
  await page.goto('/setting/?wallpaper=flow-shards');
  const downloadPromise = page.waitForEvent('download');
  await page.locator('[data-wallpaper-download]').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('flow-shards.config.json');
});
```

Also test unknown query fallback/warning, reset-to-default without homepage mutation, draft reload, preset-to-custom transition, and absence of `/setting/` links from `/` and generated content pages.

- [ ] **Step 2: Run the route tests and verify RED**

Run:

```bash
npx playwright test tests/e2e/wallpaper-setting.spec.js tests/e2e/content-pages.spec.js
```

Expected: FAIL with 404/missing lab selectors.

- [ ] **Step 3: Create the static route and preview shell**

`setting/index.html` must include viewport metadata, `noindex,nofollow`, a title, `setting.css`, and `<script type="module" src="./setting.js">`. All project imports in `setting.js` use `../` paths so `/readME/setting/` works on GitHub Pages.

Build a desktop two-column page: large preview host, right scrollable panel, status/error region, wallpaper name, and a plain “Back to homepage” link. Parse `?wallpaper=`; default to `flow-shards`, and fall back to it with a visible warning for unknown/non-authorable IDs.

- [ ] **Step 4: Render the 12 controls and presets from schema**

Generate controls from `descriptor.controls`, not duplicated HTML. Use `select` for density, range inputs with visible `0–100` output and endpoint labels, and color inputs. Use `input` for live non-density updates, `change` for density, and a 120ms debounce before resource rebuild. Every change normalizes the complete config, saves the draft, updates the preview manager, and recalculates the preset label (`calm`, `reference`, `intense`, or `custom`).

Preset buttons write their full normalized config. Reset loads the official descriptor default and saves only the draft. Neither operation writes the homepage preview key.

- [ ] **Step 5: Implement local apply, clipboard fallback, and download**

“Apply to local homepage” must save `portfolio-os:wallpaper-preview:v1`, update version-1 preferences to the same wallpaper ID through `savePreferences`, and show success only after storage calls return. It does not modify source files.

“Copy configuration” uses `navigator.clipboard.writeText(serialized)`. On rejection/unavailability, reveal a preselected readonly textarea containing the same serialized string. “Download JSON” creates a Blob from that string and downloads `flow-shards.config.json`. Both paths use the same serializer and contain no timestamp.

- [ ] **Step 6: Style the non-technical desktop scaffold**

Use large plain labels, one-sentence descriptions, endpoint words, visible values, grouped cards, sticky action buttons, clear focus styles, and readable loading/error states. Do not add a mobile-specific alternate layout; allow document scrolling at narrow widths without breaking the page.

- [ ] **Step 7: Verify Task 5 and commit**

Run:

```bash
npx playwright test tests/e2e/wallpaper-setting.spec.js tests/e2e/content-pages.spec.js
npm run test:unit
git diff --check
```

Expected: all commands pass.

Commit:

```bash
git add setting tests/e2e/wallpaper-setting.spec.js tests/e2e/content-pages.spec.js
git commit -m "feat(wallpaper): add author tuning lab"
```

---

### Task 6: Static Previews, Integration Hardening, Visual QA, and Full Verification

**Files:**

- Create: `assets/background/previews/blue-fluid-halftone.png`
- Create: `assets/background/previews/flow-shards.png`
- Create: `tests/capture-wallpaper-previews.mjs`
- Modify: `tests/e2e/wallpapers.spec.js`
- Modify: `tests/e2e/flow-shards.spec.js`
- Modify: `tests/e2e/wallpaper-setting.spec.js`
- Modify: any implementation file only when a new failing regression test demonstrates the integration defect.

**Interfaces:**

- Consumes all prior tasks.
- Produces checked-in static preview assets and final regression evidence.

- [ ] **Step 1: Add failing integration assertions for resource ownership**

Extend E2E coverage to switch blue → Flow → blue repeatedly and assert after every settled transition:

```js
await expect(page.locator('[data-environment-background] [data-wallpaper-active="true"]')).toHaveCount(1);
await expect(page.locator('[data-environment-background] [data-wallpaper-surface]')).toHaveCount(1);
```

Also assert Photos contains no Canvas on the wallpaper panel, the author lab contains exactly one preview surface, a hidden page does not advance Flow's frame counter, reduced motion stays static, and a deliberately rejected renderer leaves both DOM ID and saved preference unchanged.

- [ ] **Step 2: Run integration assertions and verify RED where behavior is incomplete**

Run:

```bash
npx playwright test tests/e2e/wallpapers.spec.js tests/e2e/flow-shards.spec.js tests/e2e/wallpaper-setting.spec.js
```

Expected: any newly exposed cleanup/state defect fails with a selector or state mismatch. If all assertions already pass, record that they protected existing behavior and do not make speculative production changes.

- [ ] **Step 3: Fix only demonstrated integration defects and rerun GREEN**

For each failure, retain the failing test, make the smallest implementation correction, and rerun the exact test until it passes. Typical valid corrections are stale candidate disposal, timer cancellation, motion forwarding, or storage rollback; do not add unrelated renderer controls or mobile visual work.

- [ ] **Step 4: Generate and check in static previews from the actual renderers**

Create `tests/capture-wallpaper-previews.mjs` using Playwright. Start from a clean localStorage state, load each wallpaper at `1440 × 900`, wait for `data-wallpaper-state="ready"`, and screenshot only the background host at a deterministic moment. Write 16:10 PNG files under `assets/background/previews/`; do not use ImageGen, a stock image, or a live Canvas in Photos. The Flow capture uses the `reference` defaults.

Run:

```bash
node tests/capture-wallpaper-previews.mjs
```

Then inspect both images for non-empty pixels, correct crop, and readable blue/Flow distinction.

- [ ] **Step 5: Run focused visual captures**

Capture and inspect these desktop states at `1440 × 900`:

- macOS empty desktop with Flow Shards.
- Windows empty desktop with Flow Shards.
- Flow Shards with an application window focused.
- Photos wallpaper grid and Flow detail.
- `/setting/?wallpaper=flow-shards` using the reference preset.

Correct only visible defects against the approved spec: unstable direction, overlong trails, detached shadows, clipped lab controls, unreadable UI, overexposed bloom, or background dominance over windows.

- [ ] **Step 6: Run the complete verification suite**

Run fresh commands:

```bash
npm test
git diff --check
git status --short
```

Expected: page-generation check, all unit tests, all Playwright tests, and whitespace check pass; status contains only intended feature files before commit.

- [ ] **Step 7: Commit the integration and preview assets**

```bash
git add assets/background/previews tests/capture-wallpaper-previews.mjs tests/e2e scripts modules setting styles
git commit -m "test(wallpaper): harden switching and add previews"
```

- [ ] **Step 8: Re-run post-commit verification**

Run:

```bash
npm test
git status --short
```

Expected: all tests pass and the working tree is clean.
