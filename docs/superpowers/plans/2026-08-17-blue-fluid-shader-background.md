# Blue Fluid Shader Background Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task with checkpoints.

**Goal:** Replace the current high-information pixel-image wallpaper with a restrained blue-gray fluid and halftone WebGL background while preserving the existing desktop, window, and Pen Pen contracts.

**Architecture:** Keep createDesktopEnvironmentController() unaware of rendering details. Extend the existing background factory with a kind: shader descriptor, create a dedicated Canvas/WebGL renderer behind the existing data-environment-background contract, and provide a static blue fallback when WebGL is unavailable. Motion is controlled only by the existing running, focused, static, and document-visibility states.

**Tech Stack:** Vanilla ES modules, WebGL2 fragment shader, HTML Canvas, CSS, Node test runner, Playwright E2E, no new runtime dependencies.

## Global Constraints

- Preserve the existing environment controller interface: element, setMotionState(motion), and destroy().
- Keep the background independent from the system UI, windows, and Pen Pen foreground layer.
- Use the existing running, focused, and static environment motion states.
- Do not add pointermove water ripples, mouse interaction, audio-driven motion, particles, ASCII characters, or blueprint grid lines.
- Do not add Three.js, Pixi.js, or another runtime rendering dependency.
- Stop continuous rendering for hidden documents, reduced motion, mobile, and tablet layouts.
- Keep historical PNG/GIF assets in assets/background/; do not delete them.
- Preserve all unrelated dirty and untracked workspace files; stage only files owned by this plan.
- Use the approved blue-gray palette: medium blue base, desaturated blue midtones, restrained pale blue highlights, no purple/green/neon drift.
- A visual claim is complete only after a real desktop screenshot confirms that widgets, icons, Dock, windows, and Pen Pen remain readable above the shader.

---

## Task 1: Establish the shader background contract

**Files:**
- Modify: scripts/environment/background/background-assets.js
- Modify: scripts/environment/background/background-controller.js
- Create: scripts/environment/background/shader-background.js
- Test: tests/unit/background-controller.test.js

**Interfaces:**
- DESKTOP_BACKGROUND produces { id: 'blue-fluid-halftone', kind: 'shader', palette: 'blue-gray-fluid' }.
- createDesktopBackground({ document, asset }) returns { element, setMotionState, destroy } for both shader and image descriptors.
- createShaderBackground({ document, asset }) returns a canvas with data-environment-background, data-background-id, data-background-kind="shader", and aria-hidden="true".

- [ ] Step 1: Extend the unit-test fake document for Canvas creation.

Add a fake Canvas element with getContext() returning null, a fake document.defaultView, and an event-safe remove() method. Keep the fake small enough to exercise fallback behavior without requiring a real WebGL implementation.

~~~js
function createFakeDocument({ context = null } = {}) {
  const view = {
    devicePixelRatio: 1,
    requestAnimationFrame: () => 1,
    cancelAnimationFrame() {},
    addEventListener() {},
    removeEventListener() {},
  };
  return {
    defaultView: view,
    createElement(tagName) {
      if (tagName === 'canvas') {
        return {
          dataset: {},
          style: { setProperty() {} },
          width: 0,
          height: 0,
          getContext: () => context,
          setAttribute() {},
          remove() { this.removed = true; },
        };
      }
      throw new Error('Unexpected tag: ' + tagName);
    },
  };
}
~~~

- [ ] Step 2: Add a failing test for the active shader descriptor.

Replace the image-specific expectation with the approved active descriptor and assert the renderer exposes the stable background contract.

~~~js
test('desktop background mounts the active shader descriptor', () => {
  const background = createDesktopBackground({
    document: createFakeDocument(),
  });

  assert.equal(background.element.dataset.environmentBackground, '');
  assert.equal(background.element.dataset.backgroundId, 'blue-fluid-halftone');
  assert.equal(background.element.dataset.backgroundKind, 'shader');
  assert.equal(background.element.attributes['aria-hidden'], 'true');
  assert.equal(typeof background.setMotionState, 'function');
  assert.equal(typeof background.destroy, 'function');
});
~~~

Run: node --test tests/unit/background-controller.test.js

Expected: FAIL because the registry still points to the pixel image and the controller only creates img elements.

- [ ] Step 3: Implement descriptor dispatch and the shader fallback shell.

