import { GAMES } from '../data/collections.js';
import { createFolderBrowser } from './folder-browser.js';

export { GAMES };

export function renderGamesApp({ i18n, mount, preferences }) {
  const document = mount.ownerDocument;
  const root = createFolderBrowser({
    document,
    i18n,
    appId: 'games',
    titleKey: 'apps.games',
    items: GAMES,
    renderItem: () => null,
    renderViewer: () => document.createElement('section'),
    emptyKey: 'games.empty',
    doubleClickThreshold: preferences?.doubleClickThreshold,
    renderEmpty: ({ empty }) => {
      empty.dataset.gamesEmpty = '';
      const code = document.createElement('code');
      code.dataset.gameMount = '';
      code.textContent = i18n.t('games.mount');
      return [document.createElement('br'), code];
    },
  });
  root.dataset.gamesApp = '';
  return root;
}
