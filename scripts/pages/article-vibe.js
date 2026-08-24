import { pick } from '../data/content.js';
import { tracks } from '../../media/catalog.js';

const VIBE_TRACK = tracks[0];
const CANVAS_SIZE = 248;
const FRAME_RATE = 30;

function createElement(document, tagName, attributes = {}, text = '') {
  const element = document.createElement(tagName);
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
  element.textContent = text;
  return element;
}

function pad2(value) {
  return String(value).padStart(2, '0');
}

function formatTimecode(seconds) {
  const safe = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
  const hours = Math.floor(safe / (60 * 60));
  const minutes = Math.floor((safe / 60) % 60);
  const wholeSeconds = Math.floor(safe % 60);
  const frames = Math.floor((safe % 1) * FRAME_RATE);
  return `${pad2(hours)}:${pad2(minutes)}:${pad2(wholeSeconds)}:${pad2(frames)}`;
}

function statusKey(status) {
  return {
    idle: 'content.vibeStatusIdle',
    playing: 'content.vibeStatusPlaying',
    paused: 'content.vibeStatusPaused',
    ended: 'content.vibeStatusEnded',
    unavailable: 'content.vibeStatusUnavailable',
  }[status] ?? 'content.vibeStatusIdle';
}

export function renderArticleVibe({ document, i18n }) {
  const windowRef = document.defaultView;
  const audio = document.createElement('audio');
  audio.preload = 'metadata';
  audio.src = VIBE_TRACK.file;
  audio.setAttribute('data-vibe-audio', '');
  audio.setAttribute('aria-hidden', 'true');
  audio.hidden = true;

  let status = 'idle';
  let isOpen = false;
  let frameId = null;
  let destroyed = false;
  const subscribers = new Set();

  const player = createElement(document, 'section', {
    'data-vibe-player': '',
    'data-vibe-status': status,
    'data-vibe-open': 'false',
    'aria-label': i18n.t('content.vibePlayer'),
    hidden: '',
  });
  const header = createElement(document, 'header', { 'data-vibe-player-header': '' });
  const headerMeta = createElement(document, 'div', { 'data-vibe-player-header-meta': '' });
  const reference = createElement(document, 'span', { 'data-vibe-reference': '' });
  const source = createElement(document, 'span', { 'data-vibe-source': '' });
  const closeButton = createElement(document, 'button', {
    type: 'button',
    'data-vibe-close': '',
    'aria-label': i18n.t('content.vibeClose'),
  }, '×');
  headerMeta.append(reference, source);
  header.append(headerMeta, closeButton);

  const stage = createElement(document, 'div', { 'data-vibe-stage': '' });
  const hud = createElement(document, 'div', { 'data-vibe-radial-hud': '' });
  const radialTrack = createElement(document, 'div', {
    'data-vibe-radial-track': '',
    'aria-hidden': 'true',
  });
  const canvas = createElement(document, 'canvas', {
    'data-vibe-canvas': '',
    width: String(CANVAS_SIZE),
    height: String(CANVAS_SIZE),
    'aria-hidden': 'true',
  });
  const pulse = createElement(document, 'div', {
    'data-vibe-pulse': '',
    'aria-hidden': 'true',
  });
  const pulseCircle = createElement(document, 'div', { 'data-vibe-pulse-circle': '' });
  const playButton = createElement(document, 'button', {
    type: 'button',
    'data-vibe-play': '',
    'aria-pressed': 'false',
    'aria-label': i18n.t('content.vibePlay'),
  });
  const playGlyph = createElement(document, 'span', {
    'data-vibe-play-glyph': '',
    'aria-hidden': 'true',
  });
  pulse.append(pulseCircle);
  playButton.append(playGlyph);
  hud.append(radialTrack, canvas, pulse, playButton);
  stage.append(hud);

  const footer = createElement(document, 'footer', { 'data-vibe-player-footer': '' });
  const statusRow = createElement(document, 'div', { 'data-vibe-status-row': '' });
  const statusLabel = createElement(document, 'span', { 'data-vibe-status-label': '' });
  const statusText = createElement(document, 'span', { 'data-vibe-status-text': '' });
  const trackRow = createElement(document, 'div', { 'data-vibe-track-row': '' });
  const trackLabel = createElement(document, 'span', { 'data-vibe-track-label': '' });
  const trackTitle = createElement(document, 'span', { 'data-vibe-track-title': '' });
  const timerRow = createElement(document, 'div', { 'data-vibe-timer': '' });
  const timeCode = createElement(document, 'span', { 'data-vibe-timecode': '' });
  const format = createElement(document, 'span', { 'data-vibe-format': '' });
  statusRow.append(statusLabel, statusText);
  trackRow.append(trackLabel, trackTitle);
  timerRow.append(timeCode, format);
  footer.append(statusRow, trackRow, timerRow);
  player.append(header, stage, footer, audio);

  const context = canvas.getContext?.('2d') ?? null;
  const shouldAnimate = () => !windowRef?.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const requestFrame = (callback) => windowRef?.requestAnimationFrame
    ? windowRef.requestAnimationFrame(callback)
    : windowRef?.setTimeout?.(() => callback(Date.now()), 1000 / 30);
  const cancelFrame = (id) => {
    if (windowRef?.cancelAnimationFrame) windowRef.cancelAnimationFrame(id);
    else if (windowRef?.clearTimeout) windowRef.clearTimeout(id);
  };

  function color(name, fallback) {
    return windowRef?.getComputedStyle(player).getPropertyValue(name).trim() || fallback;
  }

  function drawRadialTicks(time = 0) {
    if (!context) return;
    const dpr = Math.min(2, Math.max(1, windowRef?.devicePixelRatio || 1));
    if (canvas.width !== CANVAS_SIZE * dpr) {
      canvas.width = CANVAS_SIZE * dpr;
      canvas.height = CANVAS_SIZE * dpr;
    }
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    context.lineWidth = 1.25;
    context.lineCap = 'square';

    const center = CANVAS_SIZE / 2;
    const baseRadius = 91;
    const tickCount = 112;
    const ink = color('--vibe-ink', '#f2f6ff');
    const muted = color('--vibe-muted', '#8296b8');
    const accent = color('--vibe-accent', '#748bff');
    context.strokeStyle = status === 'playing' ? accent : muted;
    context.globalAlpha = status === 'playing' ? 0.9 : 0.64;

    for (let index = 0; index < tickCount; index += 1) {
      const angle = (index / tickCount) * Math.PI * 2;
      const wave = Math.sin(index * 0.36 + time * 3.2) * Math.cos(index * 0.13 - time * 1.8);
      const level = status === 'playing' ? Math.max(0, wave) * 20 : (index % 8 === 0 ? 3 : 0);
      const tickLength = 3 + level;
      context.save();
      context.translate(center, center);
      context.rotate(angle);
      context.beginPath();
      context.moveTo(0, -baseRadius);
      context.lineTo(0, -baseRadius - tickLength);
      context.stroke();
      context.restore();
    }

    context.globalAlpha = 0.48;
    context.strokeStyle = ink;
    context.beginPath();
    context.arc(center, center, 7, 0, Math.PI * 2);
    context.stroke();
    context.globalAlpha = 1;
  }

  function renderTimecode() {
    timeCode.textContent = formatTimecode(audio.currentTime);
  }

  function renderStatus() {
    player.dataset.vibeStatus = status;
    statusText.textContent = i18n.t(statusKey(status));
    playGlyph.textContent = status === 'playing' ? '■' : '▶';
    playButton.setAttribute('aria-pressed', String(status === 'playing'));
    playButton.setAttribute('aria-label', i18n.t(
      status === 'playing' ? 'content.vibePause' : 'content.vibePlay',
    ));
    renderTimecode();
  }

  function stopFrameLoop() {
    if (frameId !== null) cancelFrame(frameId);
    frameId = null;
  }

  function tick(time) {
    frameId = null;
    if (destroyed) return;
    drawRadialTicks(time / 1000);
    renderTimecode();
    if (status === 'playing' && shouldAnimate()) frameId = requestFrame(tick);
  }

  function syncFrameLoop() {
    stopFrameLoop();
    drawRadialTicks(0);
    if (status === 'playing' && shouldAnimate()) frameId = requestFrame(tick);
  }

  function setStatus(nextStatus) {
    status = nextStatus;
    renderStatus();
    syncFrameLoop();
  }

  function notifyOpenState() {
    subscribers.forEach((listener) => listener(isOpen));
  }

  function setOpen(nextOpen) {
    isOpen = Boolean(nextOpen);
    player.hidden = !isOpen;
    player.dataset.vibeOpen = String(isOpen);
    notifyOpenState();
  }

  function open() {
    if (destroyed) return;
    setOpen(true);
    drawRadialTicks(0);
  }

  function close() {
    if (status === 'playing') {
      audio.pause();
      setStatus('paused');
    }
    setOpen(false);
  }

  function togglePlayback() {
    if (status === 'playing') {
      audio.pause();
      setStatus('paused');
      return;
    }
    if (status === 'ended' || status === 'unavailable') {
      audio.currentTime = 0;
      setStatus('idle');
    }
    Promise.resolve(audio.play()).then(() => {
      if (!destroyed && isOpen) setStatus('playing');
    }).catch(() => {
      if (!destroyed) setStatus('unavailable');
    });
  }

  function syncLocale() {
    player.setAttribute('aria-label', i18n.t('content.vibePlayer'));
    reference.textContent = 'V - 01';
    source.textContent = i18n.t('content.vibeAudioInput');
    closeButton.setAttribute('aria-label', i18n.t('content.vibeClose'));
    statusLabel.textContent = i18n.t('content.vibeStatusLabel');
    trackLabel.textContent = i18n.t('content.vibeTrackLabel');
    trackTitle.textContent = pick(VIBE_TRACK.title, i18n.locale);
    format.textContent = VIBE_TRACK.format;
    renderStatus();
  }

  const onEnded = () => setStatus('ended');
  const onError = () => {
    if (status === 'playing') setStatus('unavailable');
  };
  const onTimeUpdate = () => renderTimecode();
  audio.addEventListener('ended', onEnded);
  audio.addEventListener('error', onError);
  audio.addEventListener('timeupdate', onTimeUpdate);
  playButton.addEventListener('click', togglePlayback);
  closeButton.addEventListener('click', close);

  syncLocale();

  return {
    element: player,
    open,
    close,
    isOpen() { return isOpen; },
    refresh() { drawRadialTicks(0); },
    subscribe(listener) {
      subscribers.add(listener);
      listener(isOpen);
      return () => subscribers.delete(listener);
    },
    syncLocale,
    dispose() {
      destroyed = true;
      stopFrameLoop();
      audio.pause();
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.src = '';
      subscribers.clear();
    },
  };
}
