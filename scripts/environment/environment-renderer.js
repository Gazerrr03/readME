import { getQuietZoneOpacity } from './environment-state.js';

const BLUE = '#26159a';
const WHITE = '#ffffff';
// Paul Bourke's density-ordered ramp, darkest to lightest.
const GLYPHS = '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,"^`. ';
const FRAME_INTERVAL = 100;
const CELL_WIDTH = 3.6;
const CELL_HEIGHT = 6;
const FONT_SIZE = 6;
const INK_ALPHA = 0.45;

export function createEnvironmentRenderer({
  canvas,
  terrainMap,
  scheduler = {
    request: (callback) => requestAnimationFrame(callback),
    cancel: (id) => cancelAnimationFrame(id),
  },
}) {
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D context unavailable');
  let geometry = { width: 1, height: 1, dpr: 1, quietZones: [] };
  let pointer = { x: 0.5, y: 0.5 };
  let dampedPointer = { ...pointer };
  let pointerEnergy = 0;
  let motion = 'static';
  let frameId = null;
  let lastDraw = -FRAME_INTERVAL;
  let frame = 0;
  let destroyed = false;

  const hasTerrain = (
    Number.isInteger(terrainMap?.width)
    && Number.isInteger(terrainMap?.height)
    && terrainMap.values?.length === terrainMap.width * terrainMap.height
  );

  const sampleTerrain = (column, row, columns, rows) => {
    if (!hasTerrain) return 128;
    const sourceX = Math.min(terrainMap.width - 1, Math.floor(column / columns * terrainMap.width));
    const sourceY = Math.min(terrainMap.height - 1, Math.floor(row / rows * terrainMap.height));
    return terrainMap.values[sourceY * terrainMap.width + sourceX];
  };

  const draw = () => {
    const { width, height, dpr, quietZones } = geometry;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.fillStyle = BLUE;
    context.fillRect(0, 0, width, height);
    context.fillStyle = WHITE;
    context.font = `600 ${FONT_SIZE}px ui-monospace, monospace`;
    context.textBaseline = 'top';
    const columns = Math.max(1, Math.ceil(width / CELL_WIDTH));
    const rows = Math.max(1, Math.ceil(height / CELL_HEIGHT));
    const pointerX = dampedPointer.x * width;
    const pointerY = dampedPointer.y * height;
    const drift = frame * 0.06;
    const ripplePhase = frame * 0.18;
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const x = column * CELL_WIDTH;
        const y = row * CELL_HEIGHT;
        const quietOpacity = getQuietZoneOpacity({ x, y }, quietZones);
        if (quietOpacity <= 0.04) continue;
        const terrain = sampleTerrain(column, row, columns, rows);
        const driftWave = Math.sin(column * 0.2 + row * 0.11 + drift) * 7;
        const distance = Math.hypot(x - pointerX, y - pointerY);
        const ripple = Math.sin(distance * 0.045 - ripplePhase) * 30 * pointerEnergy
          * Math.exp(-(distance * distance) / (2 * 70 * 70));
        const level = Math.max(0, Math.min(255, terrain + driftWave + ripple));
        const glyph = GLYPHS[Math.min(GLYPHS.length - 1, Math.floor((255 - level) / 256 * GLYPHS.length))];
        if (glyph === ' ') continue;
        context.globalAlpha = INK_ALPHA * quietOpacity;
        context.fillText(glyph, x, y);
      }
    }
    context.globalAlpha = 1;
  };

  const tick = (time) => {
    frameId = null;
    if (destroyed || motion !== 'running') return;
    if (time - lastDraw >= FRAME_INTERVAL) {
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
    getDebugState() { return { motion, destroyed, frame }; },
    destroy() { destroyed = true; stop(); },
  };
}