Change background-assets.js to the shader descriptor. Keep the current image creation helper for future PNG/GIF backgrounds, then dispatch by asset.kind in background-controller.js:

~~~js
export function createDesktopBackground({ document, asset = DESKTOP_BACKGROUND }) {
  if (asset.kind === 'shader') return createShaderBackground({ document, asset });
  return createBackgroundImage(document, asset);
}
~~~

In shader-background.js, create the canvas, try webgl2, and immediately paint a static blue fallback when no context exists. Set data-background-fallback="shader-unavailable" only on that path. Implement setMotionState() as a no-op state setter in this task; the render loop is added in Task 2.

- [ ] Step 4: Run the focused unit test.

Run: node --test tests/unit/background-controller.test.js

Expected: PASS, including the shader descriptor and WebGL-unavailable fallback path.

- [ ] Step 5: Commit the contract change.

~~~bash
git add scripts/environment/background/background-assets.js \
  scripts/environment/background/background-controller.js \
  scripts/environment/background/shader-background.js \
  tests/unit/background-controller.test.js
git commit -m "refactor(environment): add shader background contract"
~~~

## Task 2: Implement the blue fluid and halftone shader

**Files:**
- Create: scripts/environment/background/shader-source.js
- Modify: scripts/environment/background/shader-background.js
- Create: tests/unit/shader-background.test.js

**Interfaces:**
- MOTION_CONFIG maps running, focused, and static to deterministic speed, contrast, and density values.
- getMotionConfig(state) returns a motion config for any supported state and treats unknown values as static.
- createShaderBackground({ document, asset }) uses the shader source and motion config without exposing shader internals to the environment controller.

- [ ] Step 1: Write pure motion-configuration tests.

Create tests that lock the user-visible motion relationship without depending on a GPU:

~~~js
test('running has the strongest motion budget', () => {
  assert.equal(getMotionConfig('running').speed > getMotionConfig('focused').speed, true);
  assert.equal(getMotionConfig('focused').speed > getMotionConfig('static').speed, true);
  assert.equal(getMotionConfig('running').density > getMotionConfig('focused').density, true);
});

test('unknown motion states resolve to static', () => {
  assert.deepEqual(getMotionConfig('unknown'), getMotionConfig('static'));
});
~~~

- [ ] Step 2: Run the new unit test to verify it fails.

Run: node --test tests/unit/shader-background.test.js

Expected: FAIL because shader-background.js does not yet export getMotionConfig().

- [ ] Step 3: Implement deterministic shader source and motion config.

Use a full-screen triangle or rectangle vertex shader and a fragment shader with these uniforms:

~~~glsl
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_motion;
uniform float u_density;
uniform float u_contrast;
~~~

The fragment shader must:

1. Normalize UV coordinates using the current aspect ratio.
2. Build two low-frequency noise fields with a small number of FBM layers.
3. Offset the second field by the first to create broad fluid movement.
4. Map the combined field into 4–6 blue-gray palette steps.
5. Add a very weak ordered or clustered halftone signal only where the field is bright.
6. Apply a restrained vignette without turning corners black.

Use motion values close to:

~~~js
export const MOTION_CONFIG = Object.freeze({
  running: Object.freeze({ speed: 0.010, density: 0.045, contrast: 0.92 }),
  focused: Object.freeze({ speed: 0.0025, density: 0.020, contrast: 0.72 }),
  static: Object.freeze({ speed: 0, density: 0.030, contrast: 0.82 }),
});
~~~

These are implementation defaults, not user settings. Keep the shader source free of text, objects, stars, particles, line grids, mouse coordinates, and audio uniforms.

- [ ] Step 4: Connect WebGL uniforms and render one frame.

In shader-background.js:

- compile and link the shader program;
- create one full-screen geometry buffer;
- resolve uniform locations once;
- size the Canvas backing store using min(devicePixelRatio, 2);
- render a deterministic static frame immediately;
- set data-background-renderer="webgl2" on success;
- set data-background-fallback="shader-unavailable" and use the static blue fill if compilation or context setup fails.

Keep shader setup failures contained inside the background renderer. The environment controller must still mount its widgets after any failure.

- [ ] Step 5: Run focused shader tests.

Run: node --test tests/unit/shader-background.test.js tests/unit/background-controller.test.js

Expected: PASS. Tests cover motion config, descriptor metadata, static fallback, and cleanup without depending on a real GPU.

- [ ] Step 6: Commit the shader renderer.

