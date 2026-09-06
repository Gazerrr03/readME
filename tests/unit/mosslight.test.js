import test from 'node:test';
import assert from 'node:assert/strict';
import { HOME, SAVE_KEY, newJourney, loadJourney, saveJourney, startEncounter, takeTurn } from '../../games/mosslight/state.js';

test('both encounter strategies make a friend, and a friend cannot be collected twice', () => {
  for (const strategy of ['pulse', 'soothe']) {
    const journey = newJourney();
    const encounter = startEncounter('fern');
    takeTurn(journey, encounter, strategy);
    takeTurn(journey, encounter, strategy);
    assert.equal(takeTurn(journey, encounter, 'befriend').event, 'joined');
    assert.deepEqual(journey.friends, ['fern']);
    assert.equal(takeTurn(journey, encounter, 'befriend').event, 'invalid');
  }
});

test('unsuccessful befriending exhausts energy and returns to camp without losing friends', () => {
  const journey = { ...newJourney(), x: 6, z: -6, hp: 3, friends: ['fern'] };
  assert.equal(takeTurn(journey, startEncounter('ember'), 'befriend').event, 'rested');
  assert.equal(journey.x, HOME.x);
  assert.equal(journey.z, HOME.z);
  assert.equal(journey.hp, 18);
  assert.deepEqual(journey.friends, ['fern']);
});

test('berries are finite and leaving does not spend a turn', () => {
  const journey = { ...newJourney(), hp: 4, berries: 1 };
  const encounter = startEncounter('tide');
  takeTurn(journey, encounter, 'berry');
  assert.ok(journey.hp > 4);
  assert.equal(journey.berries, 0);
  const before = structuredClone({ journey, encounter });
  assert.equal(takeTurn(journey, encounter, 'berry').event, 'empty');
  assert.equal(takeTurn(journey, encounter, 'leave').event, 'left');
  assert.deepEqual({ journey, encounter }, before);
});

test('journeys survive save/reload; malformed and unavailable storage are recoverable', () => {
  const data = new Map();
  const storage = { getItem: key => data.get(key), setItem: (key, value) => data.set(key, value) };
  const complete = { ...newJourney(), friends: ['fern', 'tide', 'ember'], complete: true };
  assert.equal(saveJourney(storage, complete), true);
  assert.deepEqual(loadJourney(storage), complete);
  data.set(SAVE_KEY, JSON.stringify({ version: 1, hp: -4, friends: 'fern', complete: true, x: 999 }));
  assert.deepEqual(loadJourney(storage), newJourney());
  data.set(SAVE_KEY, '{broken');
  assert.deepEqual(loadJourney(storage), newJourney());
  assert.deepEqual(loadJourney(undefined), newJourney());
  assert.equal(saveJourney(undefined, complete), false);
});
