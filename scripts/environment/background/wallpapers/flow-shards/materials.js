import { stateUvForIndex } from './simulation.js';
import {
  FLOW_DEFORMATION_CHUNK,
  FLOW_POSITION_TRANSFORM,
} from './shaders.js';

function deterministicScalar(index) {
  let value = Math.imul((index + 1) >>> 0, 0x9E3779B1);
  value ^= value >>> 16;
  value = Math.imul(value, 0x85EBCA6B);
  value ^= value >>> 13;
  return (value >>> 0) / 4294967296;
}

function createInstancedShardGeometry(THREE, size) {
  const sourceGeometry = new THREE.BoxGeometry(1, 1, 1);
  const geometry = new THREE.InstancedBufferGeometry();
  geometry.setIndex(sourceGeometry.index.clone());
  for (const [name, attribute] of Object.entries(sourceGeometry.attributes)) {
    geometry.setAttribute(name, attribute.clone());
  }

  const instanceCount = size * size;
  const stateUvs = new Float32Array(instanceCount * 2);
  const randoms = new Float32Array(instanceCount);
  for (let index = 0; index < instanceCount; index += 1) {
    const [u, v] = stateUvForIndex(index, size);
    stateUvs[index * 2] = u;
    stateUvs[(index * 2) + 1] = v;
    randoms[index] = deterministicScalar(index);
  }
  geometry.setAttribute('aStateUv', new THREE.InstancedBufferAttribute(stateUvs, 2));
  geometry.setAttribute('aRandom', new THREE.InstancedBufferAttribute(randoms, 1));
  geometry.instanceCount = instanceCount;
  geometry.name = 'Flow Shards instances';
  return { geometry, sourceGeometry };
}

function patchPositionShader(shader) {
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', `#include <common>\n${FLOW_DEFORMATION_CHUNK}`)
    .replace('#include <begin_vertex>', FLOW_POSITION_TRANSFORM);
}

function patchBeautyShader(shader) {
  patchPositionShader(shader);
  shader.vertexShader = shader.vertexShader.replace(
    '#include <beginnormal_vertex>',
    '#include <beginnormal_vertex>\nobjectNormal = flowDeformNormal(objectNormal);',
  );
}

function bindFlowUniforms(material, uniforms, patch) {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    patch(shader);
  };
  material.customProgramCacheKey = () => 'flow-shards-shared-deformation-v1';
}

export function createShardMaterials({ THREE, size, state, mapped, config }) {
  const { geometry, sourceGeometry } = createInstancedShardGeometry(THREE, size);
  const uniforms = {
    uCurrentState: { value: state.currentTexture },
    uPreviousState: { value: state.previousTexture },
    uBaseSize: { value: mapped.baseSize },
    uStretch: { value: mapped.stretch },
  };
  const material = new THREE.MeshStandardMaterial({
    color: config.shardColor,
    emissive: config.shardColor,
    emissiveIntensity: 0.35 + (mapped.bloomStrength * 0.28),
    metalness: 0.18,
    roughness: 0.38,
  });
  material.name = 'Flow Shards beauty';
  bindFlowUniforms(material, uniforms, patchBeautyShader);

  const depthMaterial = new THREE.MeshDepthMaterial();
  depthMaterial.name = 'Flow Shards depth';
  bindFlowUniforms(depthMaterial, uniforms, patchPositionShader);

  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.customDepthMaterial = depthMaterial;
  mesh.frustumCulled = false;
  mesh.name = 'Flow Shards field';
  let disposed = false;

  return {
    geometry,
    material,
    depthMaterial,
    mesh,
    sourceGeometry,
    updateState(nextState) {
      uniforms.uCurrentState.value = nextState.currentTexture;
      uniforms.uPreviousState.value = nextState.previousTexture;
    },
    updateConfig(nextMapped, nextConfig) {
      uniforms.uBaseSize.value = nextMapped.baseSize;
      uniforms.uStretch.value = nextMapped.stretch;
      material.color.set(nextConfig.shardColor);
      material.emissive.set(nextConfig.shardColor);
      material.emissiveIntensity = 0.35 + (nextMapped.bloomStrength * 0.28);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      geometry.dispose();
      sourceGeometry.dispose();
      material.dispose();
      depthMaterial.dispose();
    },
  };
}
