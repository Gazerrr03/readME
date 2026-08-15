import { photos } from '../../../media/catalog.js';
import { pick } from '../../../scripts/data/content.js';
import { createPixelSvg } from '../shared/pixel-art.js';
import { createFolderBrowser } from '../shared/folder-browser.js';

let selectedSlug = photos[0].slug;
const listeners = new Set();

export function selectPhoto(slug) {
  if (!photos.some((photo) => photo.slug === slug) || slug === selectedSlug) return;
  selectedSlug = slug;
  listeners.forEach((listener) => listener());
}

const pad2 = (value) => String(value).padStart(2, '0');

function createElement(document, tagName, attributes = {}, text = '') {
  const element = document.createElement(tagName);
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
  element.textContent = text;
  return element;
}

function renderPhotoItem({ document, i18n, item }) {
  const art = createElement(document, 'span', {
    'data-folder-item-art': '',
    'data-photo-item-art': '',
    'aria-hidden': 'true',
  });
  art.append(createPixelSvg(document, item.pixels));
  return [
    art,
    createElement(document, 'span', { 'data-folder-item-title': '' }, pick(item.title, i18n.locale)),
    createElement(document, 'span', { 'data-folder-item-meta': '' }, item.date),
  ];
}

function renderPhotoViewer({ document, i18n, item, index, total, previous, next }) {
  const viewer = createElement(document, 'section', {
    'data-photos-app': '',
    'data-content-viewer': '',
    'aria-live': 'polite',
  });
  const counter = createElement(document, 'p', { 'data-photos-count': '' },
    `${pad2(index + 1)} / ${pad2(total)}`);

  const frame = createElement(document, 'div', { 'data-photos-frame': '' });
  frame.append(createPixelSvg(document, item.pixels, { 'aria-hidden': 'true' }));

  const caption = createElement(document, 'div', { 'data-photos-caption': '' });
  caption.append(
    createElement(document, 'h3', { 'data-photos-title': '' }, pick(item.title, i18n.locale)),
    createElement(document, 'span', { 'data-photos-date': '' }, item.date),
  );

  const nav = createElement(document, 'div', { 'data-photos-nav': '' });
  const previousButton = createElement(document, 'button', {
    type: 'button', 'data-photos-prev': '', 'aria-label': i18n.t('photos.previous'),
  }, '‹ PREV');
  const nextButton = createElement(document, 'button', {
    type: 'button', 'data-photos-next': '', 'aria-label': i18n.t('photos.next'),
  }, 'NEXT ›');
  previousButton.addEventListener('click', previous);
  nextButton.addEventListener('click', next);
  nav.append(previousButton, nextButton);

  viewer.append(counter, frame, caption, nav);
  return viewer;
}

export function renderPhotosApp({ i18n, mount, preferences }) {
  const document = mount.ownerDocument;
  const root = createFolderBrowser({
    document,
    i18n,
    appId: 'photos',
    titleKey: 'apps.photos',
    items: photos,
    initialItemId: selectedSlug,
    renderItem: renderPhotoItem,
    renderViewer: renderPhotoViewer,
    doubleClickThreshold: preferences?.doubleClickThreshold,
    onSelectionChange: (slug) => {
      selectedSlug = slug;
      listeners.forEach((listener) => listener());
    },
  });

  const onExternalSelect = () => {
    if (!root.isConnected) listeners.delete(onExternalSelect);
  };
  listeners.add(onExternalSelect);
  return root;
}
