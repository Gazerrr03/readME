import { getQuietZoneOpacity } from './environment-state.js';
import { QIFENG_SCENE } from './qifeng-scene.js';

const FRAME_INTERVAL = 100;
const FONT_FAMILY = 'ui-monospace, monospace';
const ASCII_GLYPHS = ' .,:;irsXA253hMHGS#9B&@';
const NEBULA_GLYPHS = ' .,:;+=*';
const NEBULA_STEP = 2;
const SCENE_PERIOD = 21_000;
const NEBULA_PERIOD = 60_000;
const RIPPLE_RADIUS = 160;
const RIPPLE_WAVELENGTH = 0.075;
const RIPPLE_DISPLACEMENT = 10;

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function smoothstep(edge0, edge1, value) {
  const normalized = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return normalized * normalized * (3 - 2 * normalized);
}

function isScene(value) {
  return value
    && Number.isInteger(value.width)
    && Number.isInteger(value.height)
    && Array.isArray(value.values)
    && value.values.length === value.width * value.height;
}

export function createEnvironmentRenderer({
  canvas,
  scene = QIFENG_SCENE,
  scheduler = {
    request: (callback) => requestAnimationFrame(callback),
    cancel: (id) => cancelAnimationFrame(id),
  },
}) {
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D context unavailable');

  const activeScene = isScene(scene) ? scene : QIFENG_SCENE;
  let geometry = { width: 1, height: 1, dpr: 1, quietZones: [] };
  let pointer = { x: 0.5, y: 0.5 };
  let dampedPointer = { ...pointer };
  let pointerEnergy = 0;
  let motion = 'static';
  let frameId = null;
  let lastDraw = -FRAME_INTERVAL;
  let lastTime = null;
  let elapsed = 0;
  let frame = 0;
  let destroyed = false;

  const quietOpacityAt = (x, y) => getQuietZoneOpacity({ x, y }, geometry.quietZones);

  const getSceneLayout = () => {
    const { width, height } = geometry;
    const sourceAspect = activeScene.width / activeScene.height;
    const targetAspect = width / Math.max(1, height);
    const visibleWidth = targetAspect < sourceAspect
      ? Math.max(1, Math.floor(activeScene.height * targetAspect))
      : activeScene.width;
    const visibleHeight = targetAspect > sourceAspect
      ? Math.max(1, Math.floor(activeScene.width / targetAspect))
      : activeScene.height;
    return {
      visibleWidth,
      visibleHeight,
      cropX: Math.floor((activeScene.width - visibleWidth) / 2),
      cropY: Math.floor((activeScene.height - visibleHeight) / 2),
      cellWidth: width / visibleWidth,
      cellHeight: height / visibleHeight,
    };
  };

  const getSceneValue = (layout, column, row) => {
    const sourceX = Math.min(activeScene.width - 1, layout.cropX + column);
    const sourceY = Math.min(activeScene.height - 1, layout.cropY + row);
    return activeScene.values[sourceY * activeScene.width + sourceX];
  };

  const getSceneOffset = () => {
    const amplitude = clamp(geometry.width * 0.006, 3, 9);
    return Math.sin((elapsed % SCENE_PERIOD) / SCENE_PERIOD * Math.PI * 2) * amplitude;
  };

  const getPointerRipple = (x, y) => {
    const pointerX = dampedPointer.x * geometry.width;
    const pointerY = dampedPointer.y * geometry.height;
    const deltaX = x - pointerX;
    const deltaY = y - pointerY;
    const distance = Math.hypot(deltaX, deltaY);
    const envelope = Math.exp(-(distance * distance) / (2 * RIPPLE_RADIUS ** 2));
    const wave = Math.sin(distance * RIPPLE_WAVELENGTH - elapsed / 650)
      * pointerEnergy * envelope;
    if (distance === 0) return { x: 0, y: 0, value: wave * 32 };
    const displacement = wave * RIPPLE_DISPLACEMENT / distance;
    return {
      x: deltaX * displacement,
      y: deltaY * displacement,
      value: wave * 32,
    };
  };

  const getNebulaDensity = (x, y) => {
    const { width, height } = geometry;
    const normalizedX = x / Math.max(1, width);
    const normalizedY = y / Math.max(1, height);
    const phase = (elapsed % NEBULA_PERIOD) / NEBULA_PERIOD * Math.PI * 2;
    const firstCenter = 0.32 + Math.sin(normalizedX * 5.2 - phase * 0.8) * 0.12;
    const secondCenter = 0.68 + Math.sin(normalizedX * 4.1 + phase * 0.55) * 0.1;
    const firstCloud = Math.exp(-((normalizedY - firstCenter) ** 2) / (2 * 0.16 ** 2));
    const secondCloud = Math.exp(-((normalizedY - secondCenter) ** 2) / (2 * 0.2 ** 2));
    const texture = (
      Math.sin(normalizedX * 31 + normalizedY * 17 - phase * 1.4)
      + Math.sin(normalizedX * 13 - normalizedY * 29 + phase * 0.9)
      + 2
    ) / 4;
    const cloud = Math.max(
      firstCloud * (0.42 + texture * 0.58),
      secondCloud * (0.32 + texture * 0.48),
    );
    return smoothstep(0.28, 0.78, cloud);
  };

  const drawNebula = (layout) => {
    const { width, height } = geometry;
    const offsetX = Math.sin((elapsed % NEBULA_PERIOD) / NEBULA_PERIOD * Math.PI * 2) * width * 0.012;
    for (let row = 0; row < layout.visibleHeight; row += NEBULA_STEP) {
      for (let column = 0; column < layout.visibleWidth; column += NEBULA_STEP) {
        const baseX = column * layout.cellWidth + offsetX;
        const baseY = row * layout.cellHeight;
        if (baseX < -layout.cellWidth || baseX > width) continue;
        const ripple = getPointerRipple(baseX, baseY);
        const x = baseX + ripple.x;
        const y = baseY + ripple.y;
        const quietOpacity = quietOpacityAt(x, y);
        if (quietOpacity <= 0.04) continue;
        const sourceValue = getSceneValue(layout, column, row);
        const backgroundMask = 1 - smoothstep(12, 72, sourceValue);
        const density = getNebulaDensity(x, y) * backgroundMask;
        if (density < 0.26) continue;
        const glyphIndex = Math.min(
          NEBULA_GLYPHS.length - 1,
          1 + Math.floor(density * (NEBULA_GLYPHS.length - 2)),
        );
        const glyph = NEBULA_GLYPHS[glyphIndex];
        if (glyph === ' ') continue;
        context.globalAlpha = (0.03 + density * 0.11) * quietOpacity;
        context.fillText(glyph, x, y);
      }
    }
  };

  const drawAsciiScene = (layout) => {
    const { width } = geometry;
    const phase = elapsed / 1500;
    const offsetX = getSceneOffset();
    for (let row = 0; row < layout.visibleHeight; row += 1) {
      for (let column = 0; column < layout.visibleWidth; column += 1) {
        const sourceValue = getSceneValue(layout, column, row);
        const baseX = column * layout.cellWidth + offsetX;
        const baseY = row * layout.cellHeight;
        if (baseX < -layout.cellWidth || baseX > width) continue;
        const ripple = getPointerRipple(baseX, baseY);
        const x = baseX + ripple.x;
        const y = baseY + ripple.y;
        const quietOpacity = quietOpacityAt(x, y);
        if (quietOpacity <= 0.04) continue;
        const value = clamp(sourceValue + ripple.value + Math.sin(phase + row * 0.12) * 2, 0, 255);
        const glyphIndex = value <= 3
          ? 0
          : Math.min(
            ASCII_GLYPHS.length - 1,
            1 + Math.floor(((value - 4) / 252) * (ASCII_GLYPHS.length - 2)),
          );
        const glyph = ASCII_GLYPHS[glyphIndex];
        if (glyph === ' ') continue;
        context.globalAlpha = (0.28 + value / 255 * 0.34) * quietOpacity;
        context.fillText(glyph, x, y);
      }
    }
  };

  const draw = () => {
    const { width, height, dpr } = geometry;
    const layout = getSceneLayout();
    const fontSize = Math.max(5, Math.min(layout.cellWidth * 0.92, layout.cellHeight * 0.92));
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.fillStyle = activeScene.surface ?? QIFENG_SCENE.surface;
    context.fillRect(0, 0, width, height);
    context.fillStyle = activeScene.ink ?? QIFENG_SCENE.ink;
    context.textBaseline = 'top';
    context.font = `600 ${fontSize}px ${FONT_FAMILY}`;
    drawNebula(layout);
    drawAsciiScene(layout);
    context.globalAlpha = 1;
  };

  const tick = (time) => {
    frameId = null;
    if (destroyed || motion !== 'running') return;
    if (time - lastDraw >= FRAME_INTERVAL) {
      if (lastTime !== null) elapsed += Math.max(0, time - lastTime);
      lastTime = time;
      dampedPointer.x += (pointer.x - dampedPointer.x) * 0.12;
      dampedPointer.y += (pointer.y - dampedPointer.y) * 0.12;
      pointerEnergy *= 0.85;
      frame += 1;
      lastDraw = time;
      draw();
    }
    frameId = scheduler.request(tick);
  };

  const stop = () => {
    if (frameId !== null) scheduler.cancel(frameId);
    frameId = null;
  };

  return {
    resize({ width, height, dpr = 1, quietZones = [] }) {
      if (destroyed) return;
      geometry = { width, height, dpr: Math.min(2, Math.max(1, dpr || 1)), quietZones };
      canvas.width = Math.round(width * geometry.dpr);
      canvas.height = Math.round(height * geometry.dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      draw();
    },
    setPointer(next) {
      if (destroyed || motion === 'focused') return;
      pointerEnergy = Math.min(1, pointerEnergy + Math.hypot(next.x - pointer.x, next.y - pointer.y) * 6);
      pointer = { x: next.x, y: next.y };
    },
    setMotionState(next) {
      if (destroyed) return;
      motion = next;
      stop();
      if (motion === 'running') {
        lastDraw = -FRAME_INTERVAL;
        lastTime = null;
        frameId = scheduler.request(tick);
      } else {
        draw();
      }
    },
    renderStatic() {
      if (destroyed) return;
      stop();
      draw();
    },
    getDebugState() {
      return {
        motion,
        destroyed,
        frame,
        elapsed,
        sceneOffset: getSceneOffset(),
      };
    },
    destroy() {
      destroyed = true;
      stop();
    },
  };
}
