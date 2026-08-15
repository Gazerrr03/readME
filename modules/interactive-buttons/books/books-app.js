import { BOOKS } from './data.js';
import { createBookshelfScene } from './bookshelf-scene.js';
import { createFolderBrowser } from '../shared/folder-browser.js';

export { BOOKS };

function createElement(document, tagName, attributes = {}, text = '') {
  const element = document.createElement(tagName);
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
  element.textContent = text;
  return element;
}

function localize(value, locale, fallback = '') {
  if (!value) return fallback;
  if (typeof value === 'string') return value;
  return value[locale] ?? value.en ?? Object.values(value)[0] ?? fallback;
}

function pad2(value) {
  return String(value + 1).padStart(2, '0');
}

function renderBookItem({ document, i18n, item, index }) {
  const title = localize(item.title, i18n.locale, item.slug);
  const meta = [item.author, item.year, item.format].filter(Boolean).join(' · ')
    || 'EPUB / PDF';
  return [
    createElement(document, 'span', {
      'data-bookshelf-item': '',
      'data-bookshelf-index': String(index),
      'aria-hidden': 'true',
    }),
    createElement(document, 'span', { 'data-folder-item-title': '' }, title),
    createElement(document, 'span', { 'data-folder-item-meta': '' }, meta),
  ];
}

function renderBookViewer({ document, i18n, item, index, total, previous, next }) {
  const viewer = createElement(document, 'section', {
    'data-books-app': '',
    'data-book-reader': '',
    'data-content-viewer': '',
  });
  const title = localize(item.title, i18n.locale, item.slug);
  const meta = [item.author, item.year, item.format].filter(Boolean).join(' · ')
    || 'EPUB / PDF';
  const masthead = createElement(document, 'div', { 'data-book-reader-masthead': '' });
  masthead.append(
    createElement(document, 'p', { 'data-book-reader-kicker': '' },
      `BOOK / ${pad2(index)} · ${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`),
    createElement(document, 'h3', { 'data-book-reader-title': '' }, title),
    createElement(document, 'p', { 'data-book-reader-meta': '' }, meta),
  );

  const frame = createElement(document, 'div', { 'data-book-reader-frame': '' });
  if (item.file) {
    const isPdf = /\.pdf(?:$|\?)/i.test(item.file);
    if (isPdf) {
      frame.append(createElement(document, 'iframe', {
        src: item.file,
        title,
        'data-book-file-frame': '',
      }));
    }
    frame.append(createElement(document, 'a', {
      href: item.file,
      target: '_blank',
      rel: 'noreferrer',
      'data-book-open-file': '',
    }, i18n.t('books.openFile')));
  } else {
    frame.append(
      createElement(document, 'p', { 'data-book-reader-empty': '' }, i18n.t('books.readerEmpty')),
      createElement(document, 'p', { 'data-book-reader-hint': '' }, i18n.t('books.readerHint')),
    );
  }

  const navigation = createElement(document, 'nav', {
    'data-book-reader-nav': '',
    'aria-label': i18n.t('books.navigation'),
  });
  const previousButton = createElement(document, 'button', {
    type: 'button', 'data-book-prev': '',
  }, '‹ PREV');
  const nextButton = createElement(document, 'button', {
    type: 'button', 'data-book-next': '',
  }, 'NEXT ›');
  previousButton.addEventListener('click', previous);
  nextButton.addEventListener('click', next);
  navigation.append(previousButton, nextButton);

  viewer.append(masthead, frame, navigation);
  return viewer;
}

