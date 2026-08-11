import test from 'node:test';
import assert from 'node:assert/strict';
import { tracks } from '../../media/catalog.js';
import { createMusicDeck, formatDeckTimecode } from '../../scripts/environment/music-deck.js';

test('formatDeckTimecode renders MM:SS:FF at 30fps', () => {
  assert.equal(formatDeckTimecode(0), '00:00:00');
  assert.equal(formatDeckTimecode(167.5), '02:47:15');
  assert.equal(formatDeckTimecode(5.966), '00:05:28');
  assert.equal(formatDeckTimecode(Number.NaN), '00:00:00');
  assert.equal(formatDeckTimecode(-3), '00:00:00');
});

function createFakeElement(document, tagName) {
  const listeners = new Map();
  return {
    tagName,
    children: [],
    attributes: {},
    dataset: {},
    style: {},
    textContent: '',
    ownerDocument: document,
    setAttribute(name, value) { this.attributes[name] = String(value); },
    getAttribute(name) { return this.attributes[name] ?? null; },
    append(...nodes) { this.children.push(...nodes); },
    addEventListener(type, handler) { listeners.set(type, handler); },
    click() { listeners.get('click')?.(); },
  };
}

function createFakeDocument() {
  const document = {
    defaultView: { devicePixelRatio: 1 },
    createElement: (tagName) => createFakeElement(document, tagName),
  };
  return document;
}

function createHarness({ playResult = 'resolve' } = {}) {
  const document = createFakeDocument();
  const audio = {
    preload: '',
    src: '',
    currentTime: 0,
    listeners: new Map(),
    play() {
      return playResult === 'resolve' ? Promise.resolve() : Promise.reject(new Error('no signal'));
    },
    pause() {},
    addEventListener(type, handler) { this.listeners.set(type, handler); },
  };
  let pending = null;
  const scheduler = {
    request(callback) { pending = callback; return 1; },
    cancel() { pending = null; },
    flush(time) { const callback = pending; pending = null; callback?.(time); },
    hasPending() { return pending !== null },
  };
  const i18n = { locale: 'en', t: (key) => key };
  const deck = createMusicDeck({
    document,
    i18n,
    tracks,
    audioFactory: () => audio,
    analyserFactory: () => null,
    scheduler,
  });
  const find = (attr) => {
    const walk = (node) => [node, ...node.children.flatMap(walk)];
    return walk(deck.element).find((node) => node.attributes[attr] !== undefined);
  };
  return { deck, audio, scheduler, find };
}

test('deck boots idle on the first track with localized chrome', () => {
  const { deck, audio, find } = createHarness();
  assert.deepEqual(deck.getState(), { index: 0, status: 'idle' });
  assert.equal(audio.src, tracks[0].file);
  assert.equal(find('data-deck-next').textContent, `TRK 01/${String(tracks.length).padStart(2, '0')} ›`);
  assert.equal(find('data-deck-title').textContent, tracks[0].title.en);
  assert.equal(find('data-deck-status-line').textContent, '00:00:00');
  assert.equal(find('data-deck-format').textContent, tracks[0].format);
});

test('toggle plays and pauses, driving the animation loop', async () => {
  const { deck, scheduler, find } = createHarness();
  find('data-deck-toggle').click();
  await Promise.resolve();
  assert.equal(deck.getState().status, 'playing');
  assert.equal(find('data-deck-glyph').textContent, '■');
  assert.ok(scheduler.hasPending());

  find('data-deck-toggle').click();
  assert.equal(deck.getState().status, 'paused');
  assert.equal(find('data-deck-glyph').textContent, '►');
  assert.ok(!scheduler.hasPending());
});

test('next advances through tracks and wraps around', () => {
  const { deck, audio, find } = createHarness();
  find('data-deck-next').click();
  assert.equal(deck.getState().index, 1);
  assert.equal(audio.src, tracks[1].file);
  find('data-deck-next').click();
  find('data-deck-next').click();
  assert.equal(deck.getState().index, 0);
  assert.equal(find('data-deck-title').textContent, tracks[0].title.en);
});

test('a rejected play marks the deck unavailable instead of throwing', async () => {
  const { deck, find } = createHarness({ playResult: 'reject' });
  find('data-deck-toggle').click();
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(deck.getState().status, 'unavailable');
  assert.match(find('data-deck-status-line').textContent, /deck\.unavailable/);
});

test('locale sync re-renders labels without losing playback state', async () => {
  const { deck, find } = createHarness();
  find('data-deck-toggle').click();
  await Promise.resolve();
  deck.syncLocale();
  assert.equal(deck.getState().status, 'playing');
  assert.equal(find('data-deck-mark').textContent, 'deck.label');
  assert.equal(find('data-deck-toggle').getAttribute('aria-label'), 'deck.pause');
});

test('destroy stops the loop and unloads the audio', () => {
  const { deck, audio, scheduler } = createHarness();
  deck.destroy();
  assert.equal(audio.src, '');
  assert.ok(!scheduler.hasPending());
});