~~~bash
git add scripts/environment/background/shader-source.js \
  scripts/environment/background/shader-background.js \
  tests/unit/shader-background.test.js
git commit -m "feat(environment): render blue fluid shader background"
~~~

## Task 3: Add lifecycle, resize, visibility, and reduced-motion behavior

**Files:**
- Modify: scripts/environment/background/shader-background.js
- Modify: scripts/environment/environment-controller.js only if existing state hooks cannot be consumed without a change
- Modify: tests/unit/shader-background.test.js
- Modify: tests/e2e/environment.spec.js

**Interfaces:**
- setMotionState('running') starts or resumes the RAF loop.
- setMotionState('focused') keeps rendering with lower speed, density, and contrast.
- setMotionState('static') cancels the RAF loop after rendering one static frame.
- destroy() cancels RAF and removes every listener registered by the renderer.

- [ ] Step 1: Add lifecycle tests before implementation.

Use an injected fake view and fake WebGL context with counters:

~~~js
test('static mode renders once and does not schedule a loop', () => {
  const view = createFakeView();
  const background = createShaderBackground({
    document: createShaderDocument({ view, context: createFakeWebGLContext() }),
    asset: SHADER_ASSET,
  });

  background.setMotionState('static');
  assert.equal(view.requestedFrames, 0);
  assert.equal(background.element.dataset.backgroundMotion, 'static');
});

test('destroy cancels the active loop and removes listeners', () => {
  const view = createFakeView();
  const background = createShaderBackground({
    document: createShaderDocument({ view, context: createFakeWebGLContext() }),
    asset: SHADER_ASSET,
  });

  background.setMotionState('running');
  background.destroy();
  assert.equal(view.cancelledFrames, 1);
  assert.equal(view.removedListeners, view.addedListeners);
});
~~~

- [ ] Step 2: Run the lifecycle tests to verify failure.

Run: node --test tests/unit/shader-background.test.js

Expected: FAIL because the renderer currently only paints one frame and does not own RAF, visibility, or resize lifecycle.

- [ ] Step 3: Implement the state-driven render loop.

Implement one syncMotionState() path that:

- stores the current state on data-background-motion;
- updates the u_motion, u_density, and u_contrast uniforms;
- schedules RAF only for running or focused on an animated-capable desktop;
- cancels RAF for static or hidden documents;
- renders one frame immediately after every state change.

The renderer may read document.hidden and document.defaultView.matchMedia('(prefers-reduced-motion: reduce)'), but it must not duplicate the environment capability decision already made by environment-controller.js.

- [ ] Step 4: Implement resize and visibility handling.

Register resize and visibilitychange listeners through the document view/document. On resize, update CSS dimensions and backing resolution before the next frame. On hidden state, cancel the loop; on visible state, restart only if the current motion state is animated.

- [ ] Step 5: Run focused lifecycle tests.

Run: node --test tests/unit/shader-background.test.js tests/unit/background-controller.test.js

Expected: PASS with no leaked RAF handles or listeners.

- [ ] Step 6: Commit lifecycle behavior.

~~~bash
git add scripts/environment/background/shader-background.js \
  scripts/environment/background/background-controller.js \
  scripts/environment/environment-controller.js \
  tests/unit/shader-background.test.js \
  tests/e2e/environment.spec.js
git commit -m "feat(environment): sync shader motion with desktop state"
~~~

## Task 4: Align CSS and update source-of-truth docs

**Files:**
- Modify: styles/environment.css
- Modify: design.md
- Modify: assets/background/README.md
- Test: tests/e2e/ui-kit.spec.js

**Interfaces:**
- Image backgrounds retain image-specific rules only when data-background-kind="image".
- Shader backgrounds fill the environment without relying on object-fit or image-rendering.
- Existing focused opacity behavior remains observable through getComputedStyle().

- [ ] Step 1: Add CSS assertions for the new background element.

Extend the UI Kit E2E test to assert that the active background is a shader Canvas, not an image:

~~~js
expect(result.backgroundId).toBe('blue-fluid-halftone');
expect(result.backgroundKind).toBe('shader');
expect(result.backgroundTag).toBe('CANVAS');
~~~

- [ ] Step 2: Run the focused E2E test to verify failure.

Run: npx playwright test tests/e2e/ui-kit.spec.js tests/e2e/environment.spec.js

Expected: FAIL because the DOM still contains the prior image background and CSS still assumes image-specific behavior.

