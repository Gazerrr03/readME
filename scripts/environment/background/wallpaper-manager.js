import {
  DEFAULT_WALLPAPER_ID,
  getWallpaperDescriptor,
  normalizeWallpaperConfig,
} from './wallpaper-registry.js';
import { loadWallpaperPreview } from './wallpaper-storage.js';

const defaultRegistry = { getWallpaperDescriptor, normalizeWallpaperConfig };
export const DEFAULT_WALLPAPER_TRANSITION_MS = 180;

function createHost(document, initialDescriptor, transitionMs) {
  const host = document.createElement('div');
  host.dataset.environmentBackground = '';
  host.dataset.backgroundId = initialDescriptor.id;
  host.dataset.backgroundKind = initialDescriptor.kind;
  host.dataset.wallpaperState = 'loading';
  host.setAttribute('aria-hidden', 'true');
  host.style?.setProperty?.('--wallpaper-transition-duration', `${transitionMs}ms`);
  return host;
}

function isRenderer(value) {
  return Boolean(
    value?.element
    && typeof value.ready?.then === 'function'
    && typeof value.setMotionState === 'function'
    && typeof value.destroy === 'function',
  );
}

function wait(view, milliseconds) {
  if (!milliseconds) return Promise.resolve();
  return new Promise((resolve) => (view?.setTimeout ?? setTimeout)(resolve, milliseconds));
}

function createDeferred() {
  let resolve;
  const promise = new Promise((nextResolve) => {
    resolve = nextResolve;
  });
  return { promise, resolve };
}

