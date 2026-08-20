import { createBootController } from './boot.js';
import { createAudioService } from './audio.js';
import { getApps } from '../modules/app-registry.js';
import { renderAboutApp } from '../modules/base-buttons/about/about-app.js';
import { renderAlbumsApp } from '../modules/interactive-buttons/albums/albums-app.js';
import { renderBooksApp } from '../modules/interactive-buttons/books/books-app.js';
import { renderContactApp } from '../modules/base-buttons/contact/contact-app.js';
import { renderGamesApp } from '../modules/interactive-buttons/games/games-app.js';
import { renderPhotosApp } from '../modules/interactive-buttons/photos/photos-app.js';
import { renderPlaceholderApp } from '../modules/shared/placeholder-app.js';
import { renderProjectsApp } from '../modules/base-buttons/projects/projects-app.js';
import { renderSettingsApp } from '../modules/base-buttons/design/settings-app.js';
import { renderWritingApp } from '../modules/base-buttons/writing/writing-app.js';
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
  initialWallpaperId: preferences.wallpaperId,
  storage: localStorage,
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
const applyWallpaper = async (id) => {
  const result = await environment.applyWallpaper(id);
  if (result.ok) updatePreferences({ wallpaperId: result.id });
  return result;
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
