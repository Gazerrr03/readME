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

  const renderWindow = (window) => {
    const document = root.ownerDocument;
    const app = getRegistryApp(registry, window.appId);
    const article = createElement(document, 'article', {
      'data-app-window': window.appId,
      'data-window-status': window.status,
      'aria-label': i18n.t(app.titleKey),
    });
    article.hidden = window.status === 'minimized';
    article.style.left = `${window.x}px`;
    article.style.top = `${window.y}px`;
    article.style.width = `${window.width}px`;
    article.style.height = `${window.height}px`;
    article.style.zIndex = String(window.z);

    const titleBar = createElement(document, 'header', { 'data-window-titlebar': '' });
    const title = createElement(document, 'h2', { 'data-window-title': '' }, i18n.t(app.titleKey));
    const controls = createElement(document, 'div', { 'data-window-controls': '' });
    controls.append(
      createElement(document, 'button', {
        type: 'button',
        'data-window-minimize': '',
        'aria-label': i18n.t('windows.minimize'),
      }, '_'),
      createElement(document, 'button', {
        type: 'button',
        'data-window-close': '',
        'aria-label': i18n.t('windows.close'),
      }, 'X'),
    );
    titleBar.append(title, controls);

    const mount = createElement(document, 'div', { 'data-window-content': '' });
    renderContent(mount, app);
    article.append(titleBar, mount);
    return article;
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
    const layer = ensureWindowLayer();
    layer.replaceChildren(...state.windows.map(renderWindow));
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
      return update((current) => openWindow(current, app, getBounds()));
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

  root.addEventListener('click', (event) => {
    const runningApp = event.target.closest('[data-running-app]');
    if (runningApp && taskSurface.contains(runningApp)) {
      const window = state.windows.find(({ appId }) => appId === runningApp.dataset.runningApp);
      if (window?.status === 'minimized') manager.restore(window.appId);
      else if (window) manager.focus(window.appId);
      return;
    }

    const appWindow = event.target.closest('[data-app-window]');
    if (!appWindow || !root.contains(appWindow)) return;
    const appId = appWindow.dataset.appWindow;
    if (event.target.closest('[data-window-minimize]')) manager.minimize(appId);
    else if (event.target.closest('[data-window-close]')) manager.close(appId);
    else manager.focus(appId);
  });

  root.addEventListener('pointerdown', (event) => {
    const titleBar = event.target.closest('[data-window-titlebar]');
    if (!titleBar || event.target.closest('[data-window-controls]')) return;
    if (root.ownerDocument.defaultView.matchMedia('(max-width: 600px)').matches) return;

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