export function createWallpaperManager({
  document,
  initialId = DEFAULT_WALLPAPER_ID,
  storage = null,
  transitionMs = DEFAULT_WALLPAPER_TRANSITION_MS,
  registry = defaultRegistry,
}) {
  const initialDescriptor = registry.getWallpaperDescriptor(initialId)
    ?? registry.getWallpaperDescriptor(DEFAULT_WALLPAPER_ID);
  const element = createHost(document, initialDescriptor, transitionMs);
  const view = document.defaultView;
  let active = null;
  let pending = null;
  let currentId = null;
  let currentConfig = null;
  let motionState = 'static';
  let requestToken = 0;
  let destroyed = false;
  let fallbackRunning = false;
  let effectiveTransitionMs = transitionMs;
  const destroyedRenderers = new WeakSet();

  const destroyRenderer = (renderer) => {
    if (!renderer) return;
    if (!destroyedRenderers.has(renderer)) {
      destroyedRenderers.add(renderer);
      try {
        renderer.destroy?.();
      } catch {
        // Renderer cleanup must never destabilize the desktop shell.
      }
    }
    renderer.element?.remove?.();
  };

  const resolveConfig = (descriptor, options = {}) => {
    const source = options.config
      ?? loadWallpaperPreview(storage, descriptor.id)
      ?? descriptor.defaultConfig;
    return registry.normalizeWallpaperConfig(descriptor.id, source);
  };

  const showCssFallback = () => {
    const pendingRenderer = pending?.renderer;
    const activeRenderer = active?.renderer;
    requestToken += 1;
    pending = null;
    active = null;
    currentId = null;
    currentConfig = null;
    destroyRenderer(pendingRenderer);
    destroyRenderer(activeRenderer);
    element.dataset.wallpaperState = 'fallback';
    element.dataset.wallpaperFallback = 'renderer-unavailable';
  };

  const fail = (id, error) => ({ ok: false, id, error });

  const applyWallpaper = async (id, options = {}) => {
    const descriptor = registry.getWallpaperDescriptor(id);
    if (destroyed) return fail(id, new Error('Wallpaper manager has been destroyed'));
    if (!descriptor) return fail(id, new Error(`Unknown wallpaper: ${id}`));
    const config = resolveConfig(descriptor, options);
    if (config === null) return fail(id, new Error(`Invalid wallpaper config: ${id}`));
    const token = ++requestToken;
    if (pending) {
      destroyRenderer(pending.renderer);
      pending = null;
    }
    let renderer = null;
    let pendingFailure = null;

    try {
      const module = await descriptor.loadRenderer();
      if (destroyed || token !== requestToken) return fail(id, new Error('Wallpaper request was superseded'));
      renderer = module?.createWallpaperRenderer?.({
        document,
        descriptor,
        config,
        onError(error) {
          if (renderer === pending?.renderer && token === requestToken) {
            const failure = pending.failure;
            pending = null;
            requestToken += 1;
            destroyRenderer(renderer);
            failure?.resolve(error ?? new Error(`Wallpaper renderer failed: ${id}`));
            return;
          }
          if (destroyed || token !== requestToken || renderer !== active?.renderer) return;
          if (id === DEFAULT_WALLPAPER_ID || fallbackRunning) {
            showCssFallback();
            return;
          }
          fallbackRunning = true;
          applyWallpaper(DEFAULT_WALLPAPER_ID, { fallback: true }).finally(() => {
            fallbackRunning = false;
          });
        },
      });
      if (!isRenderer(renderer)) throw new Error(`Invalid wallpaper renderer: ${id}`);
      pendingFailure = createDeferred();
      pending = { renderer, token, failure: pendingFailure };
      renderer.element.dataset.wallpaperSurface = '';
      renderer.element.dataset.wallpaperActive = 'false';
      renderer.element.style.opacity = '0';
      element.append(renderer.element);
      renderer.setMotionState(motionState);
      const readyResult = await Promise.race([
        Promise.resolve(renderer.ready).then(
          () => ({ status: 'ready' }),
          (error) => ({ status: 'rejected', error }),
        ),
        pendingFailure.promise.then((error) => ({ status: 'failed', error })),
      ]);
      if (readyResult.status === 'rejected') throw readyResult.error;
      if (readyResult.status === 'failed') {
        if (options.initial && id !== DEFAULT_WALLPAPER_ID) {
          return applyWallpaper(DEFAULT_WALLPAPER_ID, { initial: true, fallback: true });
        }
        if (id === DEFAULT_WALLPAPER_ID && (options.initial || options.fallback)) showCssFallback();
        return fail(id, readyResult.error);
      }
      if (destroyed || token !== requestToken) {
        destroyRenderer(renderer);
        if (pending?.renderer === renderer) pending = null;
        return fail(id, new Error('Wallpaper request was superseded'));
      }

      const previous = active;
      renderer.element.dataset.wallpaperActive = 'true';
      renderer.element.style.opacity = '1';
      element.dataset.backgroundId = descriptor.id;
      element.dataset.backgroundKind = descriptor.kind;
      element.dataset.wallpaperState = 'ready';
      delete element.dataset.wallpaperFallback;
      active = { renderer, descriptor };
      pending = null;
      currentId = descriptor.id;
      currentConfig = config;
      if (previous) {
        previous.renderer.element.dataset.wallpaperActive = 'false';
        previous.renderer.element.style.opacity = '0';
        await wait(view, effectiveTransitionMs);
        if (previous !== active) destroyRenderer(previous.renderer);
      }
      return { ok: true, id: descriptor.id };
    } catch (error) {
      if (renderer) destroyRenderer(renderer);
      if (pending?.renderer === renderer) pending = null;
      if (destroyed || token !== requestToken) return fail(id, error);
      if (options.initial && id !== DEFAULT_WALLPAPER_ID) {
        return applyWallpaper(DEFAULT_WALLPAPER_ID, { initial: true, fallback: true });
      }
      if (id === DEFAULT_WALLPAPER_ID && (options.initial || options.fallback)) showCssFallback();
      return fail(id, error);
    }
  };

  const ready = applyWallpaper(initialDescriptor.id, { initial: true });

  return {
    element,
    ready,
    get currentId() {
      return currentId;
    },
    applyWallpaper,
    updateConfig(config) {
      if (!active || currentId === null) return fail(currentId, new Error('No active wallpaper'));
      const normalized = registry.normalizeWallpaperConfig(currentId, config);
      if (normalized === null) return fail(currentId, new Error(`Invalid wallpaper config: ${currentId}`));
      currentConfig = normalized;
      active.renderer.updateConfig?.(normalized);
      return { ok: true, id: currentId, config: currentConfig };
    },
    setMotionState(state) {
      motionState = state;
      element.dataset.backgroundMotion = state;
      active?.renderer.setMotionState(state);
      if (pending?.renderer !== active?.renderer) pending?.renderer.setMotionState(state);
    },
    setTransitionDuration(milliseconds) {
      if (!Number.isFinite(milliseconds) || milliseconds < 0) return;
      effectiveTransitionMs = milliseconds;
      element.style?.setProperty?.('--wallpaper-transition-duration', `${milliseconds}ms`);
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      requestToken += 1;
      destroyRenderer(pending?.renderer);
      if (pending?.renderer !== active?.renderer) destroyRenderer(active?.renderer);
      pending = null;
      active = null;
      element.remove();
    },
  };
}
