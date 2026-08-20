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
const locale = 'en';
const lab = document.querySelector('[data-wallpaper-lab]');
const controlsRoot = document.querySelector('[data-wallpaper-controls]');
const previewRoot = document.querySelector('[data-wallpaper-preview]');
const previewStatus = document.querySelector('[data-wallpaper-status]');
const warning = document.querySelector('[data-wallpaper-warning]');
const presetStatus = document.querySelector('[data-wallpaper-preset-status]');
const actionStatus = document.querySelector('[data-wallpaper-action-status]');
const copyFallback = document.querySelector('[data-wallpaper-copy-fallback]');

const requestedId = new URLSearchParams(window.location.search).get('wallpaper');
const requestedDescriptor = requestedId ? getWallpaperDescriptor(requestedId) : null;
const isAuthorable = requestedDescriptor?.controls?.length > 0;
const wallpaperId = isAuthorable ? requestedDescriptor.id : FALLBACK_ID;
const descriptor = getWallpaperDescriptor(wallpaperId);
lab.dataset.wallpaperId = wallpaperId;
document.querySelector('[data-wallpaper-name]').textContent = descriptor.title[locale];

if (requestedId && !isAuthorable) {
  warning.hidden = false;
  warning.textContent = `“${requestedId}” is not available in this author lab. Showing Flow Shards instead.`;
}

let currentConfig = loadWallpaperDraft(localStorage, wallpaperId) ?? descriptor.defaultConfig;
currentConfig = normalizeWallpaperConfig(wallpaperId, currentConfig);
let previewDensity = descriptor.defaultConfig.density;
let densityTimer = null;
let managerReady = false;

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
  value.textContent = String(currentConfig[control.key]);
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
    if (output) output.textContent = String(currentConfig[control.key]);
  }
}

function updatePresetState() {
  const match = matchFlowShardsPreset(currentConfig) ?? 'custom';
  presetStatus.textContent = match;
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

function storeDraftAndPreview(nextConfig, { densityChanged = false } = {}) {
  currentConfig = normalizeWallpaperConfig(wallpaperId, nextConfig);
  saveWallpaperDraft(localStorage, wallpaperId, currentConfig);
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

previewManager.ready.then((result) => {
  if (!result.ok || previewManager.currentId !== wallpaperId) {
    previewStatus.dataset.status = 'error';
    previewStatus.textContent = 'The live preview could not start. Your controls and saved draft are still available.';
    return;
  }
  managerReady = true;
  previewDensity = currentConfig.density;
  const updateResult = previewManager.updateConfig(currentConfig);
  if (!updateResult.ok) {
    previewStatus.dataset.status = 'error';
    previewStatus.textContent = 'The live preview could not accept this configuration.';
    return;
  }
  previewStatus.dataset.status = 'ready';
  previewStatus.textContent = 'Live preview ready';
}).catch(() => {
  previewStatus.dataset.status = 'error';
  previewStatus.textContent = 'The live preview could not start. Your controls and saved draft are still available.';
});

for (const button of document.querySelectorAll('[data-wallpaper-preset]')) {
  button.addEventListener('click', () => {
    const nextConfig = FLOW_SHARDS_PRESETS[button.dataset.wallpaperPreset];
    storeDraftAndPreview(nextConfig, { densityChanged: currentConfig.density !== nextConfig.density });
    actionStatus.textContent = `${button.textContent} preset loaded as a draft.`;
  });
}

document.querySelector('[data-wallpaper-reset]').addEventListener('click', () => {
  const densityChanged = currentConfig.density !== descriptor.defaultConfig.density;
  storeDraftAndPreview(descriptor.defaultConfig, { densityChanged });
  actionStatus.textContent = 'Official default restored as a draft. The local homepage was not changed.';
});

document.querySelector('[data-wallpaper-apply-local]').addEventListener('click', () => {
  const applied = saveWallpaperPreview(localStorage, wallpaperId, currentConfig);
  const preferences = loadPreferences(localStorage);
  savePreferences(localStorage, { ...preferences, wallpaperId });
  actionStatus.textContent = applied
    ? 'Applied to this browser’s local homepage.'
    : 'The configuration could not be applied to the local homepage.';
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
    actionStatus.textContent = 'Configuration copied.';
  } catch {
    copyFallback.value = serialized;
    copyFallback.hidden = false;
    copyFallback.focus();
    copyFallback.select();
    actionStatus.textContent = 'Clipboard access was blocked. The configuration is selected below for manual copying.';
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
  actionStatus.textContent = 'Configuration downloaded.';
});

window.addEventListener('beforeunload', () => {
  window.clearTimeout(densityTimer);
  previewManager.destroy();
}, { once: true });
