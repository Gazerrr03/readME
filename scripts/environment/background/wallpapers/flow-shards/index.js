import {
  FLOW_SHARDS_LIGHTING,
  mapFlowShardsConfig,
  normalizeFlowShardsConfig,
} from './config.js';
import { createBloomPipeline } from './bloom.js';
import { createShardMaterials } from './materials.js';
import { createFlowSimulation } from './simulation.js';

const MAX_DELTA_SECONDS = 1 / 20;
const MAX_PIXEL_RATIO = 1.7;
const WARM_UP_DELTA_SECONDS = 1 / 120;
const REFERENCE_WARM_UP_SECONDS = 3;
const REFERENCE_WARM_UP_DELTA_SECONDS = 1 / 60;
const REFERENCE_WARM_UP_STEPS = Math.round(
  REFERENCE_WARM_UP_SECONDS / REFERENCE_WARM_UP_DELTA_SECONDS,
);
const REFERENCE_WARM_UP_STEPS_PER_FRAME = 6;
const INITIAL_VISIBLE_INSTANCE_FRACTION = 0.25;
const MOTION_STATES = new Set(['running', 'focused', 'static']);
const CAMERA_BASE_POSITION = Object.freeze([57.57376061392961, 48.10061185396083, 144.38555018465544]);
const CAMERA_TARGET = Object.freeze([21.4700462195145, 3.80829128472304, -4.742430795073441]);

function createCanvas(document, descriptor) {
  const canvas = document.createElement('canvas');
  canvas.dataset.backgroundId = descriptor.id;
  canvas.dataset.backgroundKind = descriptor.kind;
  canvas.dataset.wallpaperSurface = '';
  canvas.dataset.wallpaperRenderer = 'three-webgl2';
  canvas.dataset.simulationGeneration = '0';
  canvas.dataset.simulationSize = '0';
  canvas.dataset.wallpaperFrame = '0';
  canvas.setAttribute('aria-hidden', 'true');
  return canvas;
}

function assertFlowCapabilities(THREE, renderer, view) {
  const gl = renderer.getContext();
  const isWebGL2 = typeof view?.WebGL2RenderingContext === 'function'
    && gl instanceof view.WebGL2RenderingContext;
  if (!isWebGL2) throw new Error('Flow Shards requires WebGL2');
  if (gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) < 1) {
    throw new Error('Flow Shards requires vertex texture sampling');
  }
  if (!gl.getExtension('EXT_color_buffer_float')) {
    throw new Error('Flow Shards requires EXT_color_buffer_float');
  }

  const probe = new THREE.WebGLRenderTarget(1, 1, {
    depthBuffer: false,
    format: THREE.RGBAFormat,
    generateMipmaps: false,
    magFilter: THREE.NearestFilter,
    minFilter: THREE.NearestFilter,
    stencilBuffer: false,
    type: THREE.FloatType,
  });
  const previousTarget = renderer.getRenderTarget();
  try {
    renderer.setRenderTarget(probe);
    renderer.clear();
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      throw new Error(`Flow Shards float render target is incomplete (${status})`);
    }
  } finally {
    renderer.setRenderTarget(previousTarget);
    probe.dispose();
  }
}

function measureCanvas(canvas, view) {
  const bounds = canvas.getBoundingClientRect?.();
  return {
    height: Math.max(1, Math.floor(bounds?.height || view?.innerHeight || 1)),
    width: Math.max(1, Math.floor(bounds?.width || view?.innerWidth || 1)),
  };
}

function fogRange(amount) {
  return {
    near: 260 - (amount * 180),
    far: 620 - (amount * 420),
  };
}

function positionReferenceCamera(camera, elapsed) {
  const pulse = 1.1 - (0.17 * Math.sin(elapsed));
  camera.position.set(
    CAMERA_BASE_POSITION[0] * pulse,
    CAMERA_BASE_POSITION[1] * pulse,
    CAMERA_BASE_POSITION[2] * pulse,
  );
  camera.lookAt(...CAMERA_TARGET);
}

