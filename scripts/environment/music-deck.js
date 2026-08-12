import { pick } from '../data/content.js';

const RING_SIZE = 32;
const BAR_COUNT = 48;
const FRAME_RATE = 30;

const pad2 = (value) => String(value).padStart(2, '0');

export function formatDeckTimecode(seconds) {
  const safe = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
  const minutes = Math.floor(safe / 60);
  const wholeSeconds = Math.floor(safe % 60);
  const frames = Math.floor((safe % 1) * FRAME_RATE);
  return `${pad2(minutes)}:${pad2(wholeSeconds)}:${pad2(frames)}`;
}

function element(document, tagName, attributes = {}, text = '') {
  const node = document.createElement(tagName);
  Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
  node.textContent = text;
  return node;
}

function defaultAnalyserFactory(audio) {
  try {
    const Context = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!Context) return null;
    const context = new Context();
    const source = context.createMediaElementSource(audio);
    const analyser = context.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser).connect(context.destination);
    const bins = new Uint8Array(analyser.frequencyBinCount);
    return {
      resume() { context.resume?.().catch(() => {}); },
      sample() { analyser.getByteFrequencyData(bins); return bins; },
    };
  } catch {
    return null;
  }
}

export function createMusicDeck({
  document,
  i18n,
  tracks,
  audioFactory = () => new Audio(),
  analyserFactory = defaultAnalyserFactory,
  shouldAnimate = () => true,
  scheduler = {
    request: (callback) => requestAnimationFrame(callback),
    cancel: (id) => cancelAnimationFrame(id),
  },
}) {
  let index = 0;
  let status = 'idle'; // idle | playing | paused | unavailable
  let frameId = null;
  let analyser = null;
  let analyserFailed = false;
  let destroyed = false;

  const audio = audioFactory();
  audio.preload = 'metadata';

  const deck = element(document, 'div', { 'data-environment-deck': '', 'data-deck-status': status });
  const head = element(document, 'div', { 'data-deck-head': '' });
  const nextButton = element(document, 'button', { type: 'button', 'data-deck-next': '' });
  const mark = element(document, 'span', { 'data-deck-mark': '' });
  head.append(nextButton, mark);
  const title = element(document, 'span', { 'data-deck-title': '' });

  const toggle = element(document, 'button', { type: 'button', 'data-deck-toggle': '' });
  const ring = element(document, 'span', { 'data-deck-ring': '', 'aria-hidden': 'true' });
  const canvas = element(document, 'canvas', { 'data-deck-canvas': '' });
  const glyph = element(document, 'span', { 'data-deck-glyph': '' });
  ring.append(canvas, glyph);
  const meta = element(document, 'span', { 'data-deck-meta': '' });
  const statusLine = element(document, 'span', { 'data-deck-status-line': '' });
  const format = element(document, 'span', { 'data-deck-format': '' });
  meta.append(statusLine, format);
  toggle.append(ring, meta);
  deck.append(head, title, toggle);

  const context = canvas.getContext?.('2d') ?? null;

  const currentTrack = () => tracks[index];

  const drawRing = (levels) => {
    if (!context) return;
    const dpr = Math.min(2, Math.max(1, document.defaultView?.devicePixelRatio || 1));
    if (canvas.width !== RING_SIZE * dpr) {
      canvas.width = RING_SIZE * dpr;
      canvas.height = RING_SIZE * dpr;
    }
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, RING_SIZE, RING_SIZE);
    context.strokeStyle = '#FFB454';
    context.lineWidth = 1;
    context.globalAlpha = 0.5;
    context.beginPath();
    context.arc(RING_SIZE / 2, RING_SIZE / 2, 6.5, 0, Math.PI * 2);
    context.stroke();
    context.globalAlpha = 1;
    const inner = 9;
    for (let i = 0; i < BAR_COUNT; i += 1) {
      const angle = (i / BAR_COUNT) * Math.PI * 2 - Math.PI / 2;
      const length = 1 + (levels[i] ?? 0) * 5;
      context.beginPath();
      context.moveTo(
        RING_SIZE / 2 + Math.cos(angle) * inner,
        RING_SIZE / 2 + Math.sin(angle) * inner,
      );
      context.lineTo(
        RING_SIZE / 2 + Math.cos(angle) * (inner + length),
        RING_SIZE / 2 + Math.sin(angle) * (inner + length),
      );
      context.stroke();
    }
  };

  const idleLevels = () => new Array(BAR_COUNT).fill(0.12);

  const simulatedLevels = (time) => Array.from({ length: BAR_COUNT }, (_, i) => (
    0.15 + 0.55 * (0.5 + 0.5 * Math.sin(time * 2.1 + i * 0.72))
      * (0.6 + 0.4 * Math.sin(time * 0.9 + i * 0.13))
  ));

  const sampledLevels = (time) => {
    if (status === 'playing' && !analyserFailed && !analyser) {
      analyser = analyserFactory(audio);
      if (!analyser) analyserFailed = true;
    }
    if (status === 'playing' && analyser) {
      analyser.resume();
      const bins = analyser.sample();
      if (bins?.length) {
        return Array.from({ length: BAR_COUNT }, (_, i) => {
          const bin = bins[Math.floor((i / BAR_COUNT) * bins.length * 0.7)];
          return Math.min(1, (bin / 255) * 1.4);
        });
      }
    }
    if (status === 'playing') return simulatedLevels(time);
    return idleLevels();
  };

  const renderTimecode = () => {
    if (status === 'unavailable') {
      statusLine.textContent = i18n.t('deck.unavailable');
      return;
    }
    statusLine.textContent = formatDeckTimecode(audio.currentTime);
  };

  const renderGlyph = () => {
    glyph.textContent = status === 'playing' ? '■' : '►';
  };

  const stopLoop = () => {
    if (frameId !== null) scheduler.cancel(frameId);
    frameId = null;
  };

  const tick = (time) => {
    frameId = null;
    if (destroyed || status !== 'playing') return;
    drawRing(sampledLevels(time / 1000));
    renderTimecode();
    if (shouldAnimate()) frameId = scheduler.request(tick);
  };

  const syncLoop = () => {
    stopLoop();
    if (status === 'playing' && shouldAnimate()) {
      frameId = scheduler.request(tick);
    } else {
      drawRing(sampledLevels(0));
    }
  };

  const setStatus = (next) => {
    status = next;
    deck.dataset.deckStatus = next;
    renderGlyph();
    renderTimecode();
    toggle.setAttribute('aria-label', i18n.t(status === 'playing' ? 'deck.pause' : 'deck.play'));
    syncLoop();
  };

  const selectTrack = (nextIndex, { autoplay = false } = {}) => {
    index = ((nextIndex % tracks.length) + tracks.length) % tracks.length;
    const track = currentTrack();
    nextButton.textContent = `TRK ${pad2(index + 1)}/${pad2(tracks.length)} ›`;
    title.textContent = pick(track.title, i18n.locale);
    format.textContent = track.format;
    audio.src = track.file;
    if (status !== 'playing') renderTimecode();
    if (autoplay) {
      audio.play().then(() => setStatus('playing')).catch(() => setStatus('unavailable'));
    }
  };

  toggle.addEventListener('click', () => {
    if (status === 'playing') {
      audio.pause();
      setStatus('paused');
      return;
    }
    if (analyserFailed && !analyser) analyserFailed = false;
    audio.play().then(() => setStatus('playing')).catch(() => setStatus('unavailable'));
  });

  nextButton.addEventListener('click', () => {
    const keepPlaying = status === 'playing';
    selectTrack(index + 1, { autoplay: keepPlaying });
    if (!keepPlaying) setStatus('idle');
  });

  audio.addEventListener?.('ended', () => selectTrack(index + 1, { autoplay: true }));
  audio.addEventListener?.('error', () => {
    if (status === 'playing' || audio.src) setStatus('unavailable');
  });
  audio.addEventListener?.('timeupdate', () => {
    if (status !== 'playing') renderTimecode();
  });

  selectTrack(0);

  const syncLocale = () => {
    mark.textContent = i18n.t('deck.label');
    nextButton.setAttribute('aria-label', i18n.t('deck.next'));
    title.textContent = pick(currentTrack().title, i18n.locale);
    setStatus(status);
  };
  syncLocale();

  return {
    element: deck,
    syncLocale,
    getState() { return { index, status }; },
    destroy() {
      destroyed = true;
      stopLoop();
      audio.pause?.();
      audio.src = '';
    },
  };
}
