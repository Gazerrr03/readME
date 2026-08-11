import { photos as basePhotos } from '../../media/catalog.js';
import { pick } from '../data/content.js';
import { createPixelSvg } from './pixel-art.js';

let selectedSlug = basePhotos[0].slug;
const listeners = new Set();

export function selectPhoto(slug) {
  if (!basePhotos.some((photo) => photo.slug === slug) || slug === selectedSlug) return;
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

export function renderPhotosApp({ i18n, content, mount }) {
  const document = mount.ownerDocument;
  const root = createElement(document, 'section', { 'data-photos-app': '' });
  const photos = () => content().photos;

  const step = (direction) => {
    const items = photos();
    const index = items.findIndex((photo) => photo.slug === selectedSlug);
    const next = (index + direction + items.length) % items.length;
    selectPhoto(items[next].slug);
  };

  const render = () => {
    const items = photos();
    const index = Math.max(0, items.findIndex((photo) => photo.slug === selectedSlug));
    const photo = items[index];

    const counter = createElement(document, 'p', { 'data-photos-count': '' },
      `${pad2(index + 1)} / ${pad2(items.length)}`);

    const frame = createElement(document, 'div', { 'data-photos-frame': '' });
    frame.append(createPixelSvg(document, photo.pixels, { 'aria-hidden': 'true' }));

    const caption = createElement(document, 'div', { 'data-photos-caption': '' });
    caption.append(
      createElement(document, 'h3', { 'data-photos-title': '' }, pick(photo.title, i18n.locale)),
      createElement(document, 'span', { 'data-photos-date': '' }, pick(photo.dateLabel, i18n.locale)),
    );

    const nav = createElement(document, 'div', { 'data-photos-nav': '' });
    const previous = createElement(document, 'button', {
      type: 'button', 'data-photos-prev': '', 'aria-label': i18n.t('photos.previous'),
    }, `‹ ${i18n.t('photos.prevLabel')}`);
    const next = createElement(document, 'button', {
      type: 'button', 'data-photos-next': '', 'aria-label': i18n.t('photos.next'),
    }, `${i18n.t('photos.nextLabel')} ›`);
    previous.addEventListener('click', () => step(-1));
    next.addEventListener('click', () => step(1));
    nav.append(previous, next);

    root.replaceChildren(counter, frame, caption, nav);
  };

  const onExternalSelect = () => {
    if (root.isConnected) render();
    else listeners.delete(onExternalSelect);
  };
  listeners.add(onExternalSelect);

  root.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); step(-1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); step(1); }
  });

  render();
  i18n.subscribe(render);
  return root;
}
