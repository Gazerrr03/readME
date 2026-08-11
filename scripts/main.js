import { createBootController } from './boot.js';
import { getApps } from './apps/app-registry.js';
import { createDesktopController } from './desktop.js';
import { createI18n } from './i18n/i18n.js';
import { loadPreferences, savePreferences } from './state/preferences.js';
import { createWindowManager } from './window-manager.js';

const preferences = loadPreferences(localStorage);
export const i18n = createI18n(preferences.locale);
const bootRoot = document.querySelector('[data-boot-root]');
const desktopRoot = document.querySelector('[data-desktop-root]');
const persistPreferences = (next) => savePreferences(localStorage, next);
const apps = getApps();
let windowManager;
const desktop = createDesktopController({
  root: desktopRoot,
  apps,
  i18n,
  preferences,
  onOpen: (appId) => windowManager.open(appId),
  onPreferenceChange: persistPreferences,
});
const renderPendingApp = ({ i18n: appI18n }) => {
  const placeholder = document.createElement('p');
  placeholder.dataset.windowPlaceholder = '';
  placeholder.textContent = appI18n.t('windows.comingSoon');
  return placeholder;
};
windowManager = createWindowManager({
  root: desktopRoot,
  taskSurface: desktopRoot,
  registry: apps,
  i18n,
  renderers: {
    placeholder: renderPendingApp,
    settings: renderPendingApp,
  },
});
const revealDesktop = () => {
  if (!desktopRoot.dataset.desktopMode) desktop.render();
  desktopRoot.hidden = false;
  desktopRoot.dataset.ready = 'true';
};

document.documentElement.lang = i18n.locale;
document.title = i18n.t('site.title');

const boot = createBootController({
  root: bootRoot,
  i18n,
  preferences,
  persistPreferences,
  onComplete: revealDesktop,
});

export function replayBoot() {
  desktopRoot.hidden = true;
  boot.replay();
}

const skipBootForTests = new URLSearchParams(location.search).get('skipBoot') === '1';
if (skipBootForTests) {
  bootRoot.hidden = true;
  revealDesktop();
} else {
  boot.start();
}