- [ ] Step 3: Update environment CSS by element kind.

Keep shared positioning, opacity, transition, and sizing rules. Move object-fit, object-position, and image-rendering under the image selector. Ensure Canvas remains display: block, height: 100%, width: 100%, pointer-events: none, and position: absolute.

- [ ] Step 4: Update design.md and the background README.

Change the source-of-truth wording so processed PNG/GIF and the approved low-frequency shader are both valid background sources. Explicitly retain these prohibitions: ASCII character rendering, pointer ripple, high-frequency particles, and shader use for application content.

- [ ] Step 5: Run the focused E2E suite.

Run: npx playwright test tests/e2e/ui-kit.spec.js tests/e2e/environment.spec.js

Expected: PASS on background metadata, desktop mounting, focused opacity, Pen Pen layer ordering, responsive behavior, and reduced motion.

- [ ] Step 6: Commit CSS and documentation alignment.

~~~bash
git add styles/environment.css design.md assets/background/README.md \
  tests/e2e/ui-kit.spec.js tests/e2e/environment.spec.js
git commit -m "docs(environment): document shader background policy"
~~~

## Task 5: Perform browser visual acceptance and complete regression checks

**Files:**
- Create: output/playwright/os-macos-blue-fluid.png as an ignored verification artifact
- Create: output/playwright/os-windows-blue-fluid.png as an ignored verification artifact
- Create: output/playwright/os-mobile-blue-fluid.png as an ignored verification artifact
- Modify: no source files unless a verified visual regression is found

**Interfaces:**
- The active background remains blue-fluid-halftone in all desktop screenshots.
- Widgets, icons, Dock, windows, and Pen Pen remain above the background and readable.

- [ ] Step 1: Run the unit and focused E2E suites.

Run:

~~~bash
npm run test:unit
npx playwright test tests/e2e/environment.spec.js tests/e2e/ui-kit.spec.js
~~~

Expected: all unit tests and all environment/UI Kit E2E tests pass.

- [ ] Step 2: Capture a macOS desktop screenshot.

Open the static server at ?platform=macos&skipBoot=1 at 1440 × 900, wait for the desktop, and save output/playwright/os-macos-blue-fluid.png. Confirm that the background is quiet, the top system bar and instrument cluster are readable, and Pen Pen is clearly visible in the lower-right foreground.

- [ ] Step 3: Capture a Windows desktop screenshot.

Open ?platform=windows&skipBoot=1 at 1440 × 900, save output/playwright/os-windows-blue-fluid.png, and confirm the same background renderer and visual hierarchy under the Windows skin.

- [ ] Step 4: Capture a mobile screenshot.

Use 390 × 844, save output/playwright/os-mobile-blue-fluid.png, and verify that desktop widgets are absent, the background is a static frame, the Dock remains visible, and no shader loop is running.

- [ ] Step 5: Run the full project gate.

Run: npm test

Expected: page freshness, unit tests, and the full E2E suite pass. If an unrelated dirty file causes a failure, report it separately and do not modify it under this plan.

- [ ] Step 6: Audit the final scope.

Run:

~~~bash
git diff --check
git status -sb
git log --oneline --decorate -8
~~~

Confirm that only the shader-background commits are part of this implementation and that unrelated pre-existing modifications remain unstaged.

- [ ] Step 7: Commit verification-only source changes if any.

Do not commit screenshots or generated output. If source changes were required by visual acceptance, stage only those task-owned files and use a focused commit such as:

~~~bash
git add <task-owned-files>
git commit -m "fix(environment): tune blue fluid background"
~~~

If no source adjustment is required, leave verification artifacts ignored and report the completed visual checks.

## Completion Checklist

- [ ] Active background is blue-fluid-halftone and renders through Canvas/WebGL.
- [ ] Shader has two low-frequency fluid layers and restrained bright-region halftone texture.
- [ ] running, focused, static, hidden-document, reduced-motion, and mobile behaviors are covered.
- [ ] WebGL failure leaves the desktop functional with a static blue fallback.
- [ ] No pointer ripple, ASCII, particles, audio-reactive motion, or third-party rendering dependency was introduced.
- [ ] Pen Pen remains an independent white foreground object.
- [ ] design.md and the background README reflect the new policy.
- [ ] Focused tests and full npm test pass.
- [ ] Screenshots confirm the background supports rather than dominates the OS interface.

