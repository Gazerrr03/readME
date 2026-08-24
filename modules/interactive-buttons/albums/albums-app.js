import { tracks } from '../../../media/catalog.js';
import { pick } from '../../../scripts/data/content.js';
import { createPixelSvg } from '../shared/pixel-art.js';
import { formatDeckTimecode } from '../../../scripts/environment/music-deck.js';
import { createFolderBrowser } from '../shared/folder-browser.js';

let selectedSlug = tracks[0].slug;
const listeners = new Set();

export function selectAlbum(slug) {
  if (!tracks.some((track) => track.slug === slug) || slug === selectedSlug) return;
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

function createAlbumCover(document, track, attributes = {}) {
  if (track.coverImage) {
    return createElement(document, 'img', {
      src: track.coverImage,
      alt: '',
      'data-album-cover-image': '',
      ...attributes,
    });
  }
  return createPixelSvg(document, track.cover, attributes);
}

function renderAlbumItem({ document, i18n, item }) {
  const art = createElement(document, 'span', {
    'data-folder-item-art': '',
    'data-album-item-art': '',
    'aria-hidden': 'true',
  });
  art.append(createAlbumCover(document, item));
  return [
    art,
    createElement(document, 'span', { 'data-folder-item-title': '' }, pick(item.title, i18n.locale)),
    createElement(document, 'span', { 'data-folder-item-meta': '' },
      `${item.format} · ${formatDeckTimecode(item.seconds)}`),
  ];
}

export function renderAlbumsApp({ i18n, mount, preferences }) {
  const document = mount.ownerDocument;
  const view = document.defaultView;
  const audio = new view.Audio();
  audio.loop = true;
  audio.preload = 'metadata';
  let status = 'idle';
  let frameId = null;
  let activeViewer = null;

  const stopTick = () => {
    if (frameId !== null) view.cancelAnimationFrame(frameId);
    frameId = null;
  };

  const tick = () => {
    frameId = null;
    if (!activeViewer?.isConnected) {
      audio.pause();
      return;
    }
    const time = activeViewer.querySelector('[data-player-time]');
    if (time) time.textContent = formatDeckTimecode(audio.currentTime);
    if (status === 'playing') frameId = view.requestAnimationFrame(tick);
  };

  const syncTick = () => {
    stopTick();
    if (status === 'playing') frameId = view.requestAnimationFrame(tick);
  };

  const setStatus = (nextStatus) => {
    status = nextStatus;
    if (activeViewer) {
      activeViewer.dataset.playerStatus = nextStatus;
      const toggle = activeViewer.querySelector('[data-player-toggle]');
      if (toggle) {
        toggle.textContent = nextStatus === 'playing' ? '■' : '►';
        toggle.setAttribute('aria-label', i18n.t(
          nextStatus === 'playing' ? 'deck.pause' : 'deck.play',
        ));
      }
      if (nextStatus === 'unavailable') {
        const time = activeViewer.querySelector('[data-player-time]');
        if (time) time.textContent = i18n.t('deck.unavailable');
      }
    }
    syncTick();
  };

  const loadTrack = (viewer, track, { autoplay = false } = {}) => {
    viewer.querySelector('[data-player-track]').textContent = `TRK ${pad2(
      tracks.indexOf(track) + 1,
    )}/${pad2(tracks.length)}`;
    viewer.querySelector('[data-player-title]').textContent = pick(track.title, i18n.locale);
    viewer.querySelector('[data-player-format]').textContent = `${track.format} · ${formatDeckTimecode(
      track.seconds,
    )}`;
    viewer.querySelector('[data-player-cover]').replaceChildren(
      createAlbumCover(document, track, { 'aria-hidden': 'true' }),
    );
    if (!audio.src.endsWith(track.file)) {
      audio.src = track.file;
      viewer.querySelector('[data-player-time]').textContent = formatDeckTimecode(0);
    }
    if (autoplay) {
      audio.play().then(() => setStatus('playing')).catch(() => setStatus('unavailable'));
    }
  };

  const renderAlbumViewer = ({
    item,
    i18n: localized,
    previous,
    next,
    shouldAutoplay,
  }) => {
    const viewer = createElement(document, 'section', {
      'data-albums-app': '',
      'data-content-viewer': '',
      'data-player-status': status,
    });
    activeViewer = viewer;

    const counter = createElement(document, 'p', { 'data-player-track': '' });
    const cover = createElement(document, 'div', { 'data-player-cover': '' });
    const title = createElement(document, 'h3', { 'data-player-title': '' });
    const meta = createElement(document, 'p', { 'data-player-format': '' });
    const controls = createElement(document, 'div', { 'data-player-controls': '' });
    const previousButton = createElement(document, 'button', {
      type: 'button', 'data-player-prev': '', 'aria-label': localized.t('player.previous'),
    }, '‹');
    const toggle = createElement(document, 'button', {
      type: 'button', 'data-player-toggle': '',
      'aria-label': localized.t(status === 'playing' ? 'deck.pause' : 'deck.play'),
    }, status === 'playing' ? '■' : '►');
    const nextButton = createElement(document, 'button', {
      type: 'button', 'data-player-next': '', 'aria-label': localized.t('deck.next'),
    }, '›');
    controls.append(previousButton, toggle, nextButton);
    const time = createElement(document, 'p', {
      'data-player-time': '',
    }, formatDeckTimecode(audio.currentTime));

    previousButton.addEventListener('click', previous);
    nextButton.addEventListener('click', next);
    toggle.addEventListener('click', () => {
      if (status === 'playing') {
        audio.pause();
        setStatus('paused');
        return;
      }
      audio.play().then(() => setStatus('playing')).catch(() => setStatus('unavailable'));
    });

    viewer.append(counter, cover, title, meta, controls, time);
    loadTrack(viewer, item, { autoplay: shouldAutoplay });
    setStatus(status);
    return viewer;
  };

  audio.addEventListener('error', () => setStatus('unavailable'));

  const root = createFolderBrowser({
    document,
    i18n,
    appId: 'albums',
    titleKey: 'apps.albums',
    items: tracks,
    initialItemId: selectedSlug,
    renderItem: renderAlbumItem,
    renderViewer: renderAlbumViewer,
    doubleClickThreshold: preferences?.doubleClickThreshold,
    onBeforeBack: () => {
      audio.pause();
      audio.removeAttribute('src');
      setStatus('paused');
      stopTick();
      activeViewer = null;
    },
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
