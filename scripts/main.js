import { createBootController } from './boot.js';
import { createAudioService } from './audio.js';
import { getApps } from './apps/app-registry.js';
import { renderAboutApp } from './apps/about-app.js';
import { renderAlbumsApp } from './apps/albums-app.js';
import { renderBooksApp } from './apps/books-app.js';
import { renderContactApp } from './apps/contact-app.js';
import { renderGamesApp } from './apps/games-app.js';
import { renderPhotosApp } from './apps/photos-app.js';
import { renderPlaceholderApp } from './apps/placeholder-app.js';
import { renderProjectsApp } from './apps/projects-app.js';
import { renderSettingsApp } from './apps/settings-app.js';
import { renderWritingApp } from './apps/writing-app.js';
import { createDesktopController } from './desktop.js';
import { createDesktopEnvironmentController } from './environment/environment-controller.js';
import { createI18n } from './i18n/i18n.js';
import { readDesktopTarget } from './routing/content-routes.js';
import { loadPreferences, savePreferences } from './state/preferences.js';
import { createWindowManager } from './window-manager.js';

const preferences = loadPreferences(localStorage);
export const i18n = createI18n(preferences.locale);
const bootRoot = document.querySelector('[data-boot-root]');
const desktopRoot = document.querySelector('[data-desktop-root]');
const persistPreferences = (next) => savePreferences(localStorage, next);
const apps = getApps();
const audio = createAudioService(preferences.audioEnabled);
let windowManager;
let boot;
let updatePreferences;
let pendingOpen = readDesktopTarget(location.search);
const openApp = (appId) => {
  audio.play('window');
  windowManager.open(appId);
};
const environment = createDesktopEnvironmentController({
  root: desktopRoot,
  i18n,
  onOpen: openApp,
});
export const desktop = createDesktopController({
  root: desktopRoot,
  apps,
  i18n,
  preferences,
  onOpen: openApp,
  onOpenFolder: (folderId) => openApp(folderId),
  onPreferenceChange: (patch) => updatePreferences(patch),
  onBotNotice: () => audio.play('notice'),
  onRender: ({ mode }) => environment.sync({ mode }),
});
windowManager = createWindowManager({
  root: desktopRoot,
  taskSurface: desktopRoot,
  registry: apps,
  i18n,
  preferences,
  renderers: {
    placeholder: renderPlaceholderApp,
    projects: renderProjectsApp,
    writing: renderWritingApp,
    about: renderAboutApp,
    contact: renderContactApp,
    photos: renderPhotosApp,
    albums: renderAlbumsApp,
    games: renderGamesApp,
    books: renderBooksApp,
    settings: (context) => renderSettingsApp({
      ...context,
      preferences,
      updatePreferences,
      replayBoot,
    }),
  },
});

updatePreferences = (patch) => {
  Object.assign(preferences, patch);
  persistPreferences(preferences);
  if (patch.audioEnabled !== undefined) audio.setEnabled(preferences.audioEnabled);
  if (patch.locale !== undefined) i18n.setLocale(preferences.locale);
  desktop.syncPreferences(patch);
  requestAnimationFrame(() => windowManager.reclamp());
};
const revealDesktop = () => {
  if (!desktopRoot.dataset.desktopMode) desktop.render();
  desktopRoot.hidden = false;
  desktopRoot.dataset.ready = 'true';
  requestAnimationFrame(() => environment.sync({ mode: desktopRoot.dataset.desktopMode }));
  const target = pendingOpen;
  pendingOpen = null;
  if (target) requestAnimationFrame(() => openApp(target));
};

document.documentElement.lang = i18n.locale;
document.title = i18n.t('site.title');
i18n.subscribe(() => {
  document.documentElement.lang = i18n.locale;
  document.title = i18n.t('site.title');
});

boot = createBootController({
  root: bootRoot,
  i18n,
  preferences,
  persistPreferences,
  onComplete: revealDesktop,
});

export function replayBoot() {
  audio.play('boot');
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
