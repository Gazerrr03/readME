import { pick } from '../data/content.js';
import { createPixelSvg } from './pixel-art.js';

function createElement(document, tagName, attributes = {}, text = '') {
  const element = document.createElement(tagName);
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
  element.textContent = text;
  return element;
}

function createStamp(document, i18n, folderId, item, index) {
  const stamp = createElement(document, 'button', {
    type: 'button',
    'data-stamp': item.slug,
    'data-stamp-folder': folderId,
    'aria-label': pick(item.title, i18n.locale),
  });
  stamp.style.setProperty('--i', String(index));
  const art = createElement(document, 'span', { 'data-stamp-art': '', 'aria-hidden': 'true' });
  art.append(createPixelSvg(document, item.pixels ?? item.cover));
  stamp.append(
    art,
    createElement(document, 'span', { 'data-app-label': '' }, pick(item.title, i18n.locale)),
  );
  return stamp;
}

/* Desktop folders: a folder toggle with a stack of "stamps" (content items)
   that slide out to the left when the folder is expanded. Markup only —
   expand/collapse and open behaviour live in desktop.js. */
export function renderDesktopFolders({ document, i18n, content, expandedFolder = null }) {
  const documentRef = document;
  const snapshot = content();
  const folders = [
    { id: 'photos', items: snapshot.photos },
    { id: 'albums', items: snapshot.tracks },
  ];
  const container = createElement(documentRef, 'div', {
    'data-desktop-folders': '',
    role: 'group',
    'aria-label': i18n.t('site.title'),
  });

  const template = documentRef.querySelector('[data-desktop-folder-template]');
  if (!template) throw new Error('Missing desktop folder template');

  folders.forEach(({ id, items }) => {
    const folder = createElement(documentRef, 'div', {
      'data-desktop-folder': id,
      'data-expanded': String(expandedFolder === id),
    });

    const toggle = template.content.querySelector(`[data-folder-toggle="${id}"]`);
    if (!toggle) throw new Error(`Missing folder toggle: ${id}`);
    const button = toggle.cloneNode(true);
    button.setAttribute('aria-expanded', String(expandedFolder === id));
    button.setAttribute('aria-label', i18n.t(`apps.${id}`));
    button.querySelector('[data-app-label]').textContent = i18n.t(`apps.${id}`);

    const stamps = createElement(documentRef, 'div', {
      'data-folder-stamps': id,
      role: 'group',
      'aria-label': i18n.t(`apps.${id}`),
    });
    stamps.append(...items.map((item, index) => createStamp(documentRef, i18n, id, item, index)));
    if (expandedFolder !== id) stamps.setAttribute('inert', '');

    folder.append(button, stamps);
    container.append(folder);
  });

  return container;
}