function disposePipeline(scene, pipeline) {
  if (!pipeline) return;
  scene?.remove(pipeline.shards.mesh);
  pipeline.shards.dispose();
  pipeline.simulation.dispose();
}

function disposeRuntime(runtime) {
  if (!runtime) return;
  disposePipeline(runtime.scene, runtime.pipeline);
  runtime.scene?.remove(runtime.plane);
  runtime.planeGeometry?.dispose();
  runtime.planeMaterial?.dispose();
  runtime.directional?.shadow?.dispose?.();
  runtime.bloom?.dispose();
  runtime.renderer?.renderLists?.dispose?.();
  runtime.renderer?.dispose();
}

function assertNoGlError(runtime) {
  const gl = runtime.renderer.getContext();
  const error = gl.getError();
  if (error !== gl.NO_ERROR) throw new Error(`Flow Shards WebGL error (${error})`);
}

export function createWallpaperRenderer({
  document,
  descriptor,
  config,
  onError = () => {},
}) {
  const view = document.defaultView;
  const canvas = createCanvas(document, descriptor);
  let normalized = normalizeFlowShardsConfig(config);
  let mapped = mapFlowShardsConfig(normalized);
  let motion = 'static';
  let runtime = null;
  let frameId = null;
  let lastFrameTime = null;
  let simulationTime = 0;
  let frameCount = 0;
  let destroyed = false;
  let contextLost = false;
  let runtimeErrorReported = false;
  let readySettled = false;
  let resolveReady;
  let rejectReady;
  const ready = new Promise((resolve, reject) => {
    resolveReady = resolve;
    rejectReady = reject;
  });

  const settleReady = () => {
    if (readySettled) return;
    readySettled = true;
    resolveReady();
  };

  const rejectInitialization = (error) => {
    if (readySettled) return;
    readySettled = true;
    rejectReady(error);
  };

  const cancelFrame = () => {
    if (frameId === null) return;
    view?.cancelAnimationFrame?.(frameId);
    frameId = null;
  };

  const reportRuntimeError = (error) => {
    if (runtimeErrorReported) return;
    runtimeErrorReported = true;
    try {
      onError(error);
    } catch {
      // A host callback cannot make GPU cleanup unsafe.
    }
  };

  const failRuntime = (error, diagnostic = 'runtime-failed') => {
    cancelFrame();
    lastFrameTime = null;
    canvas.dataset.wallpaperError = diagnostic;
    if (!readySettled) rejectInitialization(error);
    else reportRuntimeError(error);
  };

  const resizeRuntime = (targetRuntime = runtime) => {
    if (!targetRuntime || destroyed || contextLost) return;
    const { width, height } = measureCanvas(canvas, view);
    const pixelRatio = Math.min(view?.devicePixelRatio || 1, MAX_PIXEL_RATIO);
    targetRuntime.renderer.setPixelRatio(pixelRatio);
    targetRuntime.renderer.setSize(width, height, false);
    targetRuntime.camera.aspect = width / height;
    targetRuntime.camera.updateProjectionMatrix();
    const drawingSize = targetRuntime.renderer.getDrawingBufferSize(new targetRuntime.THREE.Vector2());
    targetRuntime.bloom?.resize(drawingSize.x, drawingSize.y);
  };

  const applySceneConfig = (targetRuntime, nextMapped, nextConfig) => {
    targetRuntime.scene.background.set(nextConfig.backgroundColor);
    targetRuntime.scene.fog.color.set(nextConfig.backgroundColor);
    const nextFog = fogRange(nextMapped.fogAmount);
    targetRuntime.scene.fog.near = nextFog.near;
    targetRuntime.scene.fog.far = nextFog.far;
    targetRuntime.planeMaterial.opacity = 0;
    targetRuntime.directional.intensity = 0.62 + (nextMapped.shadowOpacity * 0.72);
    targetRuntime.fill.intensity = 0.08 + ((1 - nextMapped.shadowOpacity) * 0.08);
    targetRuntime.ambient.intensity = 0.14 + ((1 - nextMapped.shadowOpacity) * 0.06);
  };

  const buildPipeline = (targetRuntime, nextMapped, nextConfig) => {
    const simulation = createFlowSimulation({
      THREE: targetRuntime.THREE,
      renderer: targetRuntime.renderer,
      size: nextMapped.simulationSize,
      mapped: nextMapped,
    });
    try {
      const shards = createShardMaterials({
        THREE: targetRuntime.THREE,
        size: nextMapped.simulationSize,
        state: simulation,
        mapped: nextMapped,
        config: nextConfig,
      });
      const instanceCount = nextMapped.simulationSize ** 2;
      shards.mesh.geometry.instanceCount = Math.ceil(
        instanceCount * INITIAL_VISIBLE_INSTANCE_FRACTION,
      );
      return {
        simulation,
        shards,
        size: nextMapped.simulationSize,
        instanceCount,
        warmUpRemaining: REFERENCE_WARM_UP_STEPS,
      };
    } catch (error) {
      simulation.dispose();
      throw error;
    }
  };

  const renderPipeline = (targetRuntime, pipeline, delta, bloomMapped = mapped) => {
    if (frameCount > 0 && delta > 0 && pipeline.warmUpRemaining > 0) {
      const warmUpSteps = Math.min(
        pipeline.warmUpRemaining,
        REFERENCE_WARM_UP_STEPS_PER_FRAME,
      );
      simulationTime += warmUpSteps * REFERENCE_WARM_UP_DELTA_SECONDS;
      pipeline.simulation.warmUp(
        warmUpSteps,
        REFERENCE_WARM_UP_DELTA_SECONDS,
        simulationTime,
      );
      pipeline.warmUpRemaining -= warmUpSteps;
    }
    const warmUpProgress = 1 - (pipeline.warmUpRemaining / REFERENCE_WARM_UP_STEPS);
    const visibleFraction = INITIAL_VISIBLE_INSTANCE_FRACTION
      + ((1 - INITIAL_VISIBLE_INSTANCE_FRACTION) * warmUpProgress);
    pipeline.shards.mesh.geometry.instanceCount = Math.ceil(
      pipeline.instanceCount * visibleFraction,
    );
    const nextState = pipeline.simulation.step(delta, simulationTime);
    pipeline.shards.updateState(nextState);
    if (delta > 0) {
      pipeline.shards.mesh.rotation.y += delta * 0.18 * bloomMapped.timeScale;
    }
    positionReferenceCamera(targetRuntime.camera, simulationTime);
    canvas.dataset.simulationGeneration = String(pipeline.simulation.generation);
    const bloomScale = motion === 'focused' ? 0.55 : 1;
    targetRuntime.bloom.render(targetRuntime.scene, targetRuntime.camera, {
      strength: bloomMapped.bloomStrength * bloomScale,
      threshold: bloomMapped.bloomThreshold,
    });
    assertNoGlError(targetRuntime);
    frameCount += 1;
    canvas.dataset.wallpaperFrame = String(frameCount);
  };

  const renderFrame = (timestamp, { stable = false } = {}) => {
    if (!runtime || destroyed || contextLost) return;
    const previousTime = lastFrameTime;
    lastFrameTime = Number.isFinite(timestamp) ? timestamp : view?.performance?.now?.() ?? 0;
    const elapsed = previousTime === null
      ? 0
      : Math.min(Math.max((lastFrameTime - previousTime) / 1000, 0), MAX_DELTA_SECONDS);
    const motionScale = motion === 'running' ? 1 : motion === 'focused' ? 0.25 : 0;
    const delta = stable ? 0 : elapsed * motionScale;
    simulationTime += delta;
    renderPipeline(runtime, runtime.pipeline, delta);
  };

  const scheduleFrame = () => {
    if (
      destroyed || contextLost || !runtime || frameId !== null
      || motion === 'static' || document.hidden || !view?.requestAnimationFrame
    ) return;
    frameId = view.requestAnimationFrame((timestamp) => {
      frameId = null;
      if (destroyed || contextLost || document.hidden || motion === 'static') return;
      try {
        renderFrame(timestamp);
      } catch (error) {
        failRuntime(error);
        return;
      }
      scheduleFrame();
    });
  };

  const renderStableFrame = () => {
    if (!runtime || destroyed || contextLost || document.hidden) return;
    try {
      lastFrameTime = null;
      renderFrame(view?.performance?.now?.() ?? 0, { stable: true });
    } catch (error) {
      failRuntime(error);
    }
  };

  const handleResize = () => {
    if (!runtime || destroyed || contextLost) return;
    try {
      resizeRuntime();
      renderStableFrame();
    } catch (error) {
      failRuntime(error);
    }
  };

  const handleVisibility = () => {
    lastFrameTime = null;
    if (document.hidden) {
      cancelFrame();
      return;
    }
    if (motion === 'static') renderStableFrame();
    else scheduleFrame();
  };

  const handleContextLost = (event) => {
    event.preventDefault();
    if (contextLost || destroyed) return;
    contextLost = true;
    cancelFrame();
    lastFrameTime = null;
    canvas.dataset.wallpaperContext = 'lost';
    const error = new Error('Flow Shards WebGL context was lost');
    rejectInitialization(error);
    reportRuntimeError(error);
  };

  const initialize = async () => {
    const THREE = await import('../../../../../vendor/three.module.min.js');
    if (destroyed) return;
    const nextRuntime = { THREE };
    try {
      const renderer = new THREE.WebGLRenderer({
        alpha: false,
        antialias: false,
        canvas,
        powerPreference: 'high-performance',
        premultipliedAlpha: false,
      });
      nextRuntime.renderer = renderer;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.NoToneMapping;
      renderer.toneMappingExposure = 1;
      assertFlowCapabilities(THREE, renderer, view);

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(normalized.backgroundColor);
      const initialFog = fogRange(mapped.fogAmount);
      scene.fog = new THREE.Fog(normalized.backgroundColor, initialFog.near, initialFog.far);
      nextRuntime.scene = scene;

      const camera = new THREE.PerspectiveCamera(80, 1, 1, 700);
      positionReferenceCamera(camera, 0);
      nextRuntime.camera = camera;

      const ambient = new THREE.AmbientLight(FLOW_SHARDS_LIGHTING.ambientColor, 0.14);
      const directional = new THREE.DirectionalLight(FLOW_SHARDS_LIGHTING.keyColor, 1.1);
      directional.position.set(...FLOW_SHARDS_LIGHTING.keyPosition);
      directional.castShadow = true;
      directional.shadow.mapSize.set(2048, 2048);
      directional.shadow.camera.left = -80;
      directional.shadow.camera.right = 80;
      directional.shadow.camera.top = 80;
      directional.shadow.camera.bottom = -80;
      directional.shadow.camera.near = 20;
      directional.shadow.camera.far = 500;
      directional.shadow.camera.updateProjectionMatrix();
      directional.shadow.bias = 0.0001;
      const fill = new THREE.DirectionalLight(FLOW_SHARDS_LIGHTING.fillColor, 0.12);
      fill.position.set(150, 90, 120);
      scene.add(ambient, directional, directional.target, fill, fill.target);
      nextRuntime.ambient = ambient;
      nextRuntime.directional = directional;
      nextRuntime.fill = fill;

      const planeGeometry = new THREE.PlaneGeometry(400, 400);
      const planeMaterial = new THREE.ShadowMaterial({
        color: 0x000000,
        opacity: 0,
        transparent: true,
      });
      const plane = new THREE.Mesh(planeGeometry, planeMaterial);
      plane.position.y = -80;
      plane.rotation.x = -Math.PI / 2;
      plane.receiveShadow = true;
      plane.visible = false;
      plane.name = 'Flow Shards shadow receiver';
      scene.add(plane);
      nextRuntime.plane = plane;
      nextRuntime.planeGeometry = planeGeometry;
      nextRuntime.planeMaterial = planeMaterial;

      nextRuntime.pipeline = buildPipeline(nextRuntime, mapped, normalized);
      scene.add(nextRuntime.pipeline.shards.mesh);

      nextRuntime.bloom = createBloomPipeline({
        THREE,
        renderer,
        width: 1,
        height: 1,
      });
      runtime = nextRuntime;
      canvas.addEventListener('webglcontextlost', handleContextLost, false);
      view?.addEventListener?.('resize', handleResize);
      document.addEventListener?.('visibilitychange', handleVisibility);
      resizeRuntime(nextRuntime);
      applySceneConfig(nextRuntime, mapped, normalized);
      simulationTime += WARM_UP_DELTA_SECONDS;
      renderPipeline(nextRuntime, nextRuntime.pipeline, WARM_UP_DELTA_SECONDS);
      canvas.dataset.simulationSize = String(mapped.simulationSize);
      settleReady();
      lastFrameTime = null;
      scheduleFrame();
    } catch (error) {
      if (runtime === nextRuntime) runtime = null;
      disposeRuntime(nextRuntime);
      throw error;
    }
  };

  Promise.resolve().then(initialize).catch((error) => {
    if (destroyed) return;
    canvas.dataset.wallpaperError = 'initialization-failed';
    rejectInitialization(error);
  });

  return {
    element: canvas,
    ready,
    setMotionState(nextMotion) {
      motion = MOTION_STATES.has(nextMotion) ? nextMotion : 'static';
      canvas.dataset.backgroundMotion = motion;
      lastFrameTime = null;
      if (motion === 'static' || document.hidden) {
        cancelFrame();
        if (!document.hidden) renderStableFrame();
      } else {
        scheduleFrame();
      }
    },
    updateConfig(nextConfig) {
      const nextNormalized = normalizeFlowShardsConfig(nextConfig);
      const nextMapped = mapFlowShardsConfig(nextNormalized);
      if (!runtime || destroyed || contextLost) {
        normalized = nextNormalized;
        mapped = nextMapped;
        return;
      }

      try {
        if (nextMapped.simulationSize !== runtime.pipeline.size) {
          const candidate = buildPipeline(runtime, nextMapped, nextNormalized);
          const previous = runtime.pipeline;
          const previousSimulationTime = simulationTime;
          runtime.scene.remove(previous.shards.mesh);
          runtime.scene.add(candidate.shards.mesh);
          applySceneConfig(runtime, nextMapped, nextNormalized);
          try {
            simulationTime += WARM_UP_DELTA_SECONDS;
            renderPipeline(runtime, candidate, WARM_UP_DELTA_SECONDS, nextMapped);
          } catch (error) {
            simulationTime = previousSimulationTime;
            runtime.scene.remove(candidate.shards.mesh);
            runtime.scene.add(previous.shards.mesh);
            applySceneConfig(runtime, mapped, normalized);
            canvas.dataset.simulationGeneration = String(previous.simulation.generation);
            disposePipeline(null, candidate);
            throw error;
          }
          runtime.pipeline = candidate;
          disposePipeline(null, previous);
          canvas.dataset.simulationSize = String(nextMapped.simulationSize);
        } else {
          runtime.pipeline.simulation.updateConfig(nextMapped);
          runtime.pipeline.shards.updateConfig(nextMapped, nextNormalized);
          applySceneConfig(runtime, nextMapped, nextNormalized);
        }
        normalized = nextNormalized;
        mapped = nextMapped;
        if (motion === 'static') renderStableFrame();
      } catch (error) {
        failRuntime(error, 'config-update-failed');
      }
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      cancelFrame();
      lastFrameTime = null;
      canvas.removeEventListener('webglcontextlost', handleContextLost, false);
      view?.removeEventListener?.('resize', handleResize);
      document.removeEventListener?.('visibilitychange', handleVisibility);
      const previousRuntime = runtime;
      runtime = null;
      disposeRuntime(previousRuntime);
      rejectInitialization(new Error('Flow Shards renderer was destroyed before becoming ready'));
      canvas.remove();
    },
  };
}
