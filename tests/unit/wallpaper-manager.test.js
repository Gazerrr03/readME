import test from 'node:test';
import assert from 'node:assert/strict';
import { createWallpaperManager } from '../../scripts/environment/background/wallpaper-manager.js';

class FakeElement {
  constructor(tagName) {
    this.tagName = tagName.toUpperCase();
    this.dataset = {};
    const values = new Map();
    this.style = {
      setProperty(name, value) { values.set(name, String(value)); },
      getPropertyValue(name) { return values.get(name) ?? ''; },
    };
    this.children = [];
    this.parentNode = null;
  }

  append(...nodes) {
    nodes.forEach((node) => {
      node.parentNode?.removeChild(node);
      node.parentNode = this;
      this.children.push(node);
    });
  }

  removeChild(node) {
    this.children = this.children.filter((child) => child !== node);
    node.parentNode = null;
  }

  remove() {
    this.parentNode?.removeChild(this);
    this.removed = true;
  }

  setAttribute(name, value) {
    this.attributes ??= {};
    this.attributes[name] = String(value);
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] ?? null;
  }

  querySelectorAll(selector) {
    const matches = [];
    const walk = (node) => {
      if (selector === '[data-wallpaper-surface]' && node.dataset.wallpaperSurface !== undefined) matches.push(node);
      if (selector === '[data-wallpaper-active="true"]' && node.dataset.wallpaperActive === 'true') matches.push(node);
      node.children.forEach(walk);
    };
    this.children.forEach(walk);
    return matches;
  }
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((nextResolve, nextReject) => {
    resolve = nextResolve;
    reject = nextReject;
  });
  return { promise, resolve, reject };
}

function createManagerHarness({
  transitionMs = 0,
  previewConfig = null,
  fallbackBlueSettled = true,
  rendererRemovesElement = true,
} = {}) {
  const flow = deferred();
  const blue = deferred();
  const fallbackBlue = deferred();
  blue.resolve();
  if (fallbackBlueSettled) fallbackBlue.resolve();
  let blueLoads = 0;
  const renderers = [];
  const timerDurations = [];
  const document = {
    createElement: (tagName) => new FakeElement(tagName),
    defaultView: {
      setTimeout(callback, duration) {
        timerDurations.push(duration);
        return setTimeout(callback, duration);
      },
      clearTimeout,
    },
  };
  const createRenderer = (id, ready) => ({ document: rendererDocument, config, onError }) => {
    const element = rendererDocument.createElement('canvas');
    element.dataset.wallpaperSurface = '';
    const renderer = {
      element,
      ready: ready.promise,
      motion: [],
      configs: [config],
      onError,
      setMotionState(state) { this.motion.push(state); },
      updateConfig(next) { this.configs.push(next); },
      destroy() {
        element.dataset.destroyed = 'true';
        if (rendererRemovesElement) element.remove();
      },
    };
    renderers.push({ id, renderer });
    return renderer;
  };
  const registry = {
    getWallpaperDescriptor(id) {
      return {
        'blue-fluid-halftone': {
          id: 'blue-fluid-halftone', kind: 'shader', defaultConfig: {},
          loadRenderer: async () => ({ createWallpaperRenderer: createRenderer(
            'blue-fluid-halftone', blueLoads++ === 0 ? blue : fallbackBlue,
          ) }),
        },
        'flow-shards': {
          id: 'flow-shards', kind: 'three', defaultConfig: { speed: 42 },
          loadRenderer: async () => ({ createWallpaperRenderer: createRenderer('flow-shards', flow) }),
        },
      }[id] ?? null;
    },
    normalizeWallpaperConfig(id, config) {
      return id === 'flow-shards' ? { speed: Number(config?.speed) || 42 } : {};
    },
  };
  const storage = previewConfig === null ? null : {
    getItem() {
      return JSON.stringify({ version: 1, wallpaperId: 'flow-shards', config: previewConfig });
    },
  };
  const manager = createWallpaperManager({
    document,
    initialId: 'blue-fluid-halftone',
    storage,
    transitionMs,
    registry,
  });
  return {
    manager,
    renderers,
    resolveFlow: flow.resolve,
    rejectFlow: flow.reject,
    rejectFallbackBlue: fallbackBlue.reject,
    timerDurations,
  };
}

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

test('failed candidates never replace the current wallpaper', async () => {
  const harness = createManagerHarness({ transitionMs: 0 });
  await harness.manager.ready;
  const failed = harness.manager.applyWallpaper('flow-shards');
  harness.rejectFlow(new Error('shader compile failed'));
  assert.equal((await failed).ok, false);
  assert.equal(harness.manager.currentId, 'blue-fluid-halftone');
  assert.equal(harness.manager.element.querySelectorAll('[data-wallpaper-active="true"]').length, 1);
});

test('motion reaches candidates created after the state changes', async () => {
  const harness = createManagerHarness({ transitionMs: 0 });
  await harness.manager.ready;
  harness.manager.setMotionState('focused');
  const pending = harness.manager.applyWallpaper('flow-shards');
  await Promise.resolve();
  assert.deepEqual(harness.renderers.at(-1).renderer.motion, ['focused']);
  harness.resolveFlow();
  await pending;
});

