const AVATAR_URL = new URL('../../assets/about/ryo.jpg', import.meta.url).href;
const ASCII_GLYPHS = ' .,:;irsXA253hMHGS#9B&@';
const MONO_FONT = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
let avatarImagePromise;

function createElement(document, tagName, attributes = {}, text = '') {
  const element = document.createElement(tagName);
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
  element.textContent = text;
  return element;
}

function getAvatarImage(document) {
  if (!avatarImagePromise) {
    avatarImagePromise = new Promise((resolve, reject) => {
      const image = new document.defaultView.Image();
      image.addEventListener('load', () => resolve(image), { once: true });
      image.addEventListener('error', () => reject(new Error('About avatar failed to load')), { once: true });
      image.src = AVATAR_URL;
    });
  }
  return avatarImagePromise;
}

function drawBanner(canvas) {
  const view = canvas.ownerDocument.defaultView;
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;

  const dpr = Math.min(view.devicePixelRatio || 1, 2);
  const width = Math.round(rect.width * dpr);
  const height = Math.round(rect.height * dpr);
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) return;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, rect.width, rect.height);

  const gradient = context.createLinearGradient(0, 0, rect.width, rect.height * 0.4);
  gradient.addColorStop(0, '#0D1117');
  gradient.addColorStop(0.42, '#182A46');
  gradient.addColorStop(0.72, '#284779');
  gradient.addColorStop(1, '#428FDC');
  context.fillStyle = gradient;
  context.fillRect(0, 0, rect.width, rect.height);

  const glow = context.createRadialGradient(
    rect.width * 0.82,
    rect.height * 0.18,
    0,
    rect.width * 0.82,
    rect.height * 0.18,
    rect.width * 0.7,
  );
  glow.addColorStop(0, 'rgba(157, 199, 241, 0.28)');
  glow.addColorStop(1, 'rgba(157, 199, 241, 0)');
  context.fillStyle = glow;
  context.fillRect(0, 0, rect.width, rect.height);

  context.strokeStyle = 'rgba(157, 199, 241, 0.24)';
  context.lineWidth = 1;
  for (let x = 0; x <= rect.width; x += rect.width / 10) {
    context.beginPath();
    context.moveTo(Math.round(x) + 0.5, 0);
    context.lineTo(Math.round(x) + 0.5, rect.height);
    context.stroke();
  }
  for (let y = 0; y <= rect.height; y += rect.height / 5) {
    context.beginPath();
    context.moveTo(0, Math.round(y) + 0.5);
    context.lineTo(rect.width, Math.round(y) + 0.5);
    context.stroke();
  }

  const ringX = rect.width * 0.86;
  const ringY = rect.height * 0.5;
  context.setLineDash([2, 5]);
  context.strokeStyle = 'rgba(217, 232, 248, 0.5)';
  [rect.height * 0.28, rect.height * 0.2].forEach((radius) => {
    context.beginPath();
    context.arc(ringX, ringY, radius, 0, Math.PI * 2);
    context.stroke();
  });
  context.setLineDash([]);
  context.fillStyle = '#FFFFFF';
  context.fillRect(ringX - 2, ringY - 2, 4, 4);

  context.font = `9px ${MONO_FONT}`;
  context.textBaseline = 'top';
  for (let y = 12; y < rect.height - 8; y += 13) {
    for (let x = 8; x < rect.width - 8; x += 10) {
      const index = Math.abs((x / 10 + y / 13) % (ASCII_GLYPHS.length - 4));
      if (index > 2 && (x + y) % 3 !== 0) continue;
      context.fillStyle = `rgba(217, 232, 248, ${0.16 + (index / ASCII_GLYPHS.length) * 0.22})`;
      context.fillText(ASCII_GLYPHS[Math.floor(index) + 2], x, y);
    }
  }
}

