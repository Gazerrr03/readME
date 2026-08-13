import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addNote,
  loadNotes,
  notesKey,
  removeNote,
  renderNotesMarkdown,
  updateNote,
} from '../../scripts/state/article-notes.js';

function memoryStorage() {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
  };
}

test('notes are stored per slug and survive reloads', () => {
  const storage = memoryStorage();
  assert.deepEqual(loadNotes(storage, 'alpha'), []);

  addNote(storage, 'alpha', 'first quote');
  addNote(storage, 'alpha', 'second quote', 'my comment');
  assert.deepEqual(loadNotes(storage, 'beta'), []);

  const entries = loadNotes(storage, 'alpha');
  assert.equal(entries.length, 2);
  assert.equal(entries[0].quote, 'first quote');
  assert.equal(entries[1].note, 'my comment');
  assert.ok(entries[0].createdAt);
  assert.ok(storage.getItem(notesKey('alpha')));
});

test('blank quotes are ignored and whitespace is trimmed', () => {
  const storage = memoryStorage();
  addNote(storage, 'alpha', '   ');
  assert.deepEqual(loadNotes(storage, 'alpha'), []);
  addNote(storage, 'alpha', '  padded  ');
  assert.equal(loadNotes(storage, 'alpha')[0].quote, 'padded');
});

test('notes can be annotated and removed by index', () => {
  const storage = memoryStorage();
  addNote(storage, 'alpha', 'one');
  addNote(storage, 'alpha', 'two');

  updateNote(storage, 'alpha', 0, 'edited comment');
  assert.equal(loadNotes(storage, 'alpha')[0].note, 'edited comment');

  removeNote(storage, 'alpha', 0);
  const remaining = loadNotes(storage, 'alpha');
  assert.equal(remaining.length, 1);
  assert.equal(remaining[0].quote, 'two');

  removeNote(storage, 'alpha', 99);
  assert.equal(loadNotes(storage, 'alpha').length, 1);
});

test('corrupt storage falls back to an empty list', () => {
  const storage = memoryStorage();
  storage.setItem(notesKey('alpha'), '{not-json');
  assert.deepEqual(loadNotes(storage, 'alpha'), []);
  storage.setItem(notesKey('alpha'), '"not-an-array"');
  assert.deepEqual(loadNotes(storage, 'alpha'), []);
});

test('markdown export lists every highlight with its note', () => {
  const markdown = renderNotesMarkdown({
    title: 'Test Article',
    slug: 'test-article',
    entries: [
      { quote: 'first quote', note: 'comment here' },
      { quote: 'second quote', note: '' },
    ],
  });
  assert.match(markdown, /^# Notes on Test Article/);
  assert.match(markdown, /> first quote/);
  assert.match(markdown, /comment here/);
  assert.match(markdown, /> second quote/);
});
