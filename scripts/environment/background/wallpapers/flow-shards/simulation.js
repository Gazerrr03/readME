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
    const azimuth = random() * Math.PI * 2;
    const z = (random() * 2) - 1;
    const radius = Math.cbrt(random());
    const radial = Math.sqrt(1 - (z * z)) * radius;
    state[offset] = Math.cos(azimuth) * radial;
    state[offset + 1] = z * radius;
    state[offset + 2] = Math.sin(azimuth) * radial;
    state[offset + 3] = random();
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
  let initialized = false;
  let disposed = false;

  return {
    get currentTexture() {
      return currentTexture;
    },
    get previousTexture() {
      return previousTexture;
    },
    step(delta, elapsed) {
      if (disposed) throw new Error('Flow Shards simulation has been disposed');
      const safeDelta = Math.min(Math.max(Number.isFinite(delta) ? delta : 0, 0), 1 / 20);
      uniforms.uState.value = currentTexture;
      uniforms.uDelta.value = safeDelta;
      uniforms.uTime.value = Number.isFinite(elapsed) ? elapsed : 0;
      uniforms.uInitialize.value = initialized ? 0 : 1;

      const previousTarget = renderer.getRenderTarget();
      renderer.setRenderTarget(targets[writeIndex]);
      renderer.render(scene, camera);
      renderer.setRenderTarget(previousTarget);

      previousTexture = currentTexture;
      currentTexture = targets[writeIndex].texture;
      writeIndex = 1 - writeIndex;
      initialized = true;
      return { currentTexture, previousTexture };
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
