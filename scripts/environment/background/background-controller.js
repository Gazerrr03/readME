import { DESKTOP_BACKGROUND } from './background-assets.js';

function createBackgroundImage(document, asset) {
  const image = document.createElement('img');
  image.dataset.environmentBackground = '';
  image.dataset.backgroundId = asset.id;
  image.alt = asset.alt ?? '';
  image.decoding = 'async';
  image.draggable = false;
  image.src = asset.src;
  image.style.setProperty('--background-fit', asset.fit ?? 'cover');
  image.style.setProperty('--background-position', asset.position ?? 'center center');
  image.setAttribute('aria-hidden', 'true');
  return image;
}

export function createDesktopBackground({
  document,
  asset = DESKTOP_BACKGROUND,
}) {
  const element = createBackgroundImage(document, asset);

  return {
    element,
    setMotionState(motion) {
      element.dataset.backgroundMotion = motion;
    },
    destroy() {
      element.remove();
    },
  };
}
