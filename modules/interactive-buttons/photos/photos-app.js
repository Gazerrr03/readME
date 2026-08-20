import { photos } from '../../../media/catalog.js';
import { pick } from '../../../scripts/data/content.js';
import { createPixelSvg } from '../shared/pixel-art.js';
import { createFolderBrowser } from '../shared/folder-browser.js';
import { createWallpapersView } from './wallpapers-view.js';

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

export function renderPhotosApp({
  i18n,
  mount,
  preferences,
  wallpapers = [],
  getCurrentWallpaperId = () => preferences?.wallpaperId ?? null,
  applyWallpaper,
}) {
  const document = mount.ownerDocument;
  const photoBrowser = createFolderBrowser({
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
    if (!photoBrowser.isConnected) listeners.delete(onExternalSelect);
  };
  listeners.add(onExternalSelect);

  const root = createElement(document, 'section', { 'data-photos-shell': '' });
  const tabList = createElement(document, 'div', {
    'data-photos-tabs': '',
    role: 'tablist',
    'aria-label': i18n.t('apps.photos'),
  });
  const photoTab = createElement(document, 'button', {
    type: 'button',
    id: 'photos-tab-photos',
    role: 'tab',
    'data-photos-tab': 'photos',
    'aria-controls': 'photos-panel-photos',
  });
  const wallpaperTab = createElement(document, 'button', {
    type: 'button',
    id: 'photos-tab-wallpapers',
    role: 'tab',
    'data-photos-tab': 'wallpapers',
    'aria-controls': 'photos-panel-wallpapers',
  });
  const photoPanel = createElement(document, 'section', {
    id: 'photos-panel-photos',
    role: 'tabpanel',
    'data-photos-panel': 'photos',
    'aria-labelledby': 'photos-tab-photos',
  });
  const wallpaperPanel = createElement(document, 'section', {
    id: 'photos-panel-wallpapers',
    role: 'tabpanel',
    'data-photos-panel': 'wallpapers',
    'aria-labelledby': 'photos-tab-wallpapers',
  });
  const wallpapersView = createWallpapersView({
    document,
    i18n,
    wallpapers,
    currentId: getCurrentWallpaperId(),
    applyWallpaper,
  });
  let activeTab = 'photos';

  const updateTabs = () => {
    photoTab.textContent = i18n.t('apps.photos');
    wallpaperTab.textContent = i18n.t('photos.wallpapers');
    [photoTab, wallpaperTab].forEach((tab) => {
      const selected = tab.dataset.photosTab === activeTab;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    photoPanel.hidden = activeTab !== 'photos';
    wallpaperPanel.hidden = activeTab !== 'wallpapers';
  };
  const selectTab = (tab) => {
    activeTab = tab;
    updateTabs();
  };
  [photoTab, wallpaperTab].forEach((tab) => {
    tab.addEventListener('click', () => selectTab(tab.dataset.photosTab));
    tab.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home'
        ? photoTab
        : event.key === 'End'
          ? wallpaperTab
          : tab === photoTab
            ? wallpaperTab
            : photoTab;
      selectTab(next.dataset.photosTab);
      next.focus();
    });
  });

  tabList.append(photoTab, wallpaperTab);
  photoPanel.append(photoBrowser);
  wallpaperPanel.append(wallpapersView);
  root.append(tabList, photoPanel, wallpaperPanel);
  updateTabs();
  i18n.subscribe(() => {
    if (root.isConnected) updateTabs();
  });
  return root;
}
