const locales = (en, zhCN, ja) => Object.freeze({ en, 'zh-CN': zhCN, ja });

const range = (key, label, description, min, max) => Object.freeze({
  key,
  type: 'range',
  label,
  description,
  min: 0,
  max: 100,
  step: 1,
  endpoints: Object.freeze({ min, max }),
});

export const FLOW_SHARDS_DEFAULT_CONFIG = Object.freeze({
  density: 'high',
  speed: 42,
  vortexSize: 58,
  turbulence: 62,
  motionRange: 55,
  shardSize: 46,
  trailLength: 62,
  glow: 58,
  shadow: 56,
  fog: 44,
  backgroundColor: '#000000',
  shardColor: '#FF3C3C',
});

const preset = (config) => Object.freeze({ ...FLOW_SHARDS_DEFAULT_CONFIG, ...config });

export const FLOW_SHARDS_PRESETS = Object.freeze({
  calm: preset({
    density: 'low', speed: 24, vortexSize: 72, turbulence: 35, motionRange: 42,
    shardSize: 42, trailLength: 38, glow: 28, shadow: 45, fog: 58,
  }),
  reference: preset({}),
  intense: preset({
    density: 'high', speed: 68, vortexSize: 40, turbulence: 82, motionRange: 70,
    shardSize: 50, trailLength: 78, glow: 78, shadow: 65, fog: 30,
  }),
});

export const FLOW_SHARDS_CONTROLS = Object.freeze([
  Object.freeze({
    key: 'density',
    type: 'select',
    label: locales('Shard density', '晶片数量', 'シャード密度'),
    description: locales('How many illuminated shards fill the field.', '控制流场中的发光晶片数量。', '流れを満たす光るシャードの数です。'),
    options: Object.freeze([
      Object.freeze({ value: 'low', label: locales('Low', '低', '低') }),
      Object.freeze({ value: 'medium', label: locales('Medium', '中', '中') }),
      Object.freeze({ value: 'high', label: locales('High', '高', '高') }),
    ]),
  }),
  range(
    'speed', locales('Motion speed', '运动速度', '動きの速さ'),
    locales('How quickly the flow moves.', '控制流场前进的快慢。', '流れが進む速さです。'),
    locales('Slow', '慢', '遅い'), locales('Fast', '快', '速い'),
  ),
  range(
    'vortexSize', locales('Vortex size', '漩涡大小', '渦の大きさ'),
    locales('From fine currents to wide turns.', '从细密流线到宽阔旋涡。', '細かな流れから大きなうねりまで。'),
    locales('Fine', '细密', '細かい'), locales('Wide', '宽阔', '広い'),
  ),
  range(
    'turbulence', locales('Turbulence', '翻涌强度', 'うねりの強さ'),
    locales('How strongly the field changes direction.', '控制流场转向的力度。', '流れが方向を変える強さです。'),
    locales('Gentle', '柔和', '穏やか'), locales('Wild', '强烈', '激しい'),
  ),
  range(
    'motionRange', locales('Motion range', '运动范围', '動きの範囲'),
    locales('How far shards travel before they return.', '控制晶片游走与重生的范围。', 'シャードが戻るまでに移動する範囲です。'),
    locales('Close', '紧凑', '近い'), locales('Far', '宽广', '遠い'),
  ),
  range(
    'shardSize', locales('Shard size', '晶片大小', 'シャードの大きさ'),
    locales('The base size of each shard.', '控制每枚晶片的基础大小。', '各シャードの基本サイズです。'),
    locales('Small', '小', '小さい'), locales('Large', '大', '大きい'),
  ),
  range(
    'trailLength', locales('Trail length', '拖尾长度', '軌跡の長さ'),
    locales('How much movement stretches each shard.', '控制运动时晶片的拉伸长度。', '動きに合わせてシャードを伸ばす量です。'),
    locales('Short', '短', '短い'), locales('Long', '长', '長い'),
  ),
  range(
    'glow', locales('Glow', '辉光', '光彩'),
    locales('The softness and strength of bright edges.', '控制亮部的柔和与强度。', '明るい縁の柔らかさと強さです。'),
    locales('Subtle', '微弱', '控えめ'), locales('Luminous', '明亮', '鮮やか'),
  ),
  range(
    'shadow', locales('Shadow', '阴影', '影'),
    locales('How strongly shards anchor into the space.', '控制晶片在空间中的投影强度。', 'シャードを空間に留める影の強さです。'),
    locales('Light', '浅', '薄い'), locales('Deep', '深', '濃い'),
  ),
  range(
    'fog', locales('Fog', '雾感', '霧感'),
    locales('How softly distant shards fade away.', '控制远处晶片淡出的柔和程度。', '遠くのシャードが消える柔らかさです。'),
    locales('Clear', '清晰', 'クリア'), locales('Misty', '朦胧', '霧深い'),
  ),
  Object.freeze({
    key: 'backgroundColor',
    type: 'color',
    label: locales('Background color', '背景色', '背景色'),
    description: locales('The deep color behind the flow.', '流场背后的深色。', '流れの背後にある深い色です。'),
  }),
  Object.freeze({
    key: 'shardColor',
    type: 'color',
    label: locales('Shard color', '晶片色', 'シャード色'),
    description: locales('The main illuminated shard color.', '发光晶片的主体颜色。', '光るシャードの主な色です。'),
  }),
]);

