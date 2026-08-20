import {
  getWallpaperDescriptor,
  normalizeWallpaperConfig,
  serializeWallpaperConfig,
} from '../scripts/environment/background/wallpaper-registry.js';
import {
  loadWallpaperDraft,
  saveWallpaperDraft,
  saveWallpaperPreview,
} from '../scripts/environment/background/wallpaper-storage.js';
import {
  FLOW_SHARDS_PRESETS,
  matchFlowShardsPreset,
} from '../scripts/environment/background/wallpapers/flow-shards/config.js';
import { createWallpaperManager } from '../scripts/environment/background/wallpaper-manager.js';
import { loadPreferences, savePreferences } from '../scripts/state/preferences.js';

const FALLBACK_ID = 'flow-shards';
const DENSITY_DEBOUNCE_MS = 120;
const PREVIEW_STORAGE_KEY = 'portfolio-os:wallpaper-preview:v1';
const PREFERENCES_STORAGE_KEY = 'portfolio-os:preferences';
const lab = document.querySelector('[data-wallpaper-lab]');
const controlsRoot = document.querySelector('[data-wallpaper-controls]');
const previewRoot = document.querySelector('[data-wallpaper-preview]');
const previewStatus = document.querySelector('[data-wallpaper-status]');
const warning = document.querySelector('[data-wallpaper-warning]');
const presetStatus = document.querySelector('[data-wallpaper-preset-status]');
const actionStatus = document.querySelector('[data-wallpaper-action-status]');
const copyFallback = document.querySelector('[data-wallpaper-copy-fallback]');
const applyLocalButton = document.querySelector('[data-wallpaper-apply-local]');

function acquireStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

const storage = acquireStorage();
const locale = loadPreferences(storage).locale;
const LAB_COPY = {
  en: {
    applyError: 'Changes were not applied. Local browser storage could not be verified. Restoration of prior homepage settings was attempted.',
    applySuccess: 'Applied to this browser’s local homepage.',
    copyFallback: 'Clipboard access was blocked. The configuration is selected below for manual copying.',
    copySuccess: 'Configuration copied.',
    downloadSuccess: 'Configuration downloaded.',
    presetDraft: (label) => `${label} preset loaded as a draft.`,
    presets: { calm: 'Calm', reference: 'Reference', intense: 'Intense', custom: 'Custom' },
    previewConfigFailure: 'The live preview could not accept this configuration. Your controls and saved draft are still available.',
    previewLoading: 'Preparing the live preview…',
    previewReady: 'Live preview ready',
    previewStartFailure: 'The live preview could not start. Your controls and saved draft are still available.',
    previewStopped: 'The Flow Shards preview stopped and is no longer available. Your draft and export tools still work.',
    resetDraft: 'Official default restored as a draft. The local homepage was not changed.',
    warning: (id) => `“${id}” is not available in this author lab. Showing Flow Shards instead.`,
  },
  'zh-CN': {
    applyError: '更改未应用。本地浏览器存储无法验证，已尝试恢复之前的主页设置。',
    applySuccess: '已应用到此浏览器的本地主页。',
    copyFallback: '剪贴板访问受阻。下方已选中配置文本，可手动复制。',
    copySuccess: '配置已复制。',
    downloadSuccess: '配置已下载。',
    presetDraft: (label) => `${label}预设已作为草稿加载。`,
    presets: { calm: '安静', reference: '参考', intense: '强烈', custom: '自定义' },
    previewConfigFailure: '实时预览无法应用此配置。控件和已保存的草稿仍可使用。',
    previewLoading: '正在准备实时预览…',
    previewReady: '实时预览已就绪',
    previewStartFailure: '实时预览无法启动。控件和已保存的草稿仍可使用。',
    previewStopped: 'Flow Shards 实时预览已停止且不可用。草稿和导出工具仍可使用。',
    resetDraft: '已将正式默认值恢复为草稿。本地主页未更改。',
    warning: (id) => `“${id}”无法在此作者调节页中使用，已改为显示 Flow Shards。`,
  },
  ja: {
    applyError: '変更は適用されませんでした。ブラウザーのローカル保存を確認できませんでした。以前のホームページ設定の復元を試みました。',
    applySuccess: 'このブラウザーのローカルホームページに適用しました。',
    copyFallback: 'クリップボードへのアクセスが拒否されました。手動でコピーできるよう、下の設定を選択しました。',
    copySuccess: '設定をコピーしました。',
    downloadSuccess: '設定をダウンロードしました。',
    presetDraft: (label) => `${label}プリセットを下書きとして読み込みました。`,
    presets: { calm: '穏やか', reference: '参考', intense: '強烈', custom: 'カスタム' },
    previewConfigFailure: 'ライブプレビューにこの設定を適用できませんでした。コントロールと保存済みの下書きは引き続き使用できます。',
    previewLoading: 'ライブプレビューを準備しています…',
    previewReady: 'ライブプレビューの準備ができました',
    previewStartFailure: 'ライブプレビューを開始できませんでした。コントロールと保存済みの下書きは引き続き使用できます。',
    previewStopped: 'Flow Shards のライブプレビューが停止し、利用できなくなりました。下書きと書き出しツールは引き続き使用できます。',
    resetDraft: '正式な初期設定を下書きとして復元しました。ローカルホームページは変更していません。',
    warning: (id) => `“${id}”はこの作者ラボでは使用できないため、Flow Shards を表示しています。`,
  },
};
const copy = LAB_COPY[locale];

