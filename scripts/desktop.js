import { renderDesktopFolders } from './apps/desktop-folders.js';

const MODES = new Set(['windows', 'macos']);
const RENDER_PREFERENCES = new Set([
  'layout', 'audioEnabled', 'protocolArchitecture', 'encryptionLevel',
]);

export function detectDesktopMode(environment = {}, preference = 'auto') {
  if (MODES.has(preference)) return preference;
  const source = `${environment.platform ?? ''} ${environment.userAgent ?? ''}`.toLowerCase();
  return source.includes('mac') ? 'macos' : 'windows';
}

function createElement(document, tagName, attributes = {}, text = '') {
  const element = document.createElement(tagName);
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
  element.textContent = text;
  return element;
}

export function isHotSpringHour(date = new Date()) {
  const hour = date.getHours();
  return hour === 1 || hour === 2;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

function svgElement(document, tagName, attributes = {}) {
  const element = document.createElementNS(SVG_NS, tagName);
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
  return element;
}

// The visible desktop surface is the dark night layer in both modes, so
// the sprite inverts the house ink language: amber is the drawn ink. The
// body is a SOLID amber silhouette; belly and face patch are night plates
// laid on top, each closed by a hairline amber contour so they stay
// readable at pet size (solid silhouette first, details large enough to
// read).
function createPenguinSprite(document) {
  const svg = svgElement(document, 'svg', {
    viewBox: '0 0 68 92',
    width: '68',
    height: '92',
    'aria-hidden': 'true',
    focusable: 'false',
    'data-bot-sprite': '',
  });

  const ink = svgElement(document, 'g', { fill: 'var(--amber)' });
  ink.append(
    // Flippers reach out from the silhouette.
    svgElement(document, 'ellipse', {
      cx: '11.5', cy: '52', rx: '5', ry: '14', transform: 'rotate(12 11.5 52)',
    }),
    svgElement(document, 'ellipse', {
      cx: '56.5', cy: '52', rx: '5', ry: '14', transform: 'rotate(-12 56.5 52)',
    }),
    // Solid body and head; the plates below carve the classic color blocking.
    svgElement(document, 'ellipse', { cx: '34', cy: '54', rx: '21', ry: '30' }),
    svgElement(document, 'ellipse', { cx: '31', cy: '16', rx: '13', ry: '13' }),
    // Beak and feet.
    svgElement(document, 'polygon', { points: '18,17 7,21 18,25' }),
    svgElement(document, 'polygon', { points: '22,84 31,84 33,90 19,90' }),
    svgElement(document, 'polygon', { points: '37,84 46,84 49,90 35,90' }),
  );

  // Night plates on top of the solid body, each closed by a hairline amber
  // contour so it separates from both the amber body and the dark surface.
  const plates = svgElement(document, 'g', {
    fill: 'var(--night)', stroke: 'var(--amber)', 'stroke-width': '1',
  });
  plates.append(
    svgElement(document, 'ellipse', { cx: '34', cy: '58', rx: '12', ry: '21' }),
    svgElement(document, 'ellipse', { cx: '27', cy: '18', rx: '8', ry: '7' }),
  );

  // The eye sits inside the face plate.
  const eye = svgElement(document, 'circle', { cx: '26', cy: '17', r: '1.8', fill: 'var(--amber)' });

  const dither = svgElement(document, 'g', { fill: 'var(--night)' });
  const addDot = (x, y) => dither.append(svgElement(document, 'rect', {
    x: String(x - 0.8), y: String(y - 0.8), width: '1.6', height: '1.6',
  }));
  // Feather shading: sparse night dots in the amber flank and back band.
  for (let y = 28; y <= 82; y += 3) {
    for (let x = 16; x <= 54; x += 3) {
      const body = ((x - 34) / 21) ** 2 + ((y - 54) / 30) ** 2;
      const belly = ((x - 34) / 12.5) ** 2 + ((y - 58) / 21.5) ** 2;
      if (body > 1 || body < 0.55 || belly <= 1.15) continue;
      if (((x + y * 2) / 3) % 4 !== 0) continue;
      addDot(x, y);
    }
  }
  // Head-cap shading: sparse dots on the back of the head.
  for (let y = 6; y <= 26; y += 3) {
    for (let x = 26; x <= 42; x += 3) {
      const head = ((x - 31) / 13) ** 2 + ((y - 16) / 13) ** 2;
      const face = ((x - 27) / 8.5) ** 2 + ((y - 18) / 7.5) ** 2;
      if (head > 1 || head < 0.45 || face <= 1.1) continue;
      if (((x + y) / 3) % 3 !== 0) continue;
      addDot(x, y);
    }
  }

  svg.append(ink, plates, eye, dither);
  return svg;
}

function createBotPaper(document) {
  const svg = svgElement(document, 'svg', {
    viewBox: '0 0 18 14',
    width: '18',
    height: '14',
    'aria-hidden': 'true',
    focusable: 'false',
  });
  svg.append(
    svgElement(document, 'rect', { width: '18', height: '14', fill: 'var(--night)' }),
    svgElement(document, 'rect', {
      x: '0.5', y: '0.5', width: '17', height: '13', fill: 'none', stroke: 'var(--amber)', 'stroke-width': '1',
    }),
    svgElement(document, 'rect', { x: '3', y: '3', width: '12', height: '1.5', fill: 'var(--amber)' }),
    svgElement(document, 'rect', { x: '3', y: '6.5', width: '12', height: '1.5', fill: 'var(--amber)' }),
    svgElement(document, 'rect', { x: '3', y: '10', width: '8', height: '1.5', fill: 'var(--amber)' }),
  );
  return svg;
}

function applyDesktopPreferences(root, preferences) {
  const frequency = Number.parseInt(preferences.syncFrequency, 10) || 60;
  const packetRate = preferences.packetDitherRate / 100;
  root.style.setProperty('--grid-size', `${preferences.gridDensity}px`);
  root.style.setProperty('--ui-duration', `${Math.round(12000 / frequency)}ms`);
  root.style.setProperty('--packet-opacity', String(0.15 + packetRate * 0.75));
  root.style.setProperty('--packet-duration', `${Math.round(1200 - packetRate * 900)}ms`);
  root.dataset.ditherOverlay = String(preferences.ditherOverlay);
  root.dataset.moireInterference = String(preferences.moireInterference);
  root.dataset.aliasedEdges = String(preferences.aliasedEdges);
  root.dataset.postProcess = preferences.postProcessFilter;
  root.dataset.protocol = preferences.protocolArchitecture.toLowerCase().replace('/', '-');
  root.dataset.encryption = preferences.encryptionLevel ? 'secure' : 'open';
}

function createSystemStatus(document, i18n, preferences) {
  const status = createElement(document, 'div', { 'data-system-status': '' });
  const language = createElement(document, 'div', {
    'data-language-controls': '',
    'aria-label': i18n.t('desktop.language'),
    role: 'group',
  });
  [['en', 'language.en'], ['zh-CN', 'language.zh'], ['ja', 'language.ja']].forEach(([locale, key]) => {
    language.append(createElement(document, 'button', {
      type: 'button',
      'data-locale': locale,
      'aria-pressed': String(i18n.locale === locale),
    }, i18n.t(key)));
  });
  const network = createElement(document, 'span', {
    'data-network-status': '',
    'aria-label': i18n.t('settings.signalProtocol'),
  });
  network.append(
    createElement(document, 'span', { 'data-packet-signal': '', 'aria-hidden': 'true' }, ':::.'),
    createElement(document, 'span', {}, `${preferences.protocolArchitecture} / ${i18n.t(
      preferences.encryptionLevel ? 'desktop.secure' : 'desktop.open',
    )}`),
  );
  status.append(
    language,
    network,
    createElement(document, 'span', { 'data-audio-status': '' }, (
      i18n.t(preferences.audioEnabled ? 'desktop.audioOn' : 'desktop.audioOff')
    )),
  );
  return status;
}

function getHorizontalRowIndex(index, key, length) {
  if (key === 'ArrowUp' || key === 'ArrowDown') return index;
  const direction = key === 'ArrowLeft' ? -1 : 1;
  return (index + direction + length) % length;
}

function getVerticalColumnIndex(index, key, length) {
  if (key === 'ArrowLeft' || key === 'ArrowRight') return index;
  const direction = key === 'ArrowUp' ? -1 : 1;
  return (index + direction + length) % length;
}

function getGridNextIndex(index, key, icons, columns) {
  const rows = Math.ceil(icons.length / columns);
  const row = index % rows;
  const col = Math.floor(index / rows);
  let nextRow = row;
  let nextCol = col;

  if (key === 'ArrowUp') nextRow = Math.max(0, row - 1);
  if (key === 'ArrowDown') nextRow = Math.min(rows - 1, row + 1);
  if (key === 'ArrowLeft') nextCol = Math.max(0, col - 1);
  if (key === 'ArrowRight') nextCol = Math.min(columns - 1, col + 1);

  const nextIndex = nextCol * rows + nextRow;
  if (nextIndex >= icons.length || nextIndex === index) return index;
  return nextIndex;
}

export function createDesktopController({
  root,
  apps,
  i18n,
  preferences,
  onOpen = () => {},
  onOpenFolderItem = () => {},
  onPreferenceChange = () => {},
  onBotNotice = () => {},
  onRender = () => {},
}) {
  const environment = root.ownerDocument.defaultView.navigator;
  let mode = detectDesktopMode(environment, preferences.layout);
  let selectedAppId = null;
  let lastIconClick = null;
  let expandedFolder = null;
  let botTimer = null;

  const activateBot = () => {
    const mount = root.querySelector('[data-bot-mount]');
    const bubble = mount?.querySelector('[data-bot-bubble]');
    const status = root.querySelector('[data-bot-status]');
    if (!mount || !bubble) return;
    if (botTimer !== null) clearTimeout(botTimer);
    bubble.textContent = isHotSpringHour() ? 'HOT SPRING: OPEN' : 'SPLASH';
    bubble.hidden = false;
    mount.dataset.botActive = 'true';
    if (status) status.textContent = i18n.t('bot.standby');
    onBotNotice();
    botTimer = setTimeout(() => {
      botTimer = null;
      if (!root.contains(bubble)) return;
      bubble.hidden = true;
      mount.dataset.botActive = 'false';
    }, 1200);
  };

  const setSelectedApp = (appId) => {
    selectedAppId = apps.some((app) => app.id === appId) ? appId : null;
    root.querySelectorAll('[data-app-icon]').forEach((icon) => {
      const selected = icon.dataset.appIcon === selectedAppId;
      icon.dataset.selected = String(selected);
      icon.setAttribute('aria-pressed', String(selected));
    });
  };

  const setExpandedFolder = (folderId) => {
    expandedFolder = folderId;
    root.querySelectorAll('[data-desktop-folder]').forEach((folder) => {
      const expanded = folder.dataset.desktopFolder === folderId;
      folder.dataset.expanded = String(expanded);
      folder.querySelector('[data-folder-toggle]').setAttribute('aria-expanded', String(expanded));
      const stamps = folder.querySelector('[data-folder-stamps]');
      if (expanded) stamps.removeAttribute('inert');
      else stamps.setAttribute('inert', '');
    });
  };

  const getEventIcon = (event) => {
    const icon = event.target.closest('[data-app-icon]');
    return icon && root.contains(icon) ? icon : null;
  };

  root.addEventListener('click', (event) => {
    const localeButton = event.target.closest('[data-locale]');
    if (localeButton && root.contains(localeButton)) {
      onPreferenceChange({ locale: localeButton.dataset.locale });
      return;
    }

    const botButton = event.target.closest('[data-bot-standby]');
    if (botButton && root.contains(botButton)) {
      activateBot();
      return;
    }

    const folderToggle = event.target.closest('[data-folder-toggle]');
    if (folderToggle && root.contains(folderToggle)) {
      const folderId = folderToggle.dataset.folderToggle;
      setExpandedFolder(expandedFolder === folderId ? null : folderId);
      return;
    }

    const stamp = event.target.closest('[data-stamp]');
    if (stamp && root.contains(stamp)) {
      setExpandedFolder(null);
      onOpenFolderItem(stamp.dataset.stampFolder, stamp.dataset.stamp);
      return;
    }

    if (expandedFolder && !event.target.closest('[data-desktop-folders]')) {
      setExpandedFolder(null);
    }

    const icon = getEventIcon(event);
    if (!icon) return;
    setSelectedApp(icon.dataset.appIcon);
    if (icon.closest('[data-taskbar-pins]')) {
      onOpen(icon.dataset.appIcon);
      return;
    }
    const usesSingleTap = (
      root.ownerDocument.defaultView.matchMedia('(pointer: coarse)').matches
      || root.ownerDocument.defaultView.matchMedia('(max-width: 760px)').matches
    );
    if (usesSingleTap) {
      onOpen(icon.dataset.appIcon);
      return;
    }

    const now = performance.now();
    const withinDistance = lastIconClick
      && Math.hypot(event.clientX - lastIconClick.x, event.clientY - lastIconClick.y) <= 8;
    if (
      lastIconClick?.appId === icon.dataset.appIcon
      && now - lastIconClick.time <= preferences.doubleClickThreshold
      && withinDistance
    ) {
      lastIconClick = null;
      onOpen(icon.dataset.appIcon);
      return;
    }
    lastIconClick = { appId: icon.dataset.appIcon, time: now, x: event.clientX, y: event.clientY };
  });

  root.addEventListener('keydown', (event) => {
    const stamp = event.target.closest('[data-stamp]');
    if (stamp && root.contains(stamp)) {
      if (event.key === 'Escape') {
        event.preventDefault();
        const folderId = stamp.dataset.stampFolder;
        setExpandedFolder(null);
        root.querySelector(`[data-folder-toggle="${folderId}"]`)?.focus();
        return;
      }
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      const stamps = [...stamp.parentElement.querySelectorAll('[data-stamp]')];
      const nextIndex = getHorizontalRowIndex(
        stamps.indexOf(stamp), event.key, stamps.length,
      );
      stamps[nextIndex].focus();
      return;
    }

    const folderToggle = event.target.closest('[data-folder-toggle]');
    if (folderToggle && root.contains(folderToggle)) {
      if (event.key === 'Escape') {
        event.preventDefault();
        setExpandedFolder(null);
        return;
      }
      if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
      event.preventDefault();
      const toggles = [...root.querySelectorAll('[data-folder-toggle]')];
      const nextIndex = getVerticalColumnIndex(
        toggles.indexOf(folderToggle), event.key, toggles.length,
      );
      toggles[nextIndex].focus();
      return;
    }

    const icon = getEventIcon(event);
    if (!icon) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      setSelectedApp(icon.dataset.appIcon);
      onOpen(icon.dataset.appIcon);
      return;
    }

    const arrowKeys = new Set(['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown']);
    if (!arrowKeys.has(event.key)) return;
    event.preventDefault();
    const icons = [...icon.parentElement.querySelectorAll('[data-app-icon]')];
    const currentIndex = icons.indexOf(icon);
    let nextIndex;
    if (icon.closest('[data-windows-icons]')) {
      nextIndex = getGridNextIndex(currentIndex, event.key, icons, 2);
    } else {
      nextIndex = getHorizontalRowIndex(currentIndex, event.key, icons.length);
    }
    const nextIcon = icons[nextIndex];
    setSelectedApp(nextIcon.dataset.appIcon);
    nextIcon.focus();
  });

  const render = () => {
    const document = root.ownerDocument;
    if (botTimer !== null) {
      clearTimeout(botTimer);
      botTimer = null;
    }
    applyDesktopPreferences(root, preferences);
    const appIds = new Set(apps.map(({ id }) => id));
    const stampIcons = (templateSelector) => {
      const template = document.querySelector(templateSelector);
      if (!template) throw new Error(`Missing app icon template: ${templateSelector}`);
      const fragment = template.content.cloneNode(true);
      fragment.querySelectorAll('[data-app-icon]').forEach((icon) => {
        if (!appIds.has(icon.dataset.appIcon)) {
          icon.remove();
          return;
        }
        const app = apps.find(({ id }) => id === icon.dataset.appIcon);
        icon.querySelector('[data-app-label]').textContent = i18n.t(app.titleKey);
        icon.setAttribute('aria-label', i18n.t(app.titleKey));
        icon.dataset.selected = String(app.id === selectedAppId);
        icon.setAttribute('aria-pressed', String(app.id === selectedAppId));
      });
      return fragment;
    };
    const windowLayer = root.querySelector(':scope > [data-window-layer]');

    const windowsTaskbar = createElement(document, 'footer', { 'data-windows-taskbar': '' });
    windowsTaskbar.append(
      createElement(document, 'button', { type: 'button', 'data-windows-start': '' }, '[OS]'),
    );
    if (mode === 'windows') {
      const pins = createElement(document, 'div', {
        'data-taskbar-pins': '',
        role: 'group',
        'aria-label': i18n.t('site.title'),
      });
      pins.append(stampIcons('[data-app-icon-template]'));
      windowsTaskbar.append(pins);
    }
    windowsTaskbar.append(
      createElement(document, 'p', { 'data-system-title': '' }, i18n.t('site.title')),
      createSystemStatus(document, i18n, preferences),
    );

    const macosMenu = createElement(document, 'header', { 'data-macos-menu': '' });
    macosMenu.append(
      createElement(document, 'span', { 'data-macos-mark': '', 'aria-hidden': 'true' }, '*'),
      createElement(document, 'p', { 'data-system-title': '' }, i18n.t('site.title')),
      createSystemStatus(document, i18n, preferences),
    );

    const foldersElement = renderDesktopFolders({ document, i18n, expandedFolder });

    const bot = createElement(document, 'aside', { 'data-bot-mount': '' });
    const botBubble = createElement(document, 'span', {
      'data-bot-bubble': '', 'aria-hidden': 'true',
    });
    botBubble.hidden = true;
    const botButton = createElement(document, 'button', {
      type: 'button', 'data-bot-standby': '', 'aria-label': i18n.t('bot.standby'),
    });
    botButton.append(createPenguinSprite(document));
    const botPaper = createElement(document, 'span', { 'data-bot-paper': '', 'aria-hidden': 'true' });
    botPaper.append(createBotPaper(document));
    bot.append(
      botBubble,
      ...(isHotSpringHour()
        ? [createElement(document, 'span', { 'data-bot-steam': '', 'aria-hidden': 'true' }, '~ ~')]
        : []),
      botButton,
      botPaper,
      createElement(document, 'span', {
        'data-bot-status': '', role: 'status', 'aria-live': 'polite',
      }),
    );

    const macosDock = createElement(document, 'footer', {
      'data-macos-dock': '',
      'aria-label': 'Dock',
    });
    if (mode === 'macos') {
      const dockIcons = createElement(document, 'div', {
        'data-dock-icons': '',
        role: 'group',
        'aria-label': 'Dock',
      });
      dockIcons.append(stampIcons('[data-app-icon-template]'));
      macosDock.append(dockIcons);
    }

    let windowsIcons = null;
    if (mode === 'windows') {
      windowsIcons = createElement(document, 'div', {
        'data-windows-icons': '',
        role: 'group',
        'aria-label': i18n.t('site.title'),
      });
      const iconOrder = ['settings', 'projects', 'writing', 'about', 'contact'];
      const fragment = stampIcons('[data-app-icon-template]');
      const icons = [...fragment.querySelectorAll('[data-app-icon]')];
      icons.sort((a, b) => iconOrder.indexOf(a.dataset.appIcon) - iconOrder.indexOf(b.dataset.appIcon));
      windowsIcons.append(...icons);
    }

    root.replaceChildren(macosMenu, foldersElement, windowsIcons, bot, windowsTaskbar, macosDock);
    if (windowLayer) root.append(windowLayer);
    root.dataset.desktopMode = mode;
    onRender({ root, mode });
    return root;
  };

  i18n.subscribe(() => {
    queueMicrotask(() => {
      if (!root.hidden) render();
    });
  });

  return {
    render,
    setMode(nextMode) {
      if (!MODES.has(nextMode)) throw new Error(`Unsupported desktop mode: ${nextMode}`);
      onPreferenceChange({ layout: nextMode });
    },
    syncPreferences(patch = {}) {
      mode = detectDesktopMode(environment, preferences.layout);
      applyDesktopPreferences(root, preferences);
      if (Object.keys(patch).some((key) => RENDER_PREFERENCES.has(key))) render();
    },
    setSelectedApp,
  };
}
