import { GAMES } from './data.js';
import { createFolderBrowser } from '../shared/folder-browser.js';

export { GAMES };

export function renderGamesApp({ i18n, mount, preferences, host }) {
  const document = mount.ownerDocument;
  let disconnectViewer = () => {};
  const root = createFolderBrowser({
    document,
    i18n,
    appId: 'games',
    titleKey: 'apps.games',
    items: GAMES,
    renderItem: ({ item }) => {
      const art = document.createElement('img');
      art.src = item.cover;
      art.alt = '';
      art.width = 640;
      art.height = 400;
      art.dataset.gameCover = '';
      const title = document.createElement('strong');
      title.textContent = item.title[i18n.locale];
      const genre = document.createElement('span');
      genre.textContent = item.genre[i18n.locale];
      const edition = document.createElement('small');
      edition.textContent = '01 / MOSSLIGHT';
      return [art, edition, title, genre];
    },
    renderViewer: ({ item }) => {
      disconnectViewer();
      const frame = document.createElement('iframe');
      frame.dataset.gameFrame = item.slug;
      frame.src = `${item.url}?lang=${encodeURIComponent(i18n.locale)}`;
      frame.title = item.title[i18n.locale];
      frame.allow = 'fullscreen';
      const view = document.defaultView;
      const sendVisibility = () => {
        const appWindow = frame.closest('[data-app-window]');
        frame.contentWindow?.postMessage({
          type: 'mosslight:visibility',
          active: Boolean(appWindow && !appWindow.hidden && appWindow.dataset.windowActive === 'true'),
        }, view.location.origin);
      };
      const ready = event => {
        if (event.origin !== view.location.origin || event.source !== frame.contentWindow) return;
        if (event.data?.type === 'mosslight:ready') sendVisibility();
        if (event.data?.type === 'mosslight:focus') {
          const appWindow = frame.closest('[data-app-window]');
          if (appWindow && !appWindow.hidden && appWindow.dataset.windowActive !== 'true') host?.focus();
        }
      };
      const observer = new view.MutationObserver(() => {
        if (!frame.isConnected) disconnectViewer();
        else sendVisibility();
      });
      view.addEventListener('message', ready);
      frame.addEventListener('load', sendVisibility);
      queueMicrotask(() => {
        if (frame.isConnected) observer.observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ['hidden', 'data-window-active'] });
      });
      disconnectViewer = () => {
        observer.disconnect();
        view.removeEventListener('message', ready);
        frame.removeEventListener('load', sendVisibility);
      };
      return frame;
    },
    emptyKey: 'games.empty',
    doubleClickThreshold: preferences?.doubleClickThreshold,
    onBeforeBack: () => disconnectViewer(),
  });
  root.dataset.gamesApp = '';
  return root;
}
