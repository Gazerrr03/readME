import { normalizeWallpaperConfig } from './wallpaper-registry.js';

const DRAFT_STORAGE_KEY = 'portfolio-os:wallpaper-lab:v1';
const PREVIEW_STORAGE_KEY = 'portfolio-os:wallpaper-preview:v1';
const STORAGE_VERSION = 1;

function readEnvelope(storage, key) {
  try {
    const raw = storage?.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveEnvelope(storage, key, envelope) {
  try {
    storage?.setItem(key, JSON.stringify(envelope));
  } catch {
    // A blocked localStorage must not interrupt the authoring session.
  }
}

function isConfigRecord(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

export function loadWallpaperDraft(storage, id) {
  const envelope = readEnvelope(storage, DRAFT_STORAGE_KEY);
  if (envelope?.version !== STORAGE_VERSION || !isConfigRecord(envelope.drafts)) return null;
  const config = envelope.drafts[id];
  return isConfigRecord(config) ? normalizeWallpaperConfig(id, config) : null;
}

export function saveWallpaperDraft(storage, id, config) {
  const normalized = normalizeWallpaperConfig(id, config);
  if (normalized === null) return null;
  const previous = readEnvelope(storage, DRAFT_STORAGE_KEY);
  const drafts = previous?.version === STORAGE_VERSION && isConfigRecord(previous.drafts)
    ? { ...previous.drafts }
    : {};
  drafts[id] = normalized;
  saveEnvelope(storage, DRAFT_STORAGE_KEY, { version: STORAGE_VERSION, drafts });
  return normalized;
}

export function loadWallpaperPreview(storage, id) {
  const envelope = readEnvelope(storage, PREVIEW_STORAGE_KEY);
  if (
    envelope?.version !== STORAGE_VERSION
    || envelope.wallpaperId !== id
    || !isConfigRecord(envelope.config)
  ) return null;
  return normalizeWallpaperConfig(id, envelope.config);
}

export function saveWallpaperPreview(storage, id, config) {
  const normalized = normalizeWallpaperConfig(id, config);
  if (normalized === null) return null;
  saveEnvelope(storage, PREVIEW_STORAGE_KEY, {
    version: STORAGE_VERSION,
    wallpaperId: id,
    config: normalized,
  });
  return normalized;
}
