import test from 'node:test';
import assert from 'node:assert/strict';
import { getWallpaperDescriptor } from '../../scripts/environment/background/wallpaper-registry.js';
import { createDesktopBackground } from '../../scripts/environment/background/background-controller.js';

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
      const node = {
        tagName: tagName.toUpperCase(),
        dataset: {},
        style: { setProperty() {} },
        children: [],
        width: 0,
        height: 0,
        attributes: {},
        append(...children) {
          children.forEach((child) => {
            child.parentNode = this;
            this.children.push(child);
          });
        },
        querySelector(selector) {
          return this.children.find((child) => (
            selector === '[data-wallpaper-surface]' && child.dataset.wallpaperSurface !== undefined
          )) ?? null;
        },
        getContext: () => context,
        setAttribute(name, value) {
          this.attributes[name] = String(value);
        },
        remove() {
          this.removed = true;
        },
      };
      return node;
    },
  };
}

test('desktop background keeps a stable host around the active shader surface', async () => {
  const shaderDescriptor = getWallpaperDescriptor('blue-fluid-halftone');
  const background = createDesktopBackground({
    document: createFakeDocument(),
    asset: shaderDescriptor,
  });
  await background.ready;

  assert.equal(background.element.dataset.environmentBackground, '');
  assert.equal(background.element.dataset.backgroundId, shaderDescriptor.id);
  assert.equal(shaderDescriptor.kind, 'shader');
  assert.equal(background.element.dataset.backgroundKind, 'shader');
  assert.equal(background.element.attributes['aria-hidden'], 'true');
  assert.equal(background.element.tagName, 'DIV');
  const surface = background.element.querySelector('[data-wallpaper-surface]');
  assert.equal(surface.tagName, 'CANVAS');
  assert.equal(surface.dataset.backgroundFallback, 'shader-unavailable');

  background.setMotionState('focused');
  assert.equal(background.element.dataset.backgroundMotion, 'focused');

  background.destroy();
  assert.equal(background.element.removed, true);
});
