import {
  FULLSCREEN_VERTEX_SHADER,
  SIMULATION_FRAGMENT_SHADER,
} from './shaders.js';

const DIRECTION_EPSILON = 1e-5;

function createSeededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function createOriginState(size, seed) {
  const random = createSeededRandom(seed);
  const state = new Float32Array(size * size * 4);

  for (let offset = 0; offset < state.length; offset += 4) {
    state[offset] = 0.12 * (random() - random());
    state[offset + 1] = 0.12 * (random() - random());
    state[offset + 2] = 0.12 * (random() - random());
    state[offset + 3] = random() * 0.45;
  }

  return state;
}

export function stateUvForIndex(index, size) {
  return [
    ((index % size) + 0.5) / size,
    (Math.floor(index / size) + 0.5) / size,
  ];
}

export function safeDirection(current, previous) {
  const x = current[0] - previous[0];
  const y = current[1] - previous[1];
  const z = current[2] - previous[2];
  const length = Math.hypot(x, y, z);
  if (length < DIRECTION_EPSILON) return [0, 1, 0];
  return [x / length, y / length, z / length];
}

function createFullscreenTriangle(THREE) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([
    -1, -1, 0,
    3, -1, 0,
    -1, 3, 0,
  ], 3));
  return geometry;
}

function createStateTarget(THREE, size) {
  const target = new THREE.WebGLRenderTarget(size, size, {
    depthBuffer: false,
    format: THREE.RGBAFormat,
    generateMipmaps: false,
    magFilter: THREE.NearestFilter,
    minFilter: THREE.NearestFilter,
    stencilBuffer: false,
    type: THREE.FloatType,
  });
  target.texture.name = 'Flow Shards state';
  return target;
}

export function createFlowSimulation({ THREE, renderer, size, mapped, seed = 882 }) {
  const originTexture = new THREE.DataTexture(
    createOriginState(size, seed),
    size,
    size,
    THREE.RGBAFormat,
    THREE.FloatType,
  );
  originTexture.generateMipmaps = false;
  originTexture.magFilter = THREE.NearestFilter;
  originTexture.minFilter = THREE.NearestFilter;
  originTexture.needsUpdate = true;
  originTexture.name = 'Flow Shards origins';

  const targets = [createStateTarget(THREE, size), createStateTarget(THREE, size)];
  const uniforms = {
    uState: { value: originTexture },
    uOrigin: { value: originTexture },
    uDelta: { value: 0 },
    uTime: { value: 0 },
    uTimeScale: { value: mapped.timeScale },
    uNoiseScale: { value: mapped.noiseScale },
    uCurlStrength: { value: mapped.curlStrength },
    uLifeSeconds: { value: mapped.lifeSeconds },
    uSpawnRadius: { value: mapped.spawnRadius },
    uInitialize: { value: 1 },
  };
  const material = new THREE.ShaderMaterial({
    depthTest: false,
    depthWrite: false,
    fragmentShader: SIMULATION_FRAGMENT_SHADER,
    toneMapped: false,
    uniforms,
    vertexShader: FULLSCREEN_VERTEX_SHADER,
  });
  material.name = 'Flow Shards simulation';
  const geometry = createFullscreenTriangle(THREE);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  scene.add(mesh);

  let currentTexture = originTexture;
  let previousTexture = originTexture;
  let writeIndex = 0;
  let generation = 0;
  let disposed = false;

  const state = () => ({ currentTexture, previousTexture });
  const renderState = ({ delta, elapsed, initialize, source, target }) => {
    uniforms.uState.value = source;
    uniforms.uDelta.value = delta;
    uniforms.uTime.value = elapsed;
    uniforms.uInitialize.value = initialize;
    const previousTarget = renderer.getRenderTarget();
    try {
      renderer.setRenderTarget(target);
      renderer.render(scene, camera);
    } finally {
      renderer.setRenderTarget(previousTarget);
    }
  };

  const advance = (delta, elapsed, countGeneration) => {
    renderState({
      delta,
      elapsed,
      initialize: 0,
      source: currentTexture,
      target: targets[writeIndex],
    });
    previousTexture = currentTexture;
    currentTexture = targets[writeIndex].texture;
    writeIndex = 1 - writeIndex;
    if (countGeneration) generation += 1;
    return state();
  };

  try {
    renderState({
      delta: 0,
      elapsed: 0,
      initialize: 1,
      source: originTexture,
      target: targets[0],
    });
    renderState({
      delta: 0,
      elapsed: 0,
      initialize: 0,
      source: targets[0].texture,
      target: targets[1],
    });
    previousTexture = targets[0].texture;
    currentTexture = targets[1].texture;
  } catch (error) {
    scene.remove(mesh);
    geometry.dispose();
    material.dispose();
    originTexture.dispose();
    targets.forEach((target) => target.dispose());
    throw error;
  }

  return {
    get currentTexture() {
      return currentTexture;
    },
    get previousTexture() {
      return previousTexture;
    },
    get generation() {
      return generation;
    },
    warmUp(steps, delta = 1 / 60, endElapsed = 0) {
      if (disposed) throw new Error('Flow Shards simulation has been disposed');
      const safeSteps = Math.max(0, Math.floor(Number.isFinite(steps) ? steps : 0));
      const safeDelta = Math.min(Math.max(Number.isFinite(delta) ? delta : 0, 0), 1 / 20);
      const safeEndElapsed = Number.isFinite(endElapsed) ? endElapsed : 0;
      if (safeDelta === 0) return state();
      for (let index = 0; index < safeSteps; index += 1) {
        const elapsed = safeEndElapsed + ((index - safeSteps + 1) * safeDelta);
        advance(safeDelta, elapsed, false);
      }
      return state();
    },
    step(delta, elapsed) {
      if (disposed) throw new Error('Flow Shards simulation has been disposed');
      const safeDelta = Math.min(Math.max(Number.isFinite(delta) ? delta : 0, 0), 1 / 20);
      if (safeDelta === 0) return state();
      return advance(safeDelta, Number.isFinite(elapsed) ? elapsed : 0, true);
    },
    updateConfig(nextMapped) {
      uniforms.uTimeScale.value = nextMapped.timeScale;
      uniforms.uNoiseScale.value = nextMapped.noiseScale;
      uniforms.uCurlStrength.value = nextMapped.curlStrength;
      uniforms.uLifeSeconds.value = nextMapped.lifeSeconds;
      uniforms.uSpawnRadius.value = nextMapped.spawnRadius;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      scene.remove(mesh);
      geometry.dispose();
      material.dispose();
      originTexture.dispose();
      targets.forEach((target) => target.dispose());
    },
  };
}
