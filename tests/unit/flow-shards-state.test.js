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
  for (let index = 3; index < first.length; index += 4) {
    assert.ok(first[index] >= 0 && first[index] <= 1);
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

  const initializedState = {
    currentTexture: simulation.currentTexture,
    previousTexture: simulation.previousTexture,
  };
  assert.deepEqual(simulation.step(0, 0), initializedState);
  assert.equal(renders.length, 2);
  assert.equal(simulation.generation, 0);

  const advancedState = simulation.step(1 / 120, 1 / 120);
  assert.equal(renders.length, 3);
  assert.equal(renders[2].delta, 1 / 120);
  assert.equal(renders[2].initialize, 0);
  assert.equal(advancedState.previousTexture, initializedState.currentTexture);
  assert.equal(simulation.generation, 1);

  assert.deepEqual(simulation.step(0, 1), advancedState);
  assert.equal(renders.length, 3);
  assert.equal(simulation.generation, 1);
  simulation.dispose();
});
