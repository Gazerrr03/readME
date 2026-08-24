import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../../vendor/three.module.min.js';
import { createShardMaterials } from '../../scripts/environment/background/wallpapers/flow-shards/materials.js';

const assertRgb = (color, expected) => {
  assert.ok(Math.abs(color.r - expected[0]) < 1e-6);
  assert.ok(Math.abs(color.g - expected[1]) < 1e-6);
  assert.ok(Math.abs(color.b - expected[2]) < 1e-6);
};

test('the OS accent resolves to the blue-gray lifecycle palette', () => {
  const shards = createShardMaterials({
    THREE,
    size: 1,
    state: { currentTexture: {}, previousTexture: {} },
    mapped: { baseSize: 1, bloomStrength: 1.43, highlightStrength: 0.24, stretch: 1 },
    config: { shardColor: '#748BFF' },
  });
  const shader = {
    uniforms: {},
    vertexShader: '#include <common>\n#include <beginnormal_vertex>\n#include <begin_vertex>',
    fragmentShader: [
      '#include <common>',
      'vec4 diffuseColor = vec4( diffuse, opacity );',
      '#include <opaque_fragment>',
    ].join('\n'),
  };

  shards.material.onBeforeCompile(shader);

  assertRgb(shader.uniforms.uPrimaryColor.value, [0x74 / 255, 0x8B / 255, 1]);
  assertRgb(shader.uniforms.uSecondaryColor.value, [0x40 / 255, 0x56 / 255, 0x6A / 255]);
  assert.equal(shards.sourceGeometry.parameters.depthSegments, 4);
  assert.equal(shader.uniforms.uOlderState.value, shader.uniforms.uPreviousState.value);
  assert.ok(shader.vertexShader.includes('flowCurvePoint'));
  assert.ok(shader.fragmentShader.includes('vFlowHighlight'));
  assert.ok(shader.fragmentShader.includes('uHighlightColor'));
  assert.ok(shader.uniforms.uKeyLightDirection.value instanceof THREE.Vector3);
  assert.equal(shader.uniforms.uHighlightStrength.value, 0.24);
  shards.dispose();
});
