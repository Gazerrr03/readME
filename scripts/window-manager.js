import {
  clampGeometry,
  closeWindow,
  createWindowState,
  focusWindow,
  minimizeWindow,
  moveWindow,
  openWindow,
  restoreWindow,
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

export function createWindowManager({ root, taskSurface = root, registry, i18n, renderers = {} }) {
  let state = createWindowState();
  let drag = null;
  const windowElements = new Map();

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

    const content = renderer({ app, i18n, mount });
    if (content instanceof root.ownerDocument.defaultView.Node) mount.append(content);
    else if (typeof content === 'string') mount.textContent = content;
  };

  const createWindowElement = (app) => {
    const document = root.ownerDocument;
    const article = createElement(document, 'article', {
      'data-app-window': app.id,
    });
    const titleBar = createElement(document, 'header', { 'data-window-titlebar': '' });
    const title = createElement(document, 'h2', { 'data-window-title': '' });
    const controls = createElement(document, 'div', { 'data-window-controls': '' });
    const minimizeButton = createElement(document, 'button', {
      type: 'button',
      'data-window-minimize': '',
    }, '_');
    const closeButton = createElement(document, 'button', {
      type: 'button',
      'data-window-close': '',
    }, 'X');
    controls.append(
      minimizeButton,
      closeButton,
    );
    titleBar.append(title, controls);

    const mount = createElement(document, 'div', { 'data-window-content': '' });
    renderContent(mount, app);
    article.append(titleBar, mount);
    return { article, title, minimizeButton, closeButton };
  };

  const updateWindowElement = (elements, window, app) => {
    const { article, title, minimizeButton, closeButton } = elements;
    const localizedTitle = i18n.t(app.titleKey);
    article.dataset.windowStatus = window.status;
    article.setAttribute('aria-label', localizedTitle);
    article.hidden = window.status === 'minimized';
    article.style.left = `${window.x}px`;
    article.style.top = `${window.y}px`;
    article.style.width = `${window.width}px`;
    article.style.height = `${window.height}px`;
    article.style.zIndex = String(window.z);
    title.textContent = localizedTitle;
    minimizeButton.setAttribute('aria-label', i18n.t('windows.minimize'));
    closeButton.setAttribute('aria-label', i18n.t('windows.close'));
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
      layer.append(elements.article);
    });
    renderRunningApps();
  };

  const update = (transition) => {
    state = transition(state);
    render();
    return state;
  };

  const manager = {
    open(appId) {
      const app = getRegistryApp(registry, appId);
      if (!app) return state;
      const isNarrow = root.ownerDocument.defaultView.matchMedia('(max-width: 760px)').matches;
      const wasOpen = state.windows.some((window) => window.appId === appId);
      const next = update((current) => {
        if (!isNarrow) return openWindow(current, app, getBounds());
        const retained = current.windows.filter((window) => window.appId === appId);
        return openWindow({
          ...current,
          windows: retained,
          activeId: retained.length ? appId : null,
        }, app, getBounds());
      });
      if (!wasOpen) {
        windowElements.get(appId)?.closeButton.focus({ preventScroll: true });
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
    reclamp() {
      const bounds = getBounds();
      return update((current) => current.windows.reduce((next, window) => (
        moveWindow(next, window.appId, clampGeometry(window, bounds), bounds)
      ), current));
    },
    getState() {
      return state;
    },
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
    else manager.focus(appId);
  });
  if (taskSurface !== root && !root.contains(taskSurface)) {
    taskSurface.addEventListener('click', handleRunningAppClick);
  }

  root.addEventListener('pointerdown', (event) => {
    const titleBar = event.target.closest('[data-window-titlebar]');
    if (!titleBar || event.target.closest('[data-window-controls]')) return;
    if (root.ownerDocument.defaultView.matchMedia('(max-width: 760px)').matches) return;

    const appId = titleBar.closest('[data-app-window]').dataset.appWindow;
    manager.focus(appId);
    const window = state.windows.find((candidate) => candidate.appId === appId);
    drag = { appId, pointerId: event.pointerId, x: window.x, y: window.y, clientX: event.clientX, clientY: event.clientY };
    root.setPointerCapture(event.pointerId);
  });

  root.addEventListener('pointermove', (event) => {
    if (!drag || drag.pointerId !== event.pointerId) return;
    state = moveWindow(state, drag.appId, {
      x: drag.x + event.clientX - drag.clientX,
      y: drag.y + event.clientY - drag.clientY,
    }, getBounds());
    render();
  });

  const finishDrag = (event) => {
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (root.hasPointerCapture(event.pointerId)) root.releasePointerCapture(event.pointerId);
    drag = null;
  };
  root.addEventListener('pointerup', finishDrag);
  root.addEventListener('pointercancel', finishDrag);
  root.ownerDocument.defaultView.addEventListener('resize', manager.reclamp);
  i18n.subscribe(render);

  return manager;
}
