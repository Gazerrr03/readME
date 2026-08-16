const FALLBACK_COLOR = '#173B5D';

function createCanvas(document, asset) {
  const canvas = document.createElement('canvas');
  canvas.dataset.environmentBackground = '';
  canvas.dataset.backgroundId = asset.id;
  canvas.dataset.backgroundKind = 'shader';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.backgroundColor = FALLBACK_COLOR;
  return canvas;
}

function createShaderContext(canvas) {
  try {
    return canvas.getContext?.('webgl2') ?? null;
  } catch {
    return null;
  }
}

export function createShaderBackground({ document, asset }) {
  const canvas = createCanvas(document, asset);
  const gl = createShaderContext(canvas);

  if (gl) {
    canvas.dataset.backgroundRenderer = 'webgl2';
  } else {
    canvas.dataset.backgroundFallback = 'shader-unavailable';
  }

  return {
    element: canvas,
    setMotionState(motion) {
      canvas.dataset.backgroundMotion = motion;
    },
    destroy() {
      canvas.remove();
    },
  };
}
