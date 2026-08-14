import { articles, pick } from '../data/content.js';
import { contentPath } from '../routing/content-routes.js';
import { createPixelSvg } from './pixel-art.js';
import { createFolderBrowser } from './folder-browser.js';

// Until a separate book catalog exists, the shelf is a physical index of the
// site's authored essays. The browser contract stays the same when real books
// are added later.
export const BOOKS = articles;

const BOOK_PIXELS = Object.freeze([
  Object.freeze([
    '##..####..##....',
    '.##.##..####..#.',
    '....####..##....',
    '##..##..####..##',
  ]),
  Object.freeze([
    '....##..####....',
    '..######..##..#.',
    '##..##..######..',
    '....####..##..##',
  ]),
  Object.freeze([
    '####....##..####',
    '..##..######....',
    '####..##..##..##',
    '..##....######..',
  ]),
]);

function createElement(document, tagName, attributes = {}, text = '') {
  const element = document.createElement(tagName);
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
  element.textContent = text;
  return element;
}

function pad2(value) {
  return String(value + 1).padStart(2, '0');
}

function createBookBox(document, item, index, detail = false) {
  const box = createElement(document, 'span', {
    'data-book-box': '',
    ...(detail ? { 'data-book-box-detail': '' } : {}),
    'aria-hidden': 'true',
  });
  const front = createElement(document, 'span', { 'data-book-front': '' });
  const ascii = createElement(document, 'pre', { 'data-book-ascii': '' });
  ascii.textContent = [
    '+----------------+',
    `| BOOK / ${pad2(index)}     |`,
    '|                |',
    '|   ##  ####     |',
    '|  ######  ##    |',
    '|                |',
    '+----------------+',
  ].join('\n');
  const pixels = createElement(document, 'span', { 'data-book-pixels': '' });
  pixels.append(createPixelSvg(document, BOOK_PIXELS[index % BOOK_PIXELS.length]));
  front.append(ascii, pixels);
  box.append(
    front,
    createElement(document, 'span', { 'data-book-spine': '' }, `B${pad2(index)}`),
    createElement(document, 'span', { 'data-book-pages': '' }),
  );
  return box;
}

function renderBookItem({ document, i18n, item, index }) {
  return [
    createBookBox(document, item, index),
    createElement(document, 'span', { 'data-folder-item-title': '' }, pick(item.title, i18n.locale)),
    createElement(document, 'span', { 'data-folder-item-meta': '' }, `${item.date} · ${item.tag}`),
  ];
}

function renderBookBody(document, i18n, item) {
  const body = createElement(document, 'div', { 'data-book-reader-body': '' });
  (item.body[i18n.locale] ?? item.body.en).forEach((part) => {
    if (typeof part === 'string') {
      body.append(createElement(document, 'p', {}, part));
      return;
    }
    if (part.h) {
      body.append(createElement(document, 'h4', {}, part.h));
      return;
    }
    if (part.q) {
      body.append(createElement(document, 'blockquote', {}, part.q));
      return;
    }
    if (part.a && part.href) {
      const paragraph = createElement(document, 'p');
      const link = createElement(document, 'a', { href: part.href, target: '_blank', rel: 'noreferrer' }, part.a);
      paragraph.append(link, part.rest ?? '');
      body.append(paragraph);
    }
  });
  return body;
}

function renderBookViewer({ document, i18n, item, index, total, previous, next }) {
  const viewer = createElement(document, 'section', {
    'data-books-app': '',
    'data-book-reader': '',
    'data-content-viewer': '',
  });
  const masthead = createElement(document, 'div', { 'data-book-reader-masthead': '' });
  masthead.append(
    createElement(document, 'p', { 'data-book-reader-kicker': '' },
      `BOOK / ${pad2(index)} · ${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`),
    createElement(document, 'h3', { 'data-book-reader-title': '' }, pick(item.title, i18n.locale)),
    createElement(document, 'p', { 'data-book-reader-meta': '' }, `${item.date} · ${item.tag}`),
  );

  const cover = createElement(document, 'div', { 'data-book-reader-cover': '' });
  cover.append(createBookBox(document, item, index, true));
  const copy = createElement(document, 'article', { 'data-book-reader-copy': '' });
  copy.append(
    renderBookBody(document, i18n, item),
    createElement(document, 'a', {
      href: contentPath('writing', item.slug),
      'data-book-open': item.slug,
    }, i18n.t('books.open')),
  );

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

  viewer.append(masthead, cover, copy, navigation);
  return viewer;
}

export function renderBooksApp({ i18n, mount, preferences }) {
  const document = mount.ownerDocument;
  const root = createFolderBrowser({
    document,
    i18n,
    appId: 'books',
    titleKey: 'apps.books',
    items: BOOKS,
    renderItem: renderBookItem,
    renderViewer: renderBookViewer,
    doubleClickThreshold: preferences?.doubleClickThreshold,
  });
  root.dataset.booksApp = '';
  root.dataset.bookshelf = '';
  return root;
}
