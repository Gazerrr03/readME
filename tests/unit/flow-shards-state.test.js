import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../../vendor/three.module.min.js';
import {
  createFlowSimulation,
  createOriginState,
  safeDirection,
  stateUvForIndex,
} from '../../scripts/environment/background/wallpapers/flow-shards/simulation.js';

test('origin state is deterministic and encodes xyz plus life for every instance', () => {
  const first = createOriginState(2, 882);
  const second = createOriginState(2, 882);
  assert.equal(first.length, 16);
  assert.deepEqual([...first], [...second]);
  for (let offset = 0; offset < first.length; offset += 4) {
    assert.ok(Math.abs(first[offset]) <= 0.12);
    assert.ok(Math.abs(first[offset + 1]) <= 0.12);
    assert.ok(Math.abs(first[offset + 2]) <= 0.12);
    assert.ok(first[offset + 3] >= 0 && first[offset + 3] <= 0.45);
  }
});

test('state UVs point to texel centers and zero velocity has a finite fallback', () => {
  assert.deepEqual(stateUvForIndex(0, 2), [0.25, 0.25]);
  assert.deepEqual(stateUvForIndex(3, 2), [0.75, 0.75]);
  assert.deepEqual(safeDirection([1, 1, 1], [1, 1, 1]), [0, 1, 0]);
});

test('simulation initializes coherent history and zero-delta renders preserve its generation', () => {
  let renderTarget = null;
  const renders = [];
  const renderer = {
    getRenderTarget: () => renderTarget,
    setRenderTarget(nextTarget) {
      renderTarget = nextTarget;
    },
    render(scene) {
      const { uniforms } = scene.children[0].material;
      renders.push({
        delta: uniforms.uDelta.value,
        elapsed: uniforms.uTime.value,
        initialize: uniforms.uInitialize.value,
        source: uniforms.uState.value,
        target: renderTarget,
      });
    },
  };
  const simulation = createFlowSimulation({
    THREE,
    renderer,
    size: 2,
    mapped: {
      timeScale: 0.5,
      noiseScale: 0.75,
      curlStrength: 1.1,
      lifeSeconds: 8,
      spawnRadius: 3,
    },
  });

  assert.equal(renders.length, 2);
  assert.equal(renders[0].initialize, 1);
  assert.equal(renders[1].initialize, 0);
  assert.equal(renders[1].source, renders[0].target.texture);
  assert.equal(simulation.previousTexture, renders[0].target.texture);
  assert.equal(simulation.currentTexture, renders[1].target.texture);
  assert.equal(simulation.generation, 0);

  simulation.warmUp(2, 1 / 60, 5);
  assert.equal(renders.length, 4);
  assert.equal(renders[2].elapsed, 5 - (1 / 60));
  assert.equal(renders[3].elapsed, 5);
  assert.equal(simulation.generation, 0);

  const initializedState = {
    olderTexture: simulation.olderTexture,
    currentTexture: simulation.currentTexture,
    previousTexture: simulation.previousTexture,
  };
  assert.deepEqual(simulation.step(0, 0), initializedState);
  assert.equal(renders.length, 4);
  assert.equal(simulation.generation, 0);

  const advancedState = simulation.step(1 / 120, 1 / 120);
  assert.equal(renders.length, 5);
  assert.equal(renders[4].delta, 1 / 120);
  assert.equal(renders[4].initialize, 0);
  assert.equal(advancedState.olderTexture, initializedState.previousTexture);
  assert.equal(advancedState.previousTexture, initializedState.currentTexture);
  assert.equal(simulation.generation, 1);

  assert.deepEqual(simulation.step(0, 1), advancedState);
  assert.equal(renders.length, 5);
  assert.equal(simulation.generation, 1);
  simulation.dispose();
});
