const createApp = (id, titleKey, icon, width, height, renderer) => Object.freeze({
  id,
  titleKey,
  icon,
  defaultSize: Object.freeze({ width, height }),
  renderer,
});

const apps = Object.freeze([
  createApp('projects', 'apps.projects', 'folder', 520, 360, 'placeholder'),
  createApp('writing', 'apps.writing', 'document', 520, 360, 'placeholder'),
  createApp('about', 'apps.about', 'identity', 480, 340, 'placeholder'),
  createApp('contact', 'apps.contact', 'signal', 480, 340, 'placeholder'),
  createApp('settings', 'apps.settings', 'controls', 900, 600, 'settings'),
]);

export const APP_REGISTRY = apps;
export const getApps = () => apps.slice();
export const getApp = (id) => apps.find((app) => app.id === id) ?? null;
