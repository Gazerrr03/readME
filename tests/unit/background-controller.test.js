import test from 'node:test';
import assert from 'node:assert/strict';
import { DESKTOP_BACKGROUND } from '../../scripts/environment/background/background-assets.js';
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
      assert.equal(tagName, 'canvas');
      return {
        dataset: {},
        style: { setProperty() {} },
        width: 0,
        height: 0,
        attributes: {},
        getContext: () => context,
        setAttribute(name, value) {
          this.attributes[name] = String(value);
        },
        remove() {
          this.removed = true;
        },
      };
    },
  };
}

test('desktop background mounts the active shader descriptor', () => {
  const background = createDesktopBackground({
    document: createFakeDocument(),
  });

  assert.equal(background.element.dataset.environmentBackground, '');
  assert.equal(background.element.dataset.backgroundId, DESKTOP_BACKGROUND.id);
  assert.equal(DESKTOP_BACKGROUND.kind, 'shader');
  assert.equal(background.element.dataset.backgroundKind, 'shader');
  assert.equal(background.element.attributes['aria-hidden'], 'true');
  assert.equal(background.element.dataset.backgroundFallback, 'shader-unavailable');

  background.setMotionState('focused');
  assert.equal(background.element.dataset.backgroundMotion, 'focused');

  background.destroy();
  assert.equal(background.element.removed, true);
});
