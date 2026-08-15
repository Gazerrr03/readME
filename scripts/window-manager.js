import {
  boundsFillGeometry,
  clampGeometry,
  closeWindow,
  createWindowState,
  focusWindow,
  maximizeWindow,
  minimizeWindow,
  moveWindow,
  openWindow,
  restoreWindow,
  unmaximizeWindow,
} from './state/window-state.js';

function createElement(document, tagName, attributes = {}, text = '') {
  const element = document.createElement(tagName);
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
  element.textContent = text;
  return element;
}

function getRegistryApp(registry, appId) {
  if (typeof registry.get === 'function' && !Array.isArray(registry)) {
    return registry.get(appId) ?? null;
  }
  return registry.find((app) => app.id === appId) ?? null;
}

function getRenderer(renderers, name) {
  if (typeof renderers.get === 'function') return renderers.get(name);
  return renderers[name];
}

function findSurfaces(taskSurface, selector) {
  const matches = taskSurface.matches?.(selector) ? [taskSurface] : [];
  return [...matches, ...taskSurface.querySelectorAll(selector)];
}

export function createWindowManager({
  root,
  taskSurface = root,
  registry,
  i18n,
  preferences = {},
  renderers = {},
}) {
  let state = createWindowState();
  let drag = null;
  let inertiaFrame = null;
  const windowElements = new Map();
  const pointerPreferences = () => ({
    trackingSensitivity: preferences.trackingSensitivity ?? 50,
    pointerAcceleration: preferences.pointerAcceleration ?? true,
    linearDecay: preferences.linearDecay ?? false,
    snapToGrid: preferences.snapToGrid ?? true,
  });
  const isNarrow = () => root.ownerDocument.defaultView
    .matchMedia('(max-width: 760px)').matches;
  const resetNarrowScroll = () => {
    if (!isNarrow()) return;
    root.scrollTop = 0;
    root.scrollLeft = 0;
    root.ownerDocument.defaultView.requestAnimationFrame(() => {
      if (!isNarrow()) return;
      root.scrollTop = 0;
      root.scrollLeft = 0;
    });
  };

  const getBounds = () => {
    const isMacos = root.dataset.desktopMode === 'macos';
    const topSurface = isMacos ? root.querySelector('[data-macos-menu]') : null;
    const bottomSurface = isMacos
      ? root.querySelector('[data-macos-dock]')
      : root.querySelector('[data-windows-taskbar]');
    const top = topSurface?.offsetHeight ?? 0;
    const bottom = bottomSurface && bottomSurface.offsetTop > top
      ? bottomSurface.offsetTop
      : root.clientHeight;

    return { x: 0, y: top, width: root.clientWidth, height: bottom };
  };

  const ensureWindowLayer = () => {
    let layer = root.querySelector(':scope > [data-window-layer]');
    if (!layer) {
      layer = createElement(root.ownerDocument, 'section', {
        'data-window-layer': '',
        'aria-label': i18n.t('site.title'),
      });
      root.append(layer);
    }
    return layer;
  };

  const renderContent = (mount, app) => {
    const renderer = getRenderer(renderers, app.renderer);
    if (typeof renderer !== 'function') return;

    const host = {
      maximize: () => manager.maximize(app.id),
      unmaximize: () => manager.unmaximize(app.id),
    };
    const content = renderer({ app, i18n, mount, host, preferences });
    if (content instanceof root.ownerDocument.defaultView.Node) mount.append(content);
    else if (typeof content === 'string') mount.textContent = content;
  };

  const createWindowElement = (app) => {
    const document = root.ownerDocument;
    const article = createElement(document, 'article', {
      'data-app-window': app.id,
      'data-os-surface': 'window',
    });
    const titleBar = createElement(document, 'header', {
      'data-window-titlebar': '',
      'data-os-surface': 'titlebar',
    });
    const title = createElement(document, 'h2', { 'data-window-title': '' });
    const controls = createElement(document, 'div', { 'data-window-controls': '' });
    const minimizeButton = createElement(document, 'button', {
      type: 'button',
      'data-window-minimize': '',
      'data-os-control': 'window',
    }, '_');
    const closeButton = createElement(document, 'button', {
      type: 'button',
      'data-window-close': '',
      'data-os-control': 'window',
    }, 'X');
    controls.append(
      minimizeButton,
      closeButton,
    );
    // macOS traffic-light cluster (close/minimize/maximize), left side.
    // Distinct data attributes keep the Windows-only e2e selectors stable.
    const controlsMac = createElement(document, 'div', { 'data-window-controls-mac': '' });
    const macCloseButton = createElement(document, 'button', {
      type: 'button',
      'data-window-mac-close': '',
      'data-tone': 'close',
      'data-os-control': 'window',
    });
    const macMinimizeButton = createElement(document, 'button', {
      type: 'button',
      'data-window-mac-minimize': '',
      'data-tone': 'minimize',
      'data-os-control': 'window',
    });
    const macMaximizeButton = createElement(document, 'button', {
      type: 'button',
      'data-window-mac-maximize': '',
      'data-tone': 'maximize',
      'data-os-control': 'window',
    });
    controlsMac.append(macCloseButton, macMinimizeButton, macMaximizeButton);
    titleBar.append(controlsMac, title, controls);

    const mount = createElement(document, 'div', { 'data-window-content': '' });
    renderContent(mount, app);
    article.append(titleBar, mount);
    return {
      article,
      title,
      minimizeButton,
      closeButton,
      macCloseButton,
      macMinimizeButton,
      macMaximizeButton,
    };
  };

  const updateWindowElement = (elements, window, app) => {
    const { article, title, minimizeButton, closeButton } = elements;
    const localizedTitle = i18n.t(app.titleKey);
    article.dataset.windowStatus = window.status;
    article.dataset.windowActive = String(state.activeId === window.appId);
    article.dataset.windowFullscreen = String(Boolean(window.fullscreen));
    article.setAttribute('aria-label', localizedTitle);
    article.hidden = window.status === 'minimized';
    applyWindowPosition(elements, window);
    title.textContent = localizedTitle;
    minimizeButton.setAttribute('aria-label', i18n.t('windows.minimize'));
    closeButton.setAttribute('aria-label', i18n.t('windows.close'));
    elements.macMinimizeButton.setAttribute('aria-label', i18n.t('windows.minimize'));
    elements.macCloseButton.setAttribute('aria-label', i18n.t('windows.close'));
    elements.macMaximizeButton.setAttribute('aria-label', i18n.t('windows.maximize'));
  };

  // Position/size writes split out so dragging can update the element
  // directly without a full render() (which rebuilds taskbar buttons).
  const applyWindowPosition = (elements, window) => {
    const { article } = elements;
    article.style.left = `${window.x}px`;
    article.style.top = `${window.y}px`;
    article.style.width = `${window.width}px`;
    article.style.height = `${window.height}px`;
    article.style.zIndex = String(window.z);
  };

  const renderRunningApps = () => {
    const surfaces = [
      ...findSurfaces(taskSurface, '[data-windows-taskbar]'),
      ...findSurfaces(taskSurface, '[data-macos-dock]'),
    ];

    surfaces.forEach((surface) => {
      let mount = surface.querySelector(':scope > [data-running-apps]');
      if (!mount) {
        mount = createElement(root.ownerDocument, 'div', { 'data-running-apps': '' });
        surface.append(mount);
      }
      mount.replaceChildren(...state.windows.map((window) => {
        const app = getRegistryApp(registry, window.appId);
        return createElement(root.ownerDocument, 'button', {
          type: 'button',
          'data-running-app': window.appId,
          'data-minimized': String(window.status === 'minimized'),
          'aria-pressed': String(state.activeId === window.appId),
        }, i18n.t(app.titleKey));
      }));
    });
  };

  const render = () => {
    root.dataset.hasVisibleWindow = String(state.windows.some(({ status }) => status === 'normal'));
    const layer = ensureWindowLayer();
    layer.setAttribute('aria-label', i18n.t('site.title'));
    const openIds = new Set(state.windows.map(({ appId }) => appId));
    windowElements.forEach((elements, appId) => {
      if (openIds.has(appId)) return;
      elements.article.remove();
      windowElements.delete(appId);
    });
    state.windows.forEach((window) => {
      const app = getRegistryApp(registry, window.appId);
      let elements = windowElements.get(window.appId);
      if (!elements) {
        elements = createWindowElement(app);
        windowElements.set(window.appId, elements);
      }
      updateWindowElement(elements, window, app);
      // Only mount windows that are not already in the layer: re-appending a
      // mounted node moves it in the DOM, restarts its entry animation, and on
      // Windows Chromium instantly dismisses any open native <select> popup.
      if (elements.article.parentNode !== layer) layer.append(elements.article);
    });
    renderRunningApps();
  };

  const update = (transition) => {
    state = transition(state);
    render();
    resetNarrowScroll();
    return state;
  };

  const manager = {
    open(appId) {
      const app = getRegistryApp(registry, appId);
      if (!app) return state;
      const narrow = isNarrow();
      const wasOpen = state.windows.some((window) => window.appId === appId);
      const next = update((current) => {
        if (!narrow) return openWindow(current, app, getBounds());
        const retained = current.windows.filter((window) => window.appId === appId);
        return openWindow({
          ...current,
          windows: retained,
          activeId: retained.length ? appId : null,
        }, app, getBounds());
      });
      if (!wasOpen) {
        windowElements.get(appId)?.closeButton.focus({ preventScroll: true });
        resetNarrowScroll();
      }
      return next;
    },
    focus(appId) {
      return update((current) => focusWindow(current, appId));
    },
    minimize(appId) {
      return update((current) => minimizeWindow(current, appId));
    },
    restore(appId) {
      return update((current) => restoreWindow(current, appId));
    },
    close(appId) {
      return update((current) => closeWindow(current, appId));
    },
    maximize(appId) {
      if (isNarrow()) return state;
      return update((current) => maximizeWindow(current, appId, getBounds()));
    },
    unmaximize(appId) {
      return update((current) => unmaximizeWindow(current, appId, getBounds()));
    },
    reclamp() {
      const bounds = getBounds();
      return update((current) => current.windows.reduce((next, window) => (
        window.fullscreen
          ? moveWindow(next, window.appId, boundsFillGeometry(bounds), bounds)
          : moveWindow(next, window.appId, clampGeometry(window, bounds), bounds)
      ), current));
    },
    getState() {
      return state;
    },
  };

  const cancelInertia = () => {
    if (inertiaFrame === null) return;
    root.ownerDocument.defaultView.cancelAnimationFrame(inertiaFrame);
    inertiaFrame = null;
  };

  const snapWindowToGrid = (appId) => {
    if (!pointerPreferences().snapToGrid) return;
    const window = state.windows.find((candidate) => candidate.appId === appId);
    if (!window) return;
    state = moveWindow(state, appId, {
      x: Math.round(window.x / 8) * 8,
      y: Math.round(window.y / 8) * 8,
    }, getBounds());
    render();
  };

  const startLinearDecay = ({ appId, velocityX, velocityY }) => {
    let previousTime = performance.now();
    let currentVelocityX = Math.max(-1.2, Math.min(1.2, velocityX));
    let currentVelocityY = Math.max(-1.2, Math.min(1.2, velocityY));

    const step = (time) => {
      const elapsed = Math.min(32, time - previousTime);
      previousTime = time;
      const window = state.windows.find((candidate) => candidate.appId === appId);
      if (!window) {
        inertiaFrame = null;
        return;
      }
      state = moveWindow(state, appId, {
        x: window.x + currentVelocityX * elapsed,
        y: window.y + currentVelocityY * elapsed,
      }, getBounds());
      const elements = windowElements.get(appId);
      const moved = state.windows.find((candidate) => candidate.appId === appId);
      if (elements && moved) applyWindowPosition(elements, moved);

      const decay = elapsed * 0.003;
      const decayVelocity = (velocity) => Math.sign(velocity) * Math.max(0, Math.abs(velocity) - decay);
      currentVelocityX = decayVelocity(currentVelocityX);
      currentVelocityY = decayVelocity(currentVelocityY);
      if (Math.hypot(currentVelocityX, currentVelocityY) <= 0.03) {
        inertiaFrame = null;
        snapWindowToGrid(appId);
        return;
      }
      inertiaFrame = root.ownerDocument.defaultView.requestAnimationFrame(step);
    };
    inertiaFrame = root.ownerDocument.defaultView.requestAnimationFrame(step);
  };

  const handledRunningClicks = new WeakSet();
  const handleRunningAppClick = (event) => {
    if (handledRunningClicks.has(event)) return true;
    const runningApp = event.target.closest('[data-running-app]');
    if (!runningApp || !taskSurface.contains(runningApp)) return false;

    handledRunningClicks.add(event);
    const window = state.windows.find(({ appId }) => appId === runningApp.dataset.runningApp);
    if (window?.status === 'minimized') manager.restore(window.appId);
    else if (window) manager.focus(window.appId);
    return true;
  };

  root.addEventListener('click', (event) => {
    if (handleRunningAppClick(event)) return;

    const appWindow = event.target.closest('[data-app-window]');
    if (!appWindow || !root.contains(appWindow)) return;
    const appId = appWindow.dataset.appWindow;
    if (event.target.closest('[data-window-minimize]')) manager.minimize(appId);
    else if (event.target.closest('[data-window-close]')) manager.close(appId);
    else if (event.target.closest('[data-window-mac-minimize]')) manager.minimize(appId);
    else if (event.target.closest('[data-window-mac-close]')) manager.close(appId);
    else if (event.target.closest('[data-window-mac-maximize]')) {
      const window = state.windows.find((candidate) => candidate.appId === appId);
      if (window?.fullscreen) manager.unmaximize(appId);
      else manager.maximize(appId);
    } else if (state.activeId !== appId) manager.focus(appId);
    // The active window is already on top. Re-focusing it bumps its z-index,
    // rebuilds the taskbar/dock entries, and restyles the window on every
    // click inside it — on Windows Chromium that churn instantly closes the
    // native <select> dropdown opened by the same click.
  });
  if (taskSurface !== root && !root.contains(taskSurface)) {
    taskSurface.addEventListener('click', handleRunningAppClick);
  }

  root.addEventListener('pointerdown', (event) => {
    const titleBar = event.target.closest('[data-window-titlebar]');
    if (!titleBar || event.target.closest('[data-window-controls], [data-window-controls-mac]')) return;
    if (isNarrow()) return;

    cancelInertia();
    const appId = titleBar.closest('[data-app-window]').dataset.appWindow;
    if (state.activeId !== appId) manager.focus(appId);
    const window = state.windows.find((candidate) => candidate.appId === appId);
    drag = {
      appId,
      pointerId: event.pointerId,
      lastClientX: event.clientX,
      lastClientY: event.clientY,
      lastTime: performance.now(),
      velocityX: 0,
      velocityY: 0,
      pendingX: 0,
      pendingY: 0,
      frame: null,
    };
    root.setPointerCapture(event.pointerId);
  });

  // Apply accumulated drag deltas: update state, then write the element's
  // position directly — a full render() per pointermove rebuilds the
  // taskbar/dock buttons and makes dragging stutter.
  const applyDragMovement = () => {
    if (!drag) return;
    drag.frame = null;
    const deltaX = drag.pendingX;
    const deltaY = drag.pendingY;
    drag.pendingX = 0;
    drag.pendingY = 0;
    if (deltaX === 0 && deltaY === 0) return;
    const window = state.windows.find((candidate) => candidate.appId === drag.appId);
    if (!window) return;
    state = moveWindow(state, drag.appId, {
      x: window.x + deltaX,
      y: window.y + deltaY,
    }, getBounds());
    const elements = windowElements.get(drag.appId);
    const moved = state.windows.find((candidate) => candidate.appId === drag.appId);
    if (elements && moved) applyWindowPosition(elements, moved);
  };

  root.addEventListener('pointermove', (event) => {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const now = performance.now();
    const elapsed = Math.max(1, now - drag.lastTime);
    const rawX = event.clientX - drag.lastClientX;
    const rawY = event.clientY - drag.lastClientY;
    const { trackingSensitivity, pointerAcceleration } = pointerPreferences();
    const sensitivity = trackingSensitivity / 50;
    const rawVelocity = Math.hypot(rawX, rawY) / elapsed;
    const acceleration = pointerAcceleration ? Math.min(1.6, 1 + rawVelocity * 0.25) : 1;
    const deltaX = rawX * sensitivity * acceleration;
    const deltaY = rawY * sensitivity * acceleration;
    drag.pendingX += deltaX;
    drag.pendingY += deltaY;
    drag.lastClientX = event.clientX;
    drag.lastClientY = event.clientY;
    drag.lastTime = now;
    drag.velocityX = deltaX / elapsed;
    drag.velocityY = deltaY / elapsed;
    // Coalesce all pointermove bursts into one update per animation frame.
    if (drag.frame === null) {
      drag.frame = root.ownerDocument.defaultView.requestAnimationFrame(applyDragMovement);
    }
  });

  const finishDrag = (event) => {
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (root.hasPointerCapture(event.pointerId)) root.releasePointerCapture(event.pointerId);
    const completedDrag = drag;
    drag = null;
    if (completedDrag.frame !== null) {
      root.ownerDocument.defaultView.cancelAnimationFrame(completedDrag.frame);
      completedDrag.frame = null;
      drag = completedDrag; // applyDragMovement needs drag set; restore briefly
      applyDragMovement();
      drag = null;
    } else if (completedDrag.pendingX !== 0 || completedDrag.pendingY !== 0) {
      drag = completedDrag;
      applyDragMovement();
      drag = null;
    }
    if (
      event.type === 'pointerup'
      && pointerPreferences().linearDecay
      && Math.hypot(completedDrag.velocityX, completedDrag.velocityY) > 0.05
    ) {
      startLinearDecay(completedDrag);
    } else {
      snapWindowToGrid(completedDrag.appId);
    }
  };
  root.addEventListener('pointerup', finishDrag);
  root.addEventListener('pointercancel', finishDrag);
  root.ownerDocument.defaultView.addEventListener('resize', manager.reclamp);
  i18n.subscribe(render);

  return manager;
}
