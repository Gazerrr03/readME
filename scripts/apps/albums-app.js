import { tracks } from '../../media/catalog.js';
import { pick } from '../data/content.js';
import { createPixelSvg } from './pixel-art.js';
import { formatDeckTimecode } from '../environment/music-deck.js';

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

export function renderAlbumsApp({ i18n, mount }) {
  const document = mount.ownerDocument;
  const view = mount.ownerDocument.defaultView;
  const root = createElement(document, 'section', {
    'data-albums-app': '',
    'data-player-status': 'idle',
  });

  const audio = new view.Audio();
  audio.loop = true;
  audio.preload = 'metadata';
  let status = 'idle'; // idle | playing | paused | unavailable
  let frameId = null;

  const currentIndex = () => Math.max(0, tracks.findIndex((track) => track.slug === selectedSlug));

  const stopTick = () => {
    if (frameId !== null) view.cancelAnimationFrame(frameId);
    frameId = null;
  };

  // No window-manager destroy hook: stop the audio once the window's DOM
  // node is removed (same self-disposal pattern as the wireframe previews).
  const tick = () => {
    frameId = null;
    if (!root.isConnected) {
      audio.pause();
      audio.removeAttribute('src');
      return;
    }
    root.querySelector('[data-player-time]').textContent = formatDeckTimecode(audio.currentTime);
    if (status === 'playing') frameId = view.requestAnimationFrame(tick);
  };

  const syncTick = () => {
    stopTick();
    if (status === 'playing') frameId = view.requestAnimationFrame(tick);
  };

  const setStatus = (next) => {
    status = next;
    root.dataset.playerStatus = next;
    const toggle = root.querySelector('[data-player-toggle]');
    toggle.textContent = next === 'playing' ? '■' : '►';
    toggle.setAttribute('aria-label', i18n.t(next === 'playing' ? 'deck.pause' : 'deck.play'));
    if (next === 'unavailable') {
      root.querySelector('[data-player-time]').textContent = i18n.t('deck.unavailable');
    }
    syncTick();
  };

  const loadTrack = ({ autoplay = false } = {}) => {
    const index = currentIndex();
    const track = tracks[index];
    root.querySelector('[data-player-track]').textContent = `TRK ${pad2(index + 1)}/${pad2(tracks.length)}`;
    root.querySelector('[data-player-title]').textContent = pick(track.title, i18n.locale);
    root.querySelector('[data-player-format]').textContent = `${track.format} · ${formatDeckTimecode(track.seconds)}`;
    const cover = root.querySelector('[data-player-cover]');
    cover.replaceChildren(createPixelSvg(document, track.cover, { 'aria-hidden': 'true' }));
    if (!audio.src.endsWith(track.file)) {
      audio.src = track.file;
      root.querySelector('[data-player-time]').textContent = formatDeckTimecode(0);
    }
    if (autoplay) audio.play().then(() => setStatus('playing')).catch(() => setStatus('unavailable'));
  };

  const build = () => {
    const counter = createElement(document, 'p', { 'data-player-track': '' });
    const cover = createElement(document, 'div', { 'data-player-cover': '' });
    const title = createElement(document, 'h3', { 'data-player-title': '' });
    const meta = createElement(document, 'p', { 'data-player-format': '' });

    const controls = createElement(document, 'div', { 'data-player-controls': '' });
    const previous = createElement(document, 'button', {
      type: 'button', 'data-player-prev': '', 'aria-label': i18n.t('player.previous'),
    }, '‹');
    const toggle = createElement(document, 'button', { type: 'button', 'data-player-toggle': '' }, '►');
    const next = createElement(document, 'button', {
      type: 'button', 'data-player-next': '', 'aria-label': i18n.t('deck.next'),
    }, '›');
    controls.append(previous, toggle, next);

    const time = createElement(document, 'p', { 'data-player-time': '' }, formatDeckTimecode(0));

    previous.addEventListener('click', () => {
      const nextIndex = (currentIndex() - 1 + tracks.length) % tracks.length;
      const keepPlaying = status === 'playing';
      selectAlbum(tracks[nextIndex].slug);
      if (!keepPlaying) setStatus('idle');
    });
    next.addEventListener('click', () => {
      const nextIndex = (currentIndex() + 1) % tracks.length;
      const keepPlaying = status === 'playing';
      selectAlbum(tracks[nextIndex].slug);
      if (!keepPlaying) setStatus('idle');
    });
    toggle.addEventListener('click', () => {
      if (status === 'playing') {
        audio.pause();
        setStatus('paused');
        return;
      }
      audio.play().then(() => setStatus('playing')).catch(() => setStatus('unavailable'));
    });

    root.replaceChildren(counter, cover, title, meta, controls, time);
  };

  const onExternalSelect = () => {
    if (!root.isConnected) {
      listeners.delete(onExternalSelect);
      return;
    }
    loadTrack({ autoplay: status === 'playing' });
  };
  listeners.add(onExternalSelect);

  audio.addEventListener('error', () => setStatus('unavailable'));

  build();
  loadTrack({ autoplay: true });
  i18n.subscribe(() => {
    build();
    loadTrack();
    setStatus(status);
  });
  return root;
}
