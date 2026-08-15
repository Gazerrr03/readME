function createElement(document, tagName, attributes = {}, text = '') {
  const element = document.createElement(tagName);
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
  element.textContent = text;
  return element;
}

const FOLDER_DEFINITIONS = Object.freeze([
  Object.freeze({ id: 'photos', icon: 'stamp-folder-photos' }),
  Object.freeze({ id: 'albums', icon: 'stamp-folder-albums' }),
  Object.freeze({ id: 'games', icon: 'folder-games' }),
  Object.freeze({ id: 'books', icon: 'folder-books' }),
]);

/* The desktop cluster is now a launcher only. Collection contents live in
   the centered app window so desktop and mobile share the same route. */
export function renderDesktopFolders({ document, i18n }) {
  const container = createElement(document, 'div', {
    'data-desktop-folders': '',
    role: 'group',
    'aria-label': i18n.t('folders.group'),
  });

  const template = document.querySelector('[data-desktop-folder-template]');
  if (!template) throw new Error('Missing desktop folder template');

  FOLDER_DEFINITIONS.forEach(({ id }) => {
    const toggle = template.content.querySelector(`[data-folder-toggle="${id}"]`);
    if (!toggle) throw new Error(`Missing folder toggle: ${id}`);
    const button = toggle.cloneNode(true);
    button.setAttribute('aria-label', i18n.t(`apps.${id}`));
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-expanded', 'false');
    button.querySelector('[data-app-label]').textContent = i18n.t(`apps.${id}`);
    const folder = createElement(document, 'div', {
      'data-desktop-folder': id,
    });
    folder.append(button);
    container.append(folder);
  });

  return container;
}