test('a stale rapid request is destroyed without replacing the latest candidate', async () => {
  const harness = createManagerHarness({ transitionMs: 0 });
  await harness.manager.ready;
  const first = harness.manager.applyWallpaper('flow-shards');
  await Promise.resolve();
  const second = harness.manager.applyWallpaper('blue-fluid-halftone');
  harness.resolveFlow();
  assert.equal((await first).ok, false);
  assert.deepEqual(await second, { ok: true, id: 'blue-fluid-halftone' });
  assert.equal(harness.manager.currentId, 'blue-fluid-halftone');
  assert.equal(harness.renderers.find(({ id }) => id === 'flow-shards').renderer.element.dataset.destroyed, 'true');
});

test('local preview config takes precedence over the descriptor default', async () => {
  const harness = createManagerHarness({ previewConfig: { speed: 17 } });
  await harness.manager.ready;
  const pending = harness.manager.applyWallpaper('flow-shards');
  await Promise.resolve();
  assert.deepEqual(harness.renderers.at(-1).renderer.configs, [{ speed: 17 }]);
  harness.resolveFlow();
  await pending;
});

test('updateConfig normalizes and forwards config to the active renderer', async () => {
  const harness = createManagerHarness();
  await harness.manager.ready;
  const pending = harness.manager.applyWallpaper('flow-shards');
  harness.resolveFlow();
  await pending;
  assert.deepEqual(harness.manager.updateConfig({ speed: 7 }), { ok: true, id: 'flow-shards', config: { speed: 7 } });
  assert.deepEqual(harness.renderers.at(-1).renderer.configs.at(-1), { speed: 7 });
});

test('destroy tears down active and pending resources', async () => {
  const harness = createManagerHarness();
  await harness.manager.ready;
  const pending = harness.manager.applyWallpaper('flow-shards');
  harness.manager.destroy();
  harness.resolveFlow();
  assert.equal((await pending).ok, false);
  assert.equal(harness.renderers[0].renderer.element.dataset.destroyed, 'true');
  assert.equal(harness.renderers.at(-1).renderer.element.dataset.destroyed, 'true');
});

test('a newer request immediately tears down a stale candidate that never becomes ready', async () => {
  const harness = createManagerHarness();
  await harness.manager.ready;
  void harness.manager.applyWallpaper('flow-shards');
  await Promise.resolve();
  const stale = harness.renderers.at(-1).renderer;
  await harness.manager.applyWallpaper('blue-fluid-halftone');

  assert.equal(stale.element.dataset.destroyed, 'true');
  assert.equal(harness.manager.currentId, 'blue-fluid-halftone');
});

test('a runtime failure in the default renderer leaves a CSS-only host', async () => {
  const harness = createManagerHarness();
  await harness.manager.ready;
  harness.renderers[0].renderer.onError(new Error('context lost'));

  assert.equal(harness.manager.currentId, null);
  assert.equal(harness.manager.element.dataset.wallpaperState, 'fallback');
  assert.equal(harness.manager.element.querySelectorAll('[data-wallpaper-surface]').length, 0);
});

test('a failed default fallback removes the failed non-default surface', async () => {
  const harness = createManagerHarness({ fallbackBlueSettled: false });
  await harness.manager.ready;
  const flow = harness.manager.applyWallpaper('flow-shards');
  await Promise.resolve();
  harness.resolveFlow();
  await flow;
  harness.renderers.at(-1).renderer.onError(new Error('context lost'));
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(harness.renderers.at(-1).id, 'blue-fluid-halftone');
  harness.rejectFallbackBlue(new Error('default renderer failed'));
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.equal(harness.manager.currentId, null);
  assert.equal(harness.manager.element.dataset.wallpaperState, 'fallback');
  assert.equal(harness.manager.element.querySelectorAll('[data-wallpaper-surface]').length, 0);
});

test('the host exposes the same transition duration used for candidate cleanup', async () => {
  const harness = createManagerHarness({ transitionMs: 73 });
  await harness.manager.ready;

  assert.equal(harness.manager.element.style.getPropertyValue('--wallpaper-transition-duration'), '73ms');
});

test('a pending renderer error settles its request and retains the active surface', async () => {
  const harness = createManagerHarness();
  await harness.manager.ready;
  const oldElement = harness.manager.element.querySelector('[data-wallpaper-surface]');
  const pending = harness.manager.applyWallpaper('flow-shards');
  await Promise.resolve();
  const candidate = harness.renderers.at(-1).renderer;
  candidate.onError(new Error('initialization failed'));
  const result = await Promise.race([
    pending,
    new Promise((resolve) => setTimeout(() => resolve({ timeout: true }), 20)),
  ]);

  assert.equal(result.ok, false);
  assert.equal(candidate.element.dataset.destroyed, 'true');
  assert.equal(candidate.element.removed, true);
  assert.equal(harness.manager.currentId, 'blue-fluid-halftone');
  assert.equal(oldElement.parentNode, harness.manager.element);
});

test('CSS fallback removes surfaces when a renderer destroy omits DOM cleanup', async () => {
  const harness = createManagerHarness({ rendererRemovesElement: false });
  await harness.manager.ready;
  harness.renderers[0].renderer.onError(new Error('context lost'));

  assert.equal(harness.manager.element.querySelectorAll('[data-wallpaper-surface]').length, 0);
});

test('updating transition duration to zero changes CSS and skips cleanup delay', async () => {
  const harness = createManagerHarness({ transitionMs: 73 });
  await harness.manager.ready;
  harness.manager.setTransitionDuration(0);
  const flow = harness.manager.applyWallpaper('flow-shards');
  harness.resolveFlow();
  await flow;

  assert.equal(harness.manager.element.style.getPropertyValue('--wallpaper-transition-duration'), '0ms');
  assert.deepEqual(harness.timerDurations, []);
});
