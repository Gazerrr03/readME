const createApp = (id, titleKey, icon, width, height, renderer) => Object.freeze({
  id,
  titleKey,
  icon,
  defaultSize: Object.freeze({ width, height }),
  renderer,
});

const apps = Object.freeze([
  createApp('projects', 'apps.projects', 'folder', 720, 440, 'projects'),
  createApp('writing', 'apps.writing', 'document', 560, 420, 'writing'),
  createApp('about', 'apps.about', 'identity', 520, 420, 'about'),
  createApp('contact', 'apps.contact', 'signal', 480, 360, 'contact'),
  createApp('settings', 'apps.settings', 'controls', 900, 600, 'settings'),
  createApp('photos', 'apps.photos', 'stamp-folder-photos', 480, 430, 'photos'),
  createApp('albums', 'apps.albums', 'stamp-folder-albums', 380, 440, 'albums'),
  createApp('games', 'apps.games', 'folder-games', 620, 460, 'games'),
  createApp('books', 'apps.books', 'folder-books', 760, 560, 'books'),
]);

export const APP_REGISTRY = apps;
export const getApps = () => apps.slice();
export const getApp = (id) => apps.find((app) => app.id === id) ?? null;