const requestedId = new URLSearchParams(window.location.search).get('wallpaper');
const requestedDescriptor = requestedId ? getWallpaperDescriptor(requestedId) : null;
const isAuthorable = requestedDescriptor?.controls?.length > 0;
const wallpaperId = isAuthorable ? requestedDescriptor.id : FALLBACK_ID;
const descriptor = getWallpaperDescriptor(wallpaperId);
lab.dataset.wallpaperId = wallpaperId;
const wallpaperName = document.querySelector('[data-wallpaper-name]');
wallpaperName.textContent = descriptor.title[locale];
for (const element of [
  wallpaperName,
  controlsRoot,
  warning,
  previewStatus,
  presetStatus,
  actionStatus,
]) {
  element.lang = locale;
}
previewStatus.textContent = copy.previewLoading;

if (requestedId && !isAuthorable) {
  warning.hidden = false;
  warning.textContent = copy.warning(requestedId);
}

let currentConfig = loadWallpaperDraft(storage, wallpaperId) ?? descriptor.defaultConfig;
currentConfig = normalizeWallpaperConfig(wallpaperId, currentConfig);
let previewDensity = descriptor.defaultConfig.density;
let densityTimer = null;
let managerReady = false;
let previewObserver = null;

const groups = [
  { title: 'Density', description: 'Choose how full the field feels.', keys: ['density'] },
  {
    title: 'Flow',
    description: 'Shape how the current moves through space.',
    keys: ['speed', 'vortexSize', 'turbulence', 'motionRange'],
  },
  { title: 'Shards', description: 'Adjust the size and stretched motion of each shard.', keys: ['shardSize', 'trailLength'] },
  { title: 'Light and depth', description: 'Balance brightness, grounding, and distance.', keys: ['glow', 'shadow', 'fog'] },
  { title: 'Colors', description: 'Set the two colors that define the scene.', keys: ['backgroundColor', 'shardColor'] },
];

function text(value) {
  return value?.[locale] ?? value?.en ?? '';
}

function controlValue(control, value) {
  if (control.type !== 'select') return String(value);
  return text(control.options.find((option) => option.value === value)?.label);
}

function createControl(control) {
  const field = document.createElement('div');
  field.className = `control-field control-field-${control.type}`;
  field.dataset.wallpaperControl = control.key;

  const heading = document.createElement('div');
  heading.className = 'control-heading';
  const label = document.createElement('label');
  const inputId = `wallpaper-control-${control.key}`;
  label.htmlFor = inputId;
  label.textContent = text(control.label);
  const value = document.createElement('output');
  value.dataset.wallpaperValue = control.key;
  value.htmlFor = inputId;
  value.textContent = controlValue(control, currentConfig[control.key]);
  heading.append(label, value);

  const description = document.createElement('p');
  description.textContent = text(control.description);
  const input = document.createElement(control.type === 'select' ? 'select' : 'input');
  input.id = inputId;
  input.name = control.key;
  input.value = currentConfig[control.key];

  if (control.type === 'select') {
    for (const optionDefinition of control.options) {
      const option = document.createElement('option');
      option.value = optionDefinition.value;
      option.textContent = text(optionDefinition.label);
      input.append(option);
    }
    input.value = currentConfig[control.key];
    input.addEventListener('change', () => commitControl(control, input.value));
  } else {
    input.type = control.type;
    if (control.type === 'range') {
      input.min = String(control.min);
      input.max = String(control.max);
      input.step = String(control.step);
    }
    input.addEventListener('input', () => {
      const nextValue = control.type === 'range' ? Number(input.value) : input.value;
      commitControl(control, nextValue);
    });
  }

  field.append(heading, description, input);
  if (control.type === 'range') {
    const endpoints = document.createElement('div');
    endpoints.className = 'control-endpoints';
    const minimum = document.createElement('span');
    minimum.dataset.wallpaperEndpoint = 'min';
    minimum.textContent = text(control.endpoints.min);
    const maximum = document.createElement('span');
    maximum.dataset.wallpaperEndpoint = 'max';
    maximum.textContent = text(control.endpoints.max);
    endpoints.append(minimum, maximum);
    field.append(endpoints);
  }
  return field;
}

