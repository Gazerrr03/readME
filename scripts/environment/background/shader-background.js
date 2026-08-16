import { FRAGMENT_SHADER_SOURCE, VERTEX_SHADER_SOURCE } from './shader-source.js';

const FALLBACK_COLOR = '#173B5D';

export const MOTION_CONFIG = Object.freeze({
  running: Object.freeze({ speed: 0.010, density: 0.045, contrast: 0.92 }),
  focused: Object.freeze({ speed: 0.0025, density: 0.020, contrast: 0.72 }),
  static: Object.freeze({ speed: 0, density: 0.030, contrast: 0.82 }),
});

export function getMotionConfig(motion) {
  return MOTION_CONFIG[motion] ?? MOTION_CONFIG.static;
}

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
    return canvas.getContext?.('webgl2', {
      alpha: false,
      antialias: false,
      premultipliedAlpha: false,
    }) ?? null;
  } catch {
    return null;
  }
}

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || 'Shader compilation failed';
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

function createRenderer(canvas, gl) {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE);
  const program = gl.createProgram();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) || 'Shader program link failed';
    gl.deleteProgram(program);
    throw new Error(message);
  }

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1,
    3, -1,
    -1, 3,
  ]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const uniforms = {
    resolution: gl.getUniformLocation(program, 'u_resolution'),
    time: gl.getUniformLocation(program, 'u_time'),
    motion: gl.getUniformLocation(program, 'u_motion'),
    density: gl.getUniformLocation(program, 'u_density'),
    contrast: gl.getUniformLocation(program, 'u_contrast'),
  };
  const view = canvas.ownerDocument?.defaultView;

  const resize = () => {
    const rect = canvas.getBoundingClientRect?.();
    const cssWidth = rect?.width || view?.innerWidth || 1;
    const cssHeight = rect?.height || view?.innerHeight || 1;
    const pixelRatio = Math.min(view?.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.floor(cssWidth * pixelRatio));
    const height = Math.max(1, Math.floor(cssHeight * pixelRatio));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    gl.viewport(0, 0, width, height);
  };

  const render = (time, config) => {
    resize();
    gl.useProgram(program);
    gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
    gl.uniform1f(uniforms.time, time / 1000);
    gl.uniform1f(uniforms.motion, config.speed);
    gl.uniform1f(uniforms.density, config.density);
    gl.uniform1f(uniforms.contrast, config.contrast);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const destroy = () => {
    gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
  };

  return { render, resize, destroy };
}

export function createShaderBackground({ document, asset }) {
  const canvas = createCanvas(document, asset);
  const gl = createShaderContext(canvas);
  let renderer = null;

  if (gl) {
    try {
      renderer = createRenderer(canvas, gl);
      renderer.render(0, getMotionConfig('static'));
      canvas.dataset.backgroundRenderer = 'webgl2';
    } catch {
      renderer = null;
      canvas.dataset.backgroundFallback = 'shader-unavailable';
    }
  } else {
    canvas.dataset.backgroundFallback = 'shader-unavailable';
  }

  return {
    element: canvas,
    setMotionState(motion) {
      canvas.dataset.backgroundMotion = motion;
      renderer?.render(0, getMotionConfig(motion));
    },
    destroy() {
      renderer?.destroy();
      canvas.remove();
    },
  };
}
