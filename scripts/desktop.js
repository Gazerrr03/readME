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

export function createDesktopController({
  root,
  apps,
  i18n,
  content = () => ({ photos: [], tracks: [] }),
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
      const status = root.querySelector('[data-bot-status]');
      if (status) status.textContent = i18n.t('bot.standby');
      onBotNotice();
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
    const nextIndex = getHorizontalRowIndex(icons.indexOf(icon), event.key, icons.length);
    const nextIcon = icons[nextIndex];
    setSelectedApp(nextIcon.dataset.appIcon);
    nextIcon.focus();
  });

  const render = () => {
    const document = root.ownerDocument;
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

    const foldersElement = renderDesktopFolders({ document, i18n, content, expandedFolder });

    const bot = createElement(document, 'aside', { 'data-bot-mount': '' });
    bot.append(
      createElement(document, 'button', {
        type: 'button', 'data-bot-standby': '', 'aria-label': i18n.t('bot.standby'),
      }, i18n.t('bot.label')),
      createElement(document, 'span', { 'data-bot-label': '' }, i18n.t('bot.standby')),
      createElement(document, 'span', {
        'data-bot-status': '', role: 'status', 'aria-live': 'polite',
      }),
    );

    const macosDock = createElement(document, 'footer', {
      'data-macos-dock': '',
      'aria-label': i18n.t('desktop.dock'),
    });
    if (mode === 'macos') {
      const dockIcons = createElement(document, 'div', {
        'data-dock-icons': '',
        role: 'group',
        'aria-label': i18n.t('desktop.dock'),
      });
      dockIcons.append(stampIcons('[data-app-icon-template]'));
      macosDock.append(dockIcons);
    }

    root.replaceChildren(macosMenu, foldersElement, bot, windowsTaskbar, macosDock);
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
