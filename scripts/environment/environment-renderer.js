import { getQuietZoneOpacity } from './environment-state.js';

const BLUE = '#26159a';
const WHITE = '#ffffff';
const GLYPHS = ' .:-=+*#%@';
const FRAME_INTERVAL = 100;
const CELL_WIDTH = 11;
const CELL_HEIGHT = 14;

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
    if (!hasTerrain) {
      const horizon = rows * 0.55;
      return row < horizon ? 8 : Math.min(220, 72 + (row - horizon) * 18);
    }
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
    context.font = `700 ${CELL_HEIGHT - 2}px ui-monospace, monospace`;
    context.textBaseline = 'top';
    const columns = Math.max(1, Math.ceil(width / CELL_WIDTH));
    const rows = Math.max(1, Math.ceil(height / CELL_HEIGHT));
    const windDirection = dampedPointer.x < 0.5 ? -1 : 1;
    const windOffset = (frame * windDirection + Math.round((dampedPointer.x - 0.5) * 8)) % columns;
    const density = 0.2 + dampedPointer.y * 0.8;
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const x = column * CELL_WIDTH;
        const y = row * CELL_HEIGHT;
        const quietOpacity = getQuietZoneOpacity({ x, y }, quietZones);
        if (quietOpacity <= 0.04) continue;
        const terrain = sampleTerrain(column, row, columns, rows);
        const wave = row > rows * 0.55 ? Math.sin((column + windOffset) * 0.25 + frame * 0.2) * 18 : 0;
        const wind = row < rows * 0.58 && (column + windOffset) % 17 === 0 ? 34 : 0;
        const densitySample = ((column * 17 + row * 31 + frame * 7) % 100) / 100;
        if (densitySample > density) continue;
        const level = Math.max(0, Math.min(255, terrain + wave + wind));
        const glyph = GLYPHS[Math.min(GLYPHS.length - 1, Math.floor(level / 256 * GLYPHS.length))];
        if (glyph === ' ') continue;
        context.globalAlpha = quietOpacity;
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
      geometry = { width, height, dpr: Math.min(2, Math.max(1, dpr || 1)), quietZones };
      canvas.width = Math.round(width * geometry.dpr);
      canvas.height = Math.round(height * geometry.dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      draw();
    },
    setPointer(next) {
      if (!destroyed && motion !== 'focused') pointer = { x: next.x, y: next.y };
    },
    setMotionState(next) {
      if (destroyed) return;
      motion = next;
      stop();
      draw();
      if (motion === 'running') frameId = scheduler.request(tick);
    },
    renderStatic() { stop(); draw(); },
    getDebugState() { return { motion, destroyed, frame }; },
    destroy() { destroyed = true; stop(); },
  };
}