const densityValues = new Set(['low', 'medium', 'high']);
const numericKeys = Object.freeze([
  'speed', 'vortexSize', 'turbulence', 'motionRange', 'shardSize',
  'trailLength', 'glow', 'shadow', 'fog',
]);
const colorKeys = Object.freeze(['backgroundColor', 'shardColor']);
const hexColor = /^#[0-9a-f]{6}$/i;

function normalizeNumber(value, fallback) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function normalizeColor(value, fallback) {
  return typeof value === 'string' && hexColor.test(value) ? value.toUpperCase() : fallback;
}

export function normalizeFlowShardsConfig(input) {
  const source = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const normalized = {
    density: densityValues.has(source.density) ? source.density : FLOW_SHARDS_DEFAULT_CONFIG.density,
  };
  for (const key of numericKeys) {
    normalized[key] = normalizeNumber(source[key], FLOW_SHARDS_DEFAULT_CONFIG[key]);
  }
  for (const key of colorKeys) {
    normalized[key] = normalizeColor(source[key], FLOW_SHARDS_DEFAULT_CONFIG[key]);
  }
  return normalized;
}

const lerp = (min, max, amount) => min + ((max - min) * amount);

export function mapFlowShardsConfig(input) {
  const config = normalizeFlowShardsConfig(input);
  return {
    simulationSize: { low: 64, medium: 96, high: 128 }[config.density],
    timeScale: lerp(0.25, 2, config.speed / 100),
    noiseScale: lerp(2.05, 0.24, config.vortexSize / 100),
    curlStrength: lerp(0.2, 1.49, config.turbulence / 100),
    lifeSeconds: lerp(3.4, 7.3, config.motionRange / 100),
    spawnRadius: lerp(0.45, 1.55, config.motionRange / 100),
    baseSize: lerp(0.55, 1.94, config.shardSize / 100),
    stretch: lerp(0.35, 1.47, config.trailLength / 100),
    bloomStrength: lerp(0.1, 2.4, config.glow / 100),
    bloomThreshold: lerp(0.72, 0.065, config.glow / 100),
    shadowOpacity: config.shadow / 100,
    fogAmount: config.fog / 100,
  };
}

export function matchFlowShardsPreset(input) {
  const config = normalizeFlowShardsConfig(input);
  return Object.entries(FLOW_SHARDS_PRESETS).find(([, presetConfig]) => (
    Object.keys(FLOW_SHARDS_DEFAULT_CONFIG).every((key) => config[key] === presetConfig[key])
  ))?.[0] ?? null;
}