function drawAvatar(canvas, image) {
  const columns = 24;
  const rows = 24;
  const cellSize = 10;
  const sampleCanvas = canvas.ownerDocument.createElement('canvas');
  sampleCanvas.width = columns;
  sampleCanvas.height = rows;
  const sampleContext = sampleCanvas.getContext('2d', { willReadFrequently: true });
  const context = canvas.getContext('2d');
  if (!sampleContext || !context) return;

  sampleContext.drawImage(image, 0, 0, columns, rows);
  const pixels = sampleContext.getImageData(0, 0, columns, rows).data;
  canvas.width = columns * cellSize;
  canvas.height = rows * cellSize;
  context.fillStyle = '#FFFFFF';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.font = `10px ${MONO_FONT}`;
  context.textBaseline = 'top';

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const pixel = (row * columns + column) * 4;
      const luminance = (
        pixels[pixel] * 0.2126
        + pixels[pixel + 1] * 0.7152
        + pixels[pixel + 2] * 0.0722
      );
      const glyphIndex = Math.round(((255 - luminance) / 255) * (ASCII_GLYPHS.length - 1));
      const glyph = ASCII_GLYPHS[glyphIndex];
      if (glyph === ' ') continue;
      const opacity = 0.2 + (glyphIndex / (ASCII_GLYPHS.length - 1)) * 0.8;
      context.fillStyle = `rgba(24, 59, 155, ${opacity})`;
      context.fillText(glyph, column * cellSize, row * cellSize);
    }
  }
}

function observeBanner(canvas) {
  const view = canvas.ownerDocument.defaultView;
  const redraw = () => {
    if (!canvas.isConnected) return;
    drawBanner(canvas);
  };
  view.requestAnimationFrame(redraw);
  if (!view.ResizeObserver) return;

  const observer = new view.ResizeObserver(() => {
    if (!canvas.isConnected) {
      observer.disconnect();
      return;
    }
    redraw();
  });
  observer.observe(canvas);
}

export function createAboutBanner({ document, i18n }) {
  const root = createElement(document, 'div', { 'data-about-banner': '' });
  const canvas = createElement(document, 'canvas', { 'data-about-banner-canvas': '', 'aria-hidden': 'true' });
  const copy = createElement(document, 'div', { 'data-about-banner-copy': '' });
  const kicker = createElement(document, 'span', { 'data-about-banner-kicker': '' });
  const trail = createElement(document, 'span', { 'data-about-banner-trail': '' });
  copy.append(kicker, trail);
  root.append(canvas, copy);

  const render = () => {
    kicker.textContent = i18n.t('about.bannerLabel');
    trail.textContent = i18n.t('about.bannerTrail');
  };
  render();
  observeBanner(canvas);
  return root;
}

export function createAboutAvatar({ document, i18n }) {
  const root = createElement(document, 'div', { 'data-about-avatar-frame': '' });
  const label = createElement(document, 'span', { 'data-about-avatar-label': '' });
  const canvas = createElement(document, 'canvas', {
    'data-about-avatar': '',
    role: 'img',
  });
  const fallback = createElement(document, 'img', {
    'data-about-avatar-fallback': '',
    src: AVATAR_URL,
    alt: '',
  });
  root.append(label, canvas, fallback);

  const render = () => {
    label.textContent = i18n.t('about.avatarLabel');
    canvas.setAttribute('aria-label', i18n.t('about.avatarAlt'));
    fallback.setAttribute('alt', i18n.t('about.avatarAlt'));
  };
  render();
  root.dataset.aboutAvatarState = 'loading';
  canvas.dataset.aboutAvatarState = 'loading';
  getAvatarImage(document)
    .then((image) => {
      if (!canvas.isConnected) return;
      drawAvatar(canvas, image);
      root.dataset.aboutAvatarState = 'ready';
      canvas.dataset.aboutAvatarState = 'ready';
    })
    .catch(() => {
      root.dataset.aboutAvatarState = 'fallback';
      canvas.dataset.aboutAvatarState = 'fallback';
    });
  return root;
}
