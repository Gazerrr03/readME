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

const BOT_ANIMATIONS = Object.freeze({
  idle: Object.freeze({ row: 0, frames: 6, frameDuration: 180 }),
  'running-right': Object.freeze({ row: 1, frames: 8, frameDuration: 95 }),
  'running-left': Object.freeze({ row: 2, frames: 8, frameDuration: 95 }),
  waving: Object.freeze({ row: 3, frames: 4, frameDuration: 135 }),
  jumping: Object.freeze({ row: 4, frames: 5, frameDuration: 120 }),
  failed: Object.freeze({ row: 5, frames: 8, frameDuration: 120 }),
  waiting: Object.freeze({ row: 6, frames: 6, frameDuration: 220 }),
  running: Object.freeze({ row: 7, frames: 6, frameDuration: 100 }),
  review: Object.freeze({ row: 8, frames: 6, frameDuration: 180 }),
});

const SVG_NS = 'http://www.w3.org/2000/svg';

function svgElement(document, tagName, attributes = {}) {
  const element = document.createElementNS(SVG_NS, tagName);
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
  return element;
}

function createPenguinSprite(document) {
  return createElement(document, 'span', {
    'data-bot-sprite': '',
    'aria-hidden': 'true',
  });
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
    svgElement(document, 'rect', { width: '18', height: '14', fill: 'var(--white)' }),
    svgElement(document, 'rect', { x: '3', y: '3', width: '12', height: '1.5', fill: 'var(--blue)' }),
    svgElement(document, 'rect', { x: '3', y: '6.5', width: '12', height: '1.5', fill: 'var(--blue)' }),
    svgElement(document, 'rect', { x: '3', y: '10', width: '8', height: '1.5', fill: 'var(--blue)' }),
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
  onOpenFolder = () => {},
  onPreferenceChange = () => {},
  onBotNotice = () => {},
  onRender = () => {},
}) {
  const environment = root.ownerDocument.defaultView.navigator;
  let mode = detectDesktopMode(environment, preferences.layout);
  let selectedAppId = null;
  let lastIconClick = null;
  let botTimer = null;
  let botAnimationTimer = null;
  let botAnimationToken = 0;
  let botGlitchTimer = null;
  let botGlitchIndex = 0;

  const getBotSprite = () => root.querySelector('[data-bot-sprite]');

  const prefersReducedMotion = () => root.ownerDocument.defaultView
    .matchMedia('(prefers-reduced-motion: reduce)').matches;

  const stopBotAnimation = () => {
    if (botAnimationTimer !== null) {
      clearTimeout(botAnimationTimer);
      botAnimationTimer = null;
    }
    botAnimationToken += 1;
  };

  const setBotFrame = (sprite, state, frame) => {
    const animation = BOT_ANIMATIONS[state] ?? BOT_ANIMATIONS.idle;
    sprite.dataset.botState = state;
    sprite.dataset.botFrame = String(frame);
    sprite.style.setProperty('--bot-row', String(animation.row));
    sprite.style.setProperty('--bot-frame', String(frame));
  };

  const playBotState = (state, {
    loop = true,
    onComplete = null,
    force = false,
  } = {}) => {
    const sprite = getBotSprite();
    const animation = BOT_ANIMATIONS[state] ?? BOT_ANIMATIONS.idle;
    if (!sprite) return;
    if (prefersReducedMotion()) {
      stopBotAnimation();
      setBotFrame(sprite, 'idle', 0);
      return;
    }
    if (!force && sprite.dataset.botState === state) return;

    stopBotAnimation();
    const token = botAnimationToken;
    let frame = 0;
    const tick = () => {
      if (token !== botAnimationToken || !root.contains(sprite)) return;
      setBotFrame(sprite, state, frame);
      frame += 1;
      if (frame >= animation.frames) {
        if (!loop) {
          botAnimationTimer = null;
          onComplete?.();
          return;
        }
        frame = 0;
      }
      botAnimationTimer = setTimeout(tick, animation.frameDuration);
    };
    tick();
  };

  const getBotRestState = () => {
    const writingWindow = root.querySelector('[data-app-window="writing"]');
    return writingWindow && !writingWindow.hidden ? 'review' : 'idle';
  };

  const settleBot = () => playBotState(getBotRestState());

  const clearBotGlitch = () => {
    if (botGlitchTimer !== null) {
      clearTimeout(botGlitchTimer);
      botGlitchTimer = null;
    }
    root.querySelector('[data-bot-standby]')?.removeAttribute('data-bot-glitch');
  };

  const triggerBotGlitch = (botButton) => {
    if (prefersReducedMotion()) return;
    clearBotGlitch();
    const modes = ['contour', 'dots', 'blocks'];
    botButton.dataset.botGlitch = modes[botGlitchIndex % modes.length];
    botGlitchIndex += 1;
    botGlitchTimer = setTimeout(() => {
      botGlitchTimer = null;
      botButton.removeAttribute('data-bot-glitch');
    }, 320);
  };

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
    playBotState('jumping', {
      force: true,
      loop: false,
      onComplete: () => playBotState('waiting', { force: true }),
    });
    botTimer = setTimeout(() => {
      botTimer = null;
      if (!root.contains(bubble)) return;
      bubble.hidden = true;
      mount.dataset.botActive = 'false';
      settleBot();
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

  const clearAppSelection = () => {
    lastIconClick = null;
    setSelectedApp(null);
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
      onOpenFolder(folderToggle.dataset.folderToggle);
      return;
    }

    const icon = getEventIcon(event);
    if (!icon) {
      if (event.target === root) clearAppSelection();
      return;
    }
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

  root.addEventListener('pointerover', (event) => {
    const botButton = event.target.closest('[data-bot-standby]');
    if (!botButton || !root.contains(botButton) || botButton.contains(event.relatedTarget)) return;
    if (!root.ownerDocument.defaultView.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const mount = botButton.closest('[data-bot-mount]');
    if (mount?.dataset.botActive === 'true') return;
    triggerBotGlitch(botButton);
    playBotState('waving', { force: true, loop: false, onComplete: settleBot });
  });

  root.addEventListener('pointerout', (event) => {
    const botButton = event.target.closest('[data-bot-standby]');
    if (!botButton || !root.contains(botButton) || botButton.contains(event.relatedTarget)) return;
    const mount = botButton.closest('[data-bot-mount]');
    if (mount?.dataset.botActive !== 'true') settleBot();
  });

  root.addEventListener('keydown', (event) => {
    const folderToggle = event.target.closest('[data-folder-toggle]');
    if (folderToggle && root.contains(folderToggle)) {
      if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
      event.preventDefault();
      const toggles = [...root.querySelectorAll('[data-folder-toggle]')];
      const nextIndex = getGridNextIndex(toggles.indexOf(folderToggle), event.key, toggles, 2);
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

  const MutationObserver = root.ownerDocument.defaultView.MutationObserver;
  const botWindowObserver = MutationObserver ? new MutationObserver(() => {
    const mount = root.querySelector('[data-bot-mount]');
    if (mount?.dataset.botActive !== 'true') settleBot();
  }) : null;
  botWindowObserver?.observe(root, {
    attributes: true,
    attributeFilter: ['hidden'],
    childList: true,
    subtree: true,
  });

  const render = () => {
    const document = root.ownerDocument;
    if (botTimer !== null) {
      clearTimeout(botTimer);
      botTimer = null;
    }
    clearBotGlitch();
    stopBotAnimation();
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

    const foldersElement = renderDesktopFolders({ document, i18n });

    const bot = createElement(document, 'aside', {
      'data-bot-mount': '',
      'data-bot-pet': 'pen-pen',
    });
    const botBubble = createElement(document, 'span', {
      'data-bot-bubble': '', 'aria-hidden': 'true',
    });
    botBubble.hidden = true;
    const botButton = createElement(document, 'button', {
      type: 'button', 'data-bot-standby': '', 'aria-label': i18n.t('bot.standby'),
    });
    botButton.append(
      createPenguinSprite(document),
      createElement(document, 'span', { 'data-bot-glitch-layer': '', 'aria-hidden': 'true' }),
    );
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
    settleBot();
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
