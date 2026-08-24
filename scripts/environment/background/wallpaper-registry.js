import {
  FLOW_SHARDS_CONTROLS,
  FLOW_SHARDS_DEFAULT_CONFIG,
  normalizeFlowShardsConfig,
} from './wallpapers/flow-shards/config.js';

export const DEFAULT_WALLPAPER_ID = 'blue-fluid-halftone';

const descriptors = Object.freeze([
  Object.freeze({
    id: DEFAULT_WALLPAPER_ID,
    kind: 'shader',
    title: Object.freeze({ en: 'Blue Fluid', 'zh-CN': '蓝色流体', ja: 'ブルーフルイド' }),
    description: Object.freeze({
      en: 'A quiet blue halftone current.',
      'zh-CN': '安静流动的蓝色半色调背景。',
      ja: '静かに流れる青いハーフトーン背景。',
    }),
    previewSrc: 'assets/background/previews/blue-fluid-halftone.png',
    defaultConfig: Object.freeze({}),
    controls: Object.freeze([]),
    loadRenderer: () => import('./shader-background.js'),
  }),
  Object.freeze({
    id: 'flow-shards',
    kind: 'three',
    title: Object.freeze({ en: 'Flow Shards', 'zh-CN': '流动晶片', ja: 'フローシャード' }),
    description: Object.freeze({
      en: 'Thousands of illuminated shards following a procedural flow field.',
      'zh-CN': '数千枚发光晶片沿程序化流场穿行。',
      ja: '数千の光るシャードがプロシージャルな流れを進みます。',
    }),
    previewSrc: 'assets/background/previews/flow-shards.png',
    defaultConfig: FLOW_SHARDS_DEFAULT_CONFIG,
    controls: FLOW_SHARDS_CONTROLS,
    loadRenderer: () => import('./wallpapers/flow-shards/index.js'),
  }),
]);

export function getWallpaperDescriptor(id) {
  return descriptors.find((descriptor) => descriptor.id === id) ?? null;
}

export function isWallpaperId(id) {
  return getWallpaperDescriptor(id) !== null;
}

export function listWallpaperMetadata() {
  return descriptors.map(({ id, kind, title, description, previewSrc, defaultConfig, controls }) => ({
    id,
    kind,
    title,
    description,
    previewSrc,
    defaultConfig,
    controls,
  }));
}

export function normalizeWallpaperConfig(id, input) {
  const descriptor = getWallpaperDescriptor(id);
  if (!descriptor) return null;
  return id === 'flow-shards' ? normalizeFlowShardsConfig(input) : {};
}

export function serializeWallpaperConfig(id, input) {
  const config = normalizeWallpaperConfig(id, input);
  if (config === null) return null;
  return JSON.stringify({ schemaVersion: 1, wallpaperId: id, config });
}
