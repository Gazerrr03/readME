const KEY_PREFIX = 'article-notes:';
const HIGHLIGHTS_KEY_PREFIX = 'article-highlights:';

export const notesKey = (slug) => `${KEY_PREFIX}${slug}`;
export const highlightsKey = (slug) => `${HIGHLIGHTS_KEY_PREFIX}${slug}`;

function readArray(storage, key) {
  try {
    const raw = storage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function writeArray(storage, key, entries) {
  storage.setItem(key, JSON.stringify(entries));
}

function normalizeAnnotation(entry) {
  if (!entry || typeof entry.quote !== 'string') return null;
  return {
    ...entry,
    type: 'annotation',
    quote: entry.quote,
    note: String(entry.note ?? ''),
  };
}

function readAnnotations(storage, slug) {
  return readArray(storage, notesKey(slug))
    .map(normalizeAnnotation)
    .filter(Boolean);
}

function normalizeHighlight(entry) {
  if (typeof entry === 'string') {
    return { quote: entry };
  }
  if (!entry || typeof entry.quote !== 'string') return null;
  return { ...entry, quote: entry.quote };
}

function readHighlights(storage, slug) {
  return readArray(storage, highlightsKey(slug))
    .map(normalizeHighlight)
    .filter(Boolean);
}

export function loadNotes(storage, slug) {
  return readAnnotations(storage, slug);
}

export function addAnnotation(storage, slug, quote, note = '') {
  const trimmed = String(quote ?? '').trim();
  if (!trimmed) return readAnnotations(storage, slug);
  const entries = readAnnotations(storage, slug);
  entries.push({
    type: 'annotation',
    quote: trimmed,
    note: String(note ?? ''),
    createdAt: new Date().toISOString(),
  });
  writeArray(storage, notesKey(slug), entries);
  return entries;
}

// Keep the old name as a compatibility alias for existing local data/tests.
export const addNote = addAnnotation;

export function updateNote(storage, slug, index, note) {
  const entries = readAnnotations(storage, slug);
  if (entries[index]) {
    entries[index] = { ...entries[index], note: String(note ?? '') };
    writeArray(storage, notesKey(slug), entries);
  }
  return entries;
}

export function removeNote(storage, slug, index) {
  const entries = readAnnotations(storage, slug);
  if (index >= 0 && index < entries.length) {
    entries.splice(index, 1);
    writeArray(storage, notesKey(slug), entries);
  }
  return entries;
}

export function loadHighlights(storage, slug) {
  return readHighlights(storage, slug);
}

export function addHighlight(storage, slug, quote) {
  const trimmed = String(quote ?? '').trim();
  if (!trimmed) return readHighlights(storage, slug);
  const entries = readHighlights(storage, slug);
  if (entries.some((entry) => entry.quote === trimmed)) return entries;
  entries.push({ quote: trimmed, createdAt: new Date().toISOString() });
  writeArray(storage, highlightsKey(slug), entries);
  return entries;
}

export function removeHighlight(storage, slug, quote) {
  const trimmed = String(quote ?? '').trim();
  const entries = readHighlights(storage, slug).filter((entry) => entry.quote !== trimmed);
  writeArray(storage, highlightsKey(slug), entries);
  return entries;
}

export function renderNotesMarkdown({ title, slug, entries }) {
  const lines = [`# Notes on ${title}`, '', `Article: ${slug}`, ''];
  entries.forEach((entry, index) => {
    const quote = String(entry.quote ?? '').split('\n').map((line) => `> ${line}`);
    lines.push(`## Annotation ${index + 1}`, '', ...quote, '');
    if (entry.note) lines.push(entry.note, '');
  });
  return `${lines.join('\n')}\n`;
}
