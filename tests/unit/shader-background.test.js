import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createShaderBackground,
  getMotionConfig,
} from '../../scripts/environment/background/shader-background.js';

const SHADER_ASSET = Object.freeze({
  id: 'blue-fluid-halftone',
  kind: 'shader',
  palette: 'blue-gray-fluid',
});

function createFakeView() {
  const listeners = new Map();
  let nextFrame = 0;
  const callbacks = new Map();
  return {
    devicePixelRatio: 1,
    innerWidth: 320,
    innerHeight: 200,
    requestedFrames: 0,
    cancelledFrames: 0,
    addedListeners: 0,
    removedListeners: 0,
    requestAnimationFrame(callback) {
      const id = ++nextFrame;
      callbacks.set(id, callback);
      this.requestedFrames += 1;
      return id;
    },
    cancelAnimationFrame(id) {
      callbacks.delete(id);
      this.cancelledFrames += 1;
    },
    addEventListener(type, callback) {
      listeners.set(type, callback);
      this.addedListeners += 1;
    },
    removeEventListener(type) {
      listeners.delete(type);
      this.removedListeners += 1;
    },
    emit(type) {
      listeners.get(type)?.();
    },
  };
}

function createFakeWebGLContext() {
  const gl = {
    VERTEX_SHADER: 1,
    FRAGMENT_SHADER: 2,
    COMPILE_STATUS: 3,
    LINK_STATUS: 4,
    ARRAY_BUFFER: 5,
    STATIC_DRAW: 6,
    FLOAT: 7,
    TRIANGLES: 8,
    drawCalls: 0,
    createShader: () => ({}),
    shaderSource() {},
    compileShader() {},
    getShaderParameter: () => true,
    getShaderInfoLog: () => '',
    deleteShader() {},
    createProgram: () => ({}),
    attachShader() {},
    linkProgram() {},
    getProgramParameter: () => true,
    getProgramInfoLog: () => '',
    deleteProgram() {},
    createBuffer: () => ({}),
    bindBuffer() {},
    bufferData() {},
    getAttribLocation: () => 0,
    enableVertexAttribArray() {},
    vertexAttribPointer() {},
    getUniformLocation: (_program, name) => name,
    viewport() {},
    useProgram() {},
    uniform2f() {},
    uniform1f() {},
    drawArrays() { this.drawCalls += 1; },
    deleteBuffer() {},
  };
  return gl;
}

function createShaderDocument({ view, context }) {
  const document = {
    hidden: false,
    defaultView: view,
    addEventListener(type, callback) {
      view.addEventListener(`document:${type}`, callback);
    },
    removeEventListener(type) {
      view.removeEventListener(`document:${type}`);
    },
    createElement(tagName) {
      assert.equal(tagName, 'canvas');
      return {
        ownerDocument: document,
        dataset: {},
        style: { backgroundColor: '' },
        width: 0,
        height: 0,
        getContext: () => context,
        getBoundingClientRect: () => ({ width: 320, height: 200 }),
        setAttribute() {},
        remove() { this.removed = true; },
      };
    },
  };
  return document;
}

test('running has the strongest motion budget', () => {
  assert.equal(getMotionConfig('running').speed > getMotionConfig('focused').speed, true);
  assert.equal(getMotionConfig('focused').speed > getMotionConfig('static').speed, true);
  assert.equal(getMotionConfig('running').density > getMotionConfig('focused').density, true);
});

test('unknown motion states resolve to static', () => {
  assert.deepEqual(getMotionConfig('unknown'), getMotionConfig('static'));
});

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