function createBookshelfStage(document, i18n) {
  const stage = createElement(document, 'section', {
    'data-bookshelf-stage': '',
    'aria-label': i18n.t('bookshelf.canvas'),
  });
  const canvas = createElement(document, 'canvas', {
    'data-bookshelf-canvas': '',
    'aria-hidden': 'true',
  });
  const masthead = createElement(document, 'div', { 'data-bookshelf-masthead': '' });
  const title = createElement(document, 'h3', { 'data-bookshelf-title': '' }, i18n.t('bookshelf.title'));
  const countLabel = createElement(document, 'p', { 'data-bookshelf-count': '' });
  masthead.append(title, countLabel);

  const inspector = createElement(document, 'aside', {
    'data-bookshelf-inspector': '',
    'data-bookshelf-inspector-state': 'empty',
    'aria-live': 'polite',
  });
  const inspectorKicker = createElement(document, 'p', {
    'data-bookshelf-inspector-kicker': '',
  });
  const inspectorTitle = createElement(document, 'h4', {
    'data-bookshelf-inspector-title': '',
  });
  const inspectorMeta = createElement(document, 'p', {
    'data-bookshelf-inspector-meta': '',
  });
  const inspectorDescription = createElement(document, 'p', {
    'data-bookshelf-inspector-description': '',
  });
  inspector.append(inspectorKicker, inspectorTitle, inspectorMeta, inspectorDescription);

  stage.append(canvas, masthead, inspector);
  return {
    stage,
    canvas,
    countLabel,
    inspector,
    inspectorKicker,
    inspectorTitle,
    inspectorMeta,
    inspectorDescription,
  };
}

export function renderBooksApp({ i18n, mount, preferences }) {
  const document = mount.ownerDocument;
  const view = document.defaultView;
  let scene = null;
  let viewObserver = null;
  const browser = createFolderBrowser({
    document,
    i18n,
    appId: 'books',
    titleKey: 'apps.books',
    items: BOOKS,
    initialItemId: BOOKS[0]?.slug ?? null,
    renderItem: renderBookItem,
    renderViewer: renderBookViewer,
    doubleClickThreshold: preferences?.doubleClickThreshold,
    onSelectionChange: (slug) => scene?.setSelected(slug),
  });
  const stage = createBookshelfStage(document, i18n);
  const root = createElement(document, 'section', {
    'data-books-app': '',
    'data-bookshelf': '',
    'data-bookshelf-view': browser.dataset.folderView,
  });
  root.append(stage.stage, browser);
  let hoveredBookSlug = null;

  const syncBookInfo = (slug = hoveredBookSlug) => {
    hoveredBookSlug = slug;
    const item = BOOKS.find((candidate) => candidate.slug === slug);
    stage.inspector.dataset.bookshelfInspectorState = item ? 'active' : 'empty';
    stage.inspectorKicker.textContent = item ? i18n.t('bookshelf.inspectKicker') : '';
    stage.inspectorTitle.textContent = item
      ? localize(item.title, i18n.locale, item.slug)
      : '';
    stage.inspectorMeta.textContent = item
      ? [item.author, item.year, item.format].filter(Boolean).join(' · ')
      : '';
    stage.inspectorDescription.textContent = item
      ? localize(item.description, i18n.locale, i18n.t('bookshelf.inspectNoDescription'))
      : '';
  };

  const syncStageText = () => {
    stage.countLabel.textContent = i18n.t('bookshelf.count').replace('{n}', String(BOOKS.length));
    root.dataset.bookshelfView = browser.dataset.folderView ?? 'folder';
    syncBookInfo();
  };
  syncStageText();

  scene = createBookshelfScene(stage.canvas, {
    items: BOOKS,
    onHover: (slug) => syncBookInfo(slug),
    isSingleTap: () => view.matchMedia('(pointer: coarse)').matches
      || view.matchMedia('(max-width: 760px)').matches,
    onSelect: (slug) => browser.selectItem?.(slug),
    onOpen: (slug) => browser.openItem?.(slug),
  });
  viewObserver = new view.MutationObserver(syncStageText);
  viewObserver.observe(browser, { attributes: true, attributeFilter: ['data-folder-view'] });
  i18n.subscribe(() => {
    if (!root.isConnected) return;
    syncStageText();
  });

  root.addEventListener('DOMNodeRemoved', () => {
    if (!root.isConnected) {
      viewObserver?.disconnect();
      scene?.dispose();
    }
  });
  return root;
}
