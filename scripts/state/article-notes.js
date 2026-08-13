const KEY_PREFIX = 'article-notes:';

export const notesKey = (slug) => `${KEY_PREFIX}${slug}`;

function read(storage, slug) {
  try {
    const raw = storage.getItem(notesKey(slug));
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry) => entry && typeof entry.quote === 'string');
  } catch {
    return [];
  }
}

function write(storage, slug, entries) {
  storage.setItem(notesKey(slug), JSON.stringify(entries));
}

export function loadNotes(storage, slug) {
  return read(storage, slug);
}

export function addNote(storage, slug, quote, note = '') {
  const trimmed = String(quote ?? '').trim();
  if (!trimmed) return read(storage, slug);
  const entries = read(storage, slug);
  entries.push({ quote: trimmed, note: String(note ?? ''), createdAt: new Date().toISOString() });
  write(storage, slug, entries);
  return entries;
}

export function updateNote(storage, slug, index, note) {
  const entries = read(storage, slug);
  if (entries[index]) {
    entries[index] = { ...entries[index], note: String(note ?? '') };
    write(storage, slug, entries);
  }
  return entries;
}

export function removeNote(storage, slug, index) {
  const entries = read(storage, slug);
  if (index >= 0 && index < entries.length) {
    entries.splice(index, 1);
    write(storage, slug, entries);
  }
  return entries;
}

export function renderNotesMarkdown({ title, slug, entries }) {
  const lines = [`# Notes on ${title}`, '', `Article: ${slug}`, ''];
  entries.forEach((entry, index) => {
    lines.push(`## Highlight ${index + 1}`, '', `> ${entry.quote}`, '');
    if (entry.note) lines.push(entry.note, '');
  });
  return `${lines.join('\n')}\n`;
}
