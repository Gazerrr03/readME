import { FLOW_SHARDS_LIGHTING } from './config.js';
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
  const sourceGeometry = new THREE.BoxGeometry(2, 2, 2);
  const geometry = new THREE.InstancedBufferGeometry();
  geometry.setIndex(sourceGeometry.index.clone());
  for (const [name, attribute] of Object.entries(sourceGeometry.attributes)) {
    geometry.setAttribute(name, attribute.clone());
  }

  const instanceCount = size * size;
  const stateUvs = new Float32Array(instanceCount * 2);
  const randoms = new Float32Array(instanceCount);
  const decals = new Float32Array(instanceCount * 3);
  const occlusion = new Float32Array(instanceCount);
  const occlusionColor = new Float32Array(instanceCount);
  for (let index = 0; index < instanceCount; index += 1) {
    const [u, v] = stateUvForIndex(index, size);
    stateUvs[index * 2] = u;
    stateUvs[(index * 2) + 1] = v;
    randoms[index] = deterministicScalar(index);
    for (let channel = 0; channel < 3; channel += 1) {
      const first = deterministicScalar((index * 7) + channel + 17);
      const second = deterministicScalar((index * 11) + channel + 7919);
      decals[(index * 3) + channel] = 0.05 * (first - second);
    }
    occlusion[index] = deterministicScalar((index * 13) + 104729) < 0.02 ? 0 : 1;
    occlusionColor[index] = deterministicScalar((index * 17) + 130363) < 0.3 ? 1 : 0;
  }
  geometry.setAttribute('aStateUv', new THREE.InstancedBufferAttribute(stateUvs, 2));
  geometry.setAttribute('aRandom', new THREE.InstancedBufferAttribute(randoms, 1));
  geometry.setAttribute('aDecals', new THREE.InstancedBufferAttribute(decals, 3));
  geometry.setAttribute('aOcclusion', new THREE.InstancedBufferAttribute(occlusion, 1));
  geometry.setAttribute('aOcclusionColor', new THREE.InstancedBufferAttribute(occlusionColor, 1));
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
  shader.fragmentShader = shader.fragmentShader
    .replace(
      '#include <common>',
      '#include <common>\nvarying vec3 vFlowColor;\nvarying float vFlowOcclusion;\nvarying float vFlowOcclusionColor;\nvarying float vFlowHighlight;\nuniform vec3 uHighlightColor;\nuniform float uHighlightStrength;',
    )
    .replace(
      'vec4 diffuseColor = vec4( diffuse, opacity );',
      'vec4 diffuseColor = vec4(vFlowColor, opacity);',
    )
    .replace(
      '#include <opaque_fragment>',
      '#include <opaque_fragment>\ngl_FragColor.rgb = mix(vec3(vFlowOcclusionColor), gl_FragColor.rgb, vFlowOcclusion);\ngl_FragColor.rgb = min(gl_FragColor.rgb + (uHighlightColor * vFlowHighlight * uHighlightStrength), vec3(1.0));',
    );
}

function bindFlowUniforms(material, uniforms, patch) {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    patch(shader);
  };
  material.customProgramCacheKey = () => 'flow-shards-reference-deformation-v3';
}

function setRawHex(color, value) {
  const numeric = Number.parseInt(value.slice(1), 16);
  color.setRGB(
    ((numeric >> 16) & 0xFF) / 255,
    ((numeric >> 8) & 0xFF) / 255,
    (numeric & 0xFF) / 255,
  );
}

function setHighlightColor(THREE, uniforms, primaryValue) {
  const highlight = new THREE.Color();
  setRawHex(highlight, primaryValue);
  const hsl = {};
  highlight.getHSL(hsl);
  highlight.setHSL(
    hsl.h,
    Math.min(hsl.s * 0.45, 0.42),
    Math.min(hsl.l + 0.25, 0.94),
  );
  uniforms.uHighlightColor.value.copy(highlight);
}

function setPalette(THREE, uniforms, primaryValue) {
  setRawHex(uniforms.uPrimaryColor.value, primaryValue);
  setHighlightColor(THREE, uniforms, primaryValue);
  if (primaryValue.toUpperCase() === '#748BFF') {
    setRawHex(uniforms.uSecondaryColor.value, '#40566A');
    return;
  }
  const secondary = new THREE.Color();
  setRawHex(secondary, primaryValue);
  secondary.offsetHSL(-0.225, 0, -0.34);
  uniforms.uSecondaryColor.value.copy(secondary);
}

export function createShardMaterials({ THREE, size, state, mapped, config }) {
  const { geometry, sourceGeometry } = createInstancedShardGeometry(THREE, size);
  const uniforms = {
    uCurrentState: { value: state.currentTexture },
    uPreviousState: { value: state.previousTexture },
    uBaseSize: { value: mapped.baseSize },
    uStretch: { value: mapped.stretch },
    uKeyLightDirection: {
      value: new THREE.Vector3(...FLOW_SHARDS_LIGHTING.keyDirection).normalize(),
    },
    uPrimaryColor: { value: new THREE.Color() },
    uSecondaryColor: { value: new THREE.Color() },
    uHighlightColor: { value: new THREE.Color() },
    uHighlightStrength: { value: mapped.highlightStrength ?? 0.24 },
  };
  setPalette(THREE, uniforms, config.shardColor);
  const material = new THREE.MeshPhongMaterial({
    color: 0xFFFFFF,
    shininess: 48,
    specular: 0x718B96,
  });
  material.name = 'Flow Shards beauty';
  bindFlowUniforms(material, uniforms, patchBeautyShader);

  const depthMaterial = new THREE.MeshDepthMaterial();
  depthMaterial.name = 'Flow Shards depth';
  bindFlowUniforms(depthMaterial, uniforms, patchPositionShader);

  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
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
      uniforms.uHighlightStrength.value = nextMapped.highlightStrength ?? 0.24;
      setPalette(THREE, uniforms, nextConfig.shardColor);
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
