import test from 'node:test';
import assert from 'node:assert/strict';
import { DESKTOP_BACKGROUND } from '../../scripts/environment/background/background-assets.js';
import { createDesktopBackground } from '../../scripts/environment/background/background-controller.js';

function createFakeDocument() {
  const document = {
    createElement(tagName) {
      assert.equal(tagName, 'img');
      return {
        dataset: {},
        style: {
          setProperty(name, value) {
            this[name] = value;
          },
        },
        attributes: {},
        removed: false,
        setAttribute(name, value) {
          this.attributes[name] = String(value);
        },
        remove() {
          this.removed = true;
        },
      };
    },
  };
  return document;
}

test('desktop background creates an adaptive image from the registered asset', () => {
  const background = createDesktopBackground({
    document: createFakeDocument(),
  });

  assert.equal(background.element.dataset.environmentBackground, '');
  assert.equal(background.element.dataset.backgroundId, DESKTOP_BACKGROUND.id);
  assert.equal(background.element.src, DESKTOP_BACKGROUND.src);
  assert.equal(background.element.alt, '');
  assert.equal(background.element.draggable, false);
  assert.equal(background.element.attributes['aria-hidden'], 'true');
  assert.equal(background.element.style['--background-fit'], 'cover');
  assert.equal(background.element.style['--background-position'], 'center center');

  background.setMotionState('focused');
  assert.equal(background.element.dataset.backgroundMotion, 'focused');

  background.destroy();
  assert.equal(background.element.removed, true);
});
