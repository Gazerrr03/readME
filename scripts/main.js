import { createBootController } from './boot.js';
import { createI18n } from './i18n/i18n.js';
import { loadPreferences, savePreferences } from './state/preferences.js';

const preferences = loadPreferences(localStorage);
const i18n = createI18n(preferences.locale);
const bootRoot = document.querySelector('[data-boot-root]');
const desktopRoot = document.querySelector('[data-desktop-root]');
const persistPreferences = (next) => savePreferences(localStorage, next);
const revealDesktop = () => {
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

const skipBootForTests = new URLSearchParams(location.search).get('skipBoot') === '1';
if (skipBootForTests) {
  bootRoot.hidden = true;
  revealDesktop();
} else {
  boot.start();
}
