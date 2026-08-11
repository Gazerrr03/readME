const MODES = new Set(['windows', 'macos']);

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
  status.append(
    language,
    createElement(document, 'span', { 'data-audio-status': '' }, (
      i18n.t(preferences.audioEnabled ? 'desktop.audioOn' : 'desktop.audioOff')
    )),
  );
  return status;
}

function getWindowsGridIndex(index, key, length) {
  if (key === 'ArrowLeft') return index % 2 === 1 ? index - 1 : index;
  if (key === 'ArrowRight') return index % 2 === 0 && index + 1 < length ? index + 1 : index;

  const step = key === 'ArrowUp' ? -2 : 2;
  const target = index + step;
  if (target >= 0 && target < length) return target;
  const column = index % 2;
  const columnIndexes = Array.from({ length }, (_, appIndex) => appIndex)
    .filter((appIndex) => appIndex % 2 === column);
  return key === 'ArrowUp' ? columnIndexes.at(-1) : columnIndexes[0];
}

function getMacosDockIndex(index, key, length) {
  if (key === 'ArrowUp' || key === 'ArrowDown') return index;
  const direction = key === 'ArrowLeft' ? -1 : 1;
  return (index + direction + length) % length;
}

export function createDesktopController({
  root,
  apps,
  i18n,
  preferences,
  onOpen = () => {},
  onPreferenceChange = () => {},
  onBotNotice = () => {},
}) {
  const environment = root.ownerDocument.defaultView.navigator;
  let mode = detectDesktopMode(environment, preferences.layout);
  let selectedAppId = null;

  const setSelectedApp = (appId) => {
    selectedAppId = apps.some((app) => app.id === appId) ? appId : null;
    root.querySelectorAll('[data-app-icon]').forEach((icon) => {
      const selected = icon.dataset.appIcon === selectedAppId;
      icon.dataset.selected = String(selected);
      icon.setAttribute('aria-pressed', String(selected));
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

    const icon = getEventIcon(event);
    if (!icon) return;
    setSelectedApp(icon.dataset.appIcon);
    if (
      root.ownerDocument.defaultView.matchMedia('(pointer: coarse)').matches
      || root.ownerDocument.defaultView.matchMedia('(max-width: 760px)').matches
    ) {
      onOpen(icon.dataset.appIcon);
    }
  });

  root.addEventListener('dblclick', (event) => {
    const icon = getEventIcon(event);
    if (!icon || (
      root.ownerDocument.defaultView.matchMedia('(pointer: coarse)').matches
      || root.ownerDocument.defaultView.matchMedia('(max-width: 760px)').matches
    )) return;
    onOpen(icon.dataset.appIcon);
  });

  root.addEventListener('keydown', (event) => {
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
    const icons = [...root.querySelectorAll('[data-app-icon]')];
    const currentIndex = icons.indexOf(icon);
    const nextIndex = mode === 'windows'
      ? getWindowsGridIndex(currentIndex, event.key, icons.length)
      : getMacosDockIndex(currentIndex, event.key, icons.length);
    const nextIcon = icons[nextIndex];
    setSelectedApp(nextIcon.dataset.appIcon);
    nextIcon.focus();
  });

  const render = () => {
    const document = root.ownerDocument;
    const template = document.querySelector('[data-app-icon-template]');
    if (!template) throw new Error('Missing app icon template');
    const windowLayer = root.querySelector(':scope > [data-window-layer]');

    const windowsTaskbar = createElement(document, 'footer', { 'data-windows-taskbar': '' });
    windowsTaskbar.append(
      createElement(document, 'button', { type: 'button', 'data-windows-start': '' }, '[OS]'),
      createElement(document, 'p', { 'data-system-title': '' }, i18n.t('site.title')),
      createSystemStatus(document, i18n, preferences),
    );

    const macosMenu = createElement(document, 'header', { 'data-macos-menu': '' });
    macosMenu.append(
      createElement(document, 'span', { 'data-macos-mark': '', 'aria-hidden': 'true' }, '*'),
      createElement(document, 'p', { 'data-system-title': '' }, i18n.t('site.title')),
      createSystemStatus(document, i18n, preferences),
    );

    const iconList = createElement(document, 'div', {
      'data-desktop-icons': '',
      role: 'group',
      'aria-label': i18n.t('site.title'),
    });
    const icons = template.content.cloneNode(true);
    const appIds = new Set(apps.map(({ id }) => id));
    icons.querySelectorAll('[data-app-icon]').forEach((icon) => {
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
    iconList.append(icons);

    const bot = createElement(document, 'aside', { 'data-bot-mount': '' });
    bot.append(
      createElement(document, 'button', {
        type: 'button', 'data-bot-standby': '', 'aria-label': i18n.t('bot.standby'),
      }, 'BOT'),
      createElement(document, 'span', { 'data-bot-label': '' }, i18n.t('bot.standby')),
      createElement(document, 'span', {
        'data-bot-status': '', role: 'status', 'aria-live': 'polite',
      }),
    );

    const macosDock = createElement(document, 'footer', {
      'data-macos-dock': '',
      'aria-label': 'Dock',
    });
    macosDock.append(iconList);

    root.replaceChildren(macosMenu, bot, windowsTaskbar, macosDock);
    if (windowLayer) root.append(windowLayer);
    root.dataset.desktopMode = mode;
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
    syncPreferences() {
      mode = detectDesktopMode(environment, preferences.layout);
      render();
    },
    setSelectedApp,
  };
}