function renderControls() {
  controlsRoot.replaceChildren();
  for (const group of groups) {
    const card = document.createElement('section');
    card.className = 'control-card';
    const kicker = document.createElement('p');
    kicker.className = 'section-kicker';
    kicker.textContent = 'Live controls';
    const title = document.createElement('h2');
    title.textContent = group.title;
    const description = document.createElement('p');
    description.textContent = group.description;
    card.append(kicker, title, description);
    for (const key of group.keys) {
      const control = descriptor.controls.find((entry) => entry.key === key);
      if (control) card.append(createControl(control));
    }
    controlsRoot.append(card);
  }
  updatePresetState();
}

function syncControlValues() {
  for (const control of descriptor.controls) {
    const field = controlsRoot.querySelector(`[data-wallpaper-control="${control.key}"]`);
    const input = field?.querySelector('input, select');
    const output = field?.querySelector(`[data-wallpaper-value="${control.key}"]`);
    if (input) input.value = currentConfig[control.key];
    if (output) output.textContent = controlValue(control, currentConfig[control.key]);
  }
}

function updatePresetState() {
  const match = matchFlowShardsPreset(currentConfig) ?? 'custom';
  presetStatus.textContent = copy.presets[match];
  for (const button of document.querySelectorAll('[data-wallpaper-preset]')) {
    const active = button.dataset.wallpaperPreset === match;
    button.setAttribute('aria-pressed', String(active));
  }
}

function updatePreview({ densityChanged = false } = {}) {
  if (!managerReady) return;
  if (!densityChanged) {
    previewManager.updateConfig({ ...currentConfig, density: previewDensity });
    return;
  }
  window.clearTimeout(densityTimer);
  densityTimer = window.setTimeout(() => {
    previewDensity = currentConfig.density;
    previewManager.updateConfig(currentConfig);
  }, DENSITY_DEBOUNCE_MS);
}

function setPreviewAvailability(available, message) {
  managerReady = available;
  applyLocalButton.disabled = !available;
  previewStatus.dataset.status = available ? 'ready' : 'error';
  previewStatus.textContent = message;
  if (!available) {
    window.clearTimeout(densityTimer);
    densityTimer = null;
  }
}

function setActionStatus(state, message) {
  actionStatus.dataset.status = state;
  actionStatus.textContent = message;
}

function storeDraftAndPreview(nextConfig, { densityChanged = false } = {}) {
  currentConfig = normalizeWallpaperConfig(wallpaperId, nextConfig);
  saveWallpaperDraft(storage, wallpaperId, currentConfig);
  syncControlValues();
  updatePresetState();
  updatePreview({ densityChanged });
}

function commitControl(control, value) {
  storeDraftAndPreview(
    { ...currentConfig, [control.key]: value },
    { densityChanged: control.key === 'density' },
  );
}

renderControls();

const previewManager = createWallpaperManager({
  document,
  initialId: wallpaperId,
  storage: null,
  transitionMs: 0,
});
previewRoot.prepend(previewManager.element);
previewManager.setMotionState(
  window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'static' : 'running',
);

function isPreviewHealthy() {
  const activeSurface = previewManager.element.querySelector(
    `[data-wallpaper-active="true"][data-background-id="${wallpaperId}"]`,
  );
  const rendererFailed = previewManager.element.querySelector(
    '[data-wallpaper-context="lost"], [data-wallpaper-error]',
  );
  return previewManager.currentId === wallpaperId
    && previewManager.element.dataset.backgroundId === wallpaperId
    && previewManager.element.dataset.wallpaperState === 'ready'
    && Boolean(activeSurface)
    && !rendererFailed;
}

function startPreviewObserver() {
  previewObserver = new MutationObserver(() => {
    if (managerReady && !isPreviewHealthy()) {
      setPreviewAvailability(false, copy.previewStopped);
    }
  });
  previewObserver.observe(previewManager.element, {
    attributeFilter: [
      'data-background-id',
      'data-wallpaper-active',
      'data-wallpaper-context',
      'data-wallpaper-error',
      'data-wallpaper-state',
    ],
    childList: true,
    subtree: true,
  });
}

