import { pick } from '../data/content.js';
import { tracks } from '../../media/catalog.js';

const CANVAS_SIZE = 248;
const FRAME_RATE = 30;
const DEFAULT_VOLUME = 0.2;

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

export function renderArticleVibe({ document, i18n }) {
  const windowRef = document.defaultView;
  const audio = document.createElement('audio');
  audio.preload = 'metadata';
  audio.loop = true;
  audio.volume = DEFAULT_VOLUME;
  audio.setAttribute('data-vibe-audio', '');
  audio.setAttribute('loop', '');
  audio.setAttribute('aria-hidden', 'true');
  audio.hidden = true;

  let currentTrackIndex = 0;
  let status = 'idle';
  let isOpen = false;
  let view = 'expanded';
  let frameId = null;
  let destroyed = false;
  const subscribers = new Set();

  const player = createElement(document, 'section', {
    'data-vibe-player': '',
    'data-vibe-status': status,
    'data-vibe-open': 'false',
    'data-vibe-view': view,
    'aria-label': i18n.t('content.vibePlayer'),
    hidden: '',
  });
  const header = createElement(document, 'header', { 'data-vibe-player-header': '' });
  const headerMeta = createElement(document, 'div', { 'data-vibe-player-header-meta': '' });
  const headerActions = createElement(document, 'div', { 'data-vibe-player-header-actions': '' });
  const reference = createElement(document, 'span', { 'data-vibe-reference': '' });
  const source = createElement(document, 'span', { 'data-vibe-source': '' });
  const collapseButton = createElement(document, 'button', {
    type: 'button',
    'data-vibe-collapse': '',
    'aria-label': i18n.t('content.vibeCollapse'),
  }, '−');
  const closeButton = createElement(document, 'button', {
    type: 'button',
    'data-vibe-close': '',
    'aria-label': i18n.t('content.vibeClose'),
  }, '×');
  headerMeta.append(reference, source);
  headerActions.append(collapseButton, closeButton);
  header.append(headerMeta, headerActions);

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
    draggable: 'false',
  });
  const playGlyph = createElement(document, 'span', {
    'data-vibe-play-glyph': '',
    'aria-hidden': 'true',
  });
  pulse.append(pulseCircle);
  playButton.append(playGlyph);
  hud.append(radialTrack, canvas, pulse, playButton);

  const coverBand = createElement(document, 'div', {
    'data-vibe-cover-band': '',
    'data-vibe-cover': 'empty',
    'aria-hidden': 'true',
  });
  const coverImage = createElement(document, 'img', {
    'data-vibe-cover-image': '',
    alt: '',
  });
  coverBand.append(coverImage);
  stage.append(coverBand, hud);

  const footer = createElement(document, 'footer', { 'data-vibe-player-footer': '' });
  const trackRow = createElement(document, 'div', { 'data-vibe-track-row': '' });
  const trackLabel = createElement(document, 'span', { 'data-vibe-track-label': '' });
  const trackControls = createElement(document, 'div', { 'data-vibe-track-controls': '' });
  const previousButton = createElement(document, 'button', {
    type: 'button',
    'data-vibe-prev': '',
    'aria-label': i18n.t('content.vibePrevious'),
  }, '‹');
  const trackSelect = createElement(document, 'select', {
    'data-vibe-track-select': '',
    'data-vibe-track-title': '',
    'aria-label': i18n.t('content.vibeTrackSelect'),
  });
  const nextButton = createElement(document, 'button', {
    type: 'button',
    'data-vibe-next': '',
    'aria-label': i18n.t('content.vibeNext'),
  }, '›');
  tracks.forEach((track, index) => {
    trackSelect.append(createElement(document, 'option', {
      value: String(index),
    }, pick(track.title, i18n.locale)));
  });
  trackControls.append(previousButton, trackSelect, nextButton);
  const timerRow = createElement(document, 'div', { 'data-vibe-timer': '' });
  const timeCode = createElement(document, 'span', { 'data-vibe-timecode': '' });
  const format = createElement(document, 'span', { 'data-vibe-format': '' });
  const volumeRow = createElement(document, 'div', { 'data-vibe-volume-row': '' });
  const volumeLabel = createElement(document, 'label', {
    'data-vibe-volume-label': '',
    for: 'vibe-volume',
  });
  const volumeRange = createElement(document, 'input', {
    id: 'vibe-volume',
    type: 'range',
    min: '0',
    max: '1',
    step: '0.01',
    value: String(DEFAULT_VOLUME),
    'data-vibe-volume': '',
    'aria-label': i18n.t('content.vibeVolume'),
  });
  const volumeValue = createElement(document, 'output', { 'data-vibe-volume-value': '' });
  trackRow.append(trackLabel, trackControls);
  timerRow.append(timeCode, format);
  volumeRow.append(volumeLabel, volumeRange, volumeValue);
  footer.append(trackRow, volumeRow, timerRow);

  const compactView = createElement(document, 'div', {
    'data-vibe-compact-view': '',
    'aria-label': i18n.t('content.vibePlayer'),
  });
  const compactPlayButton = createElement(document, 'button', {
    type: 'button',
    'data-vibe-compact-play': '',
    'aria-pressed': 'false',
    'aria-label': i18n.t('content.vibePlay'),
    draggable: 'false',
  });
  const compactPlayGlyph = createElement(document, 'span', {
    'data-vibe-compact-play-glyph': '',
    'aria-hidden': 'true',
  });
  const compactTrack = createElement(document, 'span', {
    'data-vibe-compact-track': '',
    'aria-hidden': 'true',
  });
  const expandButton = createElement(document, 'button', {
    type: 'button',
    'data-vibe-expand': '',
    'aria-label': i18n.t('content.vibeExpand'),
  }, '↗');
  compactPlayButton.append(compactPlayGlyph);
  compactView.append(compactPlayButton, compactTrack, expandButton);

  player.append(header, stage, footer, compactView, audio);
  audio.src = tracks[0]?.file ?? '';

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

  function currentTrack() {
    return tracks[currentTrackIndex] ?? tracks[0];
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

    context.globalAlpha = 1;
  }

  function renderTimecode() {
    timeCode.textContent = formatTimecode(audio.currentTime);
  }

  function renderVolume() {
    const percentage = Math.round(audio.volume * 100);
    volumeRange.value = String(audio.volume);
    volumeValue.textContent = `${percentage}%`;
  }

  function renderTrack() {
    const track = currentTrack();
    if (!track) return;
    trackSelect.value = String(currentTrackIndex);
    compactTrack.textContent = `${pad2(currentTrackIndex + 1)} / ${pad2(tracks.length)}`;
    format.textContent = track.format;
    if (track.coverImage) {
      coverImage.src = track.coverImage;
      coverBand.dataset.vibeCover = 'image';
    } else {
      coverImage.removeAttribute('src');
      coverBand.dataset.vibeCover = 'empty';
    }
  }

  function renderStatus() {
    player.dataset.vibeStatus = status;
    const glyph = status === 'playing' ? '■' : '▶';
    const icon = status === 'playing' ? 'pause' : 'play';
    playGlyph.textContent = glyph;
    compactPlayGlyph.textContent = glyph;
    playGlyph.dataset.vibeGlyph = icon;
    compactPlayGlyph.dataset.vibeGlyph = icon;
    const isPlaying = status === 'playing';
    playButton.setAttribute('aria-pressed', String(isPlaying));
    compactPlayButton.setAttribute('aria-pressed', String(isPlaying));
    const label = i18n.t(isPlaying ? 'content.vibePause' : 'content.vibePlay');
    playButton.setAttribute('aria-label', label);
    compactPlayButton.setAttribute('aria-label', label);
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

  function setView(nextView) {
    view = nextView === 'compact' ? 'compact' : 'expanded';
    player.dataset.vibeView = view;
  }

  function open() {
    if (destroyed) return;
    setView('expanded');
    setOpen(true);
    drawRadialTicks(0);
  }

  function expand() {
    if (destroyed) return;
    setView('expanded');
    setOpen(true);
    drawRadialTicks(0);
  }

  function collapse() {
    if (destroyed) return;
    setView('compact');
    setOpen(true);
  }

  function close() {
    if (status === 'playing') {
      audio.pause();
      setStatus('paused');
    }
    setView('expanded');
    setOpen(false);
  }

  function togglePlayback() {
    if (status === 'playing') {
      audio.pause();
      setStatus('paused');
      return;
    }
    if (status === 'unavailable') {
      audio.currentTime = 0;
      setStatus('idle');
    }
    Promise.resolve(audio.play()).then(() => {
      if (!destroyed) setStatus('playing');
    }).catch(() => {
      if (!destroyed) setStatus('unavailable');
    });
  }

  function selectTrack(nextIndex, { autoplay = false } = {}) {
    if (!tracks.length) return;
    const wasPlaying = status === 'playing';
    audio.pause();
    currentTrackIndex = ((nextIndex % tracks.length) + tracks.length) % tracks.length;
    audio.currentTime = 0;
    audio.src = currentTrack().file;
    try {
      audio.load();
    } catch {
      // The browser can still load the source on the next play call.
    }
    setStatus('idle');
    renderTrack();
    if (autoplay || wasPlaying) {
      Promise.resolve(audio.play()).then(() => {
        if (!destroyed) setStatus('playing');
      }).catch(() => {
        if (!destroyed) setStatus('unavailable');
      });
    }
  }

  function syncLocale() {
    player.setAttribute('aria-label', i18n.t('content.vibePlayer'));
    compactView.setAttribute('aria-label', i18n.t('content.vibePlayer'));
    reference.textContent = 'V - 01';
    source.textContent = i18n.t('content.vibeAudioInput');
    collapseButton.setAttribute('aria-label', i18n.t('content.vibeCollapse'));
    closeButton.setAttribute('aria-label', i18n.t('content.vibeClose'));
    expandButton.setAttribute('aria-label', i18n.t('content.vibeExpand'));
    previousButton.setAttribute('aria-label', i18n.t('content.vibePrevious'));
    nextButton.setAttribute('aria-label', i18n.t('content.vibeNext'));
    trackSelect.setAttribute('aria-label', i18n.t('content.vibeTrackSelect'));
    volumeLabel.textContent = i18n.t('content.vibeVolume');
    volumeRange.setAttribute('aria-label', i18n.t('content.vibeVolume'));
    tracks.forEach((track, index) => {
      const option = trackSelect.options[index];
      if (option) option.textContent = pick(track.title, i18n.locale);
    });
    trackLabel.textContent = i18n.t('content.vibeTrackLabel');
    renderTrack();
    renderVolume();
    renderStatus();
  }

  const onError = () => {
    if (!destroyed) setStatus('unavailable');
  };
  const onTimeUpdate = () => renderTimecode();
  const onVolumeInput = () => {
    audio.volume = Number(volumeRange.value);
    renderVolume();
  };
  const onTrackChange = () => selectTrack(Number(trackSelect.value));
  const onPrevious = () => selectTrack(currentTrackIndex - 1);
  const onNext = () => selectTrack(currentTrackIndex + 1);
  audio.addEventListener('error', onError);
  audio.addEventListener('timeupdate', onTimeUpdate);
  playButton.addEventListener('click', togglePlayback);
  compactPlayButton.addEventListener('click', togglePlayback);
  collapseButton.addEventListener('click', collapse);
  expandButton.addEventListener('click', expand);
  closeButton.addEventListener('click', close);
  previousButton.addEventListener('click', onPrevious);
  nextButton.addEventListener('click', onNext);
  trackSelect.addEventListener('change', onTrackChange);
  volumeRange.addEventListener('input', onVolumeInput);

  syncLocale();

  return {
    element: player,
    open,
    expand,
    collapse,
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
      audio.removeEventListener('error', onError);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      playButton.removeEventListener('click', togglePlayback);
      compactPlayButton.removeEventListener('click', togglePlayback);
      collapseButton.removeEventListener('click', collapse);
      expandButton.removeEventListener('click', expand);
      closeButton.removeEventListener('click', close);
      previousButton.removeEventListener('click', onPrevious);
      nextButton.removeEventListener('click', onNext);
      trackSelect.removeEventListener('change', onTrackChange);
      volumeRange.removeEventListener('input', onVolumeInput);
      audio.src = '';
      subscribers.clear();
    },
  };
}
