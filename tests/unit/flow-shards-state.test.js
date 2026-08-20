import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createOriginState,
  safeDirection,
  stateUvForIndex,
} from '../../scripts/environment/background/wallpapers/flow-shards/simulation.js';

test('origin state is deterministic and encodes xyz plus life for every instance', () => {
  const first = createOriginState(2, 882);
  const second = createOriginState(2, 882);
  assert.equal(first.length, 16);
  assert.deepEqual([...first], [...second]);
  for (let index = 3; index < first.length; index += 4) {
    assert.ok(first[index] >= 0 && first[index] <= 1);
  }
});

test('state UVs point to texel centers and zero velocity has a finite fallback', () => {
  assert.deepEqual(stateUvForIndex(0, 2), [0.25, 0.25]);
  assert.deepEqual(stateUvForIndex(3, 2), [0.75, 0.75]);
  assert.deepEqual(safeDirection([1, 1, 1], [1, 1, 1]), [0, 1, 0]);
});