previewManager.ready.then((result) => {
  if (!result.ok || previewManager.currentId !== wallpaperId) {
    setPreviewAvailability(false, copy.previewStartFailure);
    return;
  }
  startPreviewObserver();
  previewDensity = currentConfig.density;
  const updateResult = previewManager.updateConfig(currentConfig);
  if (!updateResult.ok || !isPreviewHealthy()) {
    setPreviewAvailability(false, copy.previewConfigFailure);
    return;
  }
  setPreviewAvailability(true, copy.previewReady);
}).catch(() => {
  setPreviewAvailability(false, copy.previewStartFailure);
});

for (const button of document.querySelectorAll('[data-wallpaper-preset]')) {
  const presetKey = button.dataset.wallpaperPreset;
  button.textContent = copy.presets[presetKey];
  button.lang = locale;
  button.addEventListener('click', () => {
    const nextConfig = FLOW_SHARDS_PRESETS[presetKey];
    storeDraftAndPreview(nextConfig, { densityChanged: currentConfig.density !== nextConfig.density });
    setActionStatus('draft', copy.presetDraft(copy.presets[presetKey]));
  });
}

document.querySelector('[data-wallpaper-reset]').addEventListener('click', () => {
  const densityChanged = currentConfig.density !== descriptor.defaultConfig.density;
  storeDraftAndPreview(descriptor.defaultConfig, { densityChanged });
  setActionStatus('draft', copy.resetDraft);
});

function readRawStorage(key) {
  if (!storage) throw new Error('Local storage is unavailable');
  return storage.getItem(key);
}

function restoreRawStorage(key, raw) {
  try {
    if (raw === null) storage?.removeItem(key);
    else storage?.setItem(key, raw);
  } catch {
    // Rollback is best effort; a blocked key may already retain its prior value.
  }
}

function applyToLocalHomepage() {
  let snapshot = null;
  try {
    snapshot = {
      preferences: readRawStorage(PREFERENCES_STORAGE_KEY),
      preview: readRawStorage(PREVIEW_STORAGE_KEY),
    };
    const normalizedConfig = normalizeWallpaperConfig(wallpaperId, currentConfig);
    const priorPreferences = loadPreferences({
      getItem: () => snapshot.preferences,
    });
    const expectedPreferences = { ...priorPreferences, wallpaperId };
    const savedPreview = saveWallpaperPreview(storage, wallpaperId, normalizedConfig);
    const savedPreferences = savePreferences(storage, expectedPreferences);
    const persistedPreview = readRawStorage(PREVIEW_STORAGE_KEY);
    const persistedPreferences = readRawStorage(PREFERENCES_STORAGE_KEY);
    const expectedPreview = JSON.stringify({
      version: 1,
      wallpaperId,
      config: normalizedConfig,
    });
    if (
      !savedPreview
      || persistedPreview !== expectedPreview
      || persistedPreferences !== JSON.stringify(savedPreferences)
      || savedPreferences.wallpaperId !== wallpaperId
    ) {
      throw new Error('Local homepage records could not be verified');
    }
    return true;
  } catch {
    if (snapshot) {
      restoreRawStorage(PREVIEW_STORAGE_KEY, snapshot.preview);
      restoreRawStorage(PREFERENCES_STORAGE_KEY, snapshot.preferences);
    }
    return false;
  }
}

applyLocalButton.addEventListener('click', () => {
  const applied = applyToLocalHomepage();
  if (applied) {
    setActionStatus('success', copy.applySuccess);
  } else {
    setActionStatus('error', copy.applyError);
  }
});

function serializedConfiguration() {
  return serializeWallpaperConfig(wallpaperId, currentConfig);
}

document.querySelector('[data-wallpaper-copy]').addEventListener('click', async () => {
  const serialized = serializedConfiguration();
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(serialized);
    copyFallback.hidden = true;
    setActionStatus('success', copy.copySuccess);
  } catch {
    copyFallback.value = serialized;
    copyFallback.hidden = false;
    copyFallback.focus();
    copyFallback.select();
    setActionStatus('warning', copy.copyFallback);
  }
});

document.querySelector('[data-wallpaper-download]').addEventListener('click', () => {
  const serialized = serializedConfiguration();
  const url = URL.createObjectURL(new Blob([serialized], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `${wallpaperId}.config.json`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
  setActionStatus('success', copy.downloadSuccess);
});

window.addEventListener('beforeunload', () => {
  window.clearTimeout(densityTimer);
  previewObserver?.disconnect();
  previewManager.destroy();
}, { once: true });
