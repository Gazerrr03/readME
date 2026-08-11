/* Shared 1-bit pixel-art helpers. Art is authored as arrays of strings
   ('#' = ink) and compiled to a single SVG path, same convention as the
   icon templates in index.html. */

export function pixelsToPath(pixels) {
  return pixels.flatMap((row, y) => (
    [...row].map((cell, x) => (cell === '#' ? `M${x} ${y}h1v1h-1z` : ''))
  )).join('');
}

export function createPixelSvg(document, pixels, attributes = {}) {
  const width = pixels[0]?.length ?? 0;
  const height = pixels.length;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('fill', 'currentColor');
  svg.setAttribute('shape-rendering', 'crispEdges');
  svg.setAttribute('focusable', 'false');
  Object.entries(attributes).forEach(([name, value]) => svg.setAttribute(name, value));
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', pixelsToPath(pixels));
  svg.append(path);
  return svg;
}
