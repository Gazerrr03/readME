import { mapFlowShardsConfig, normalizeFlowShardsConfig } from './config.js';
import { createBloomPipeline } from './bloom.js';
import { createShardMaterials } from './materials.js';
import { createFlowSimulation } from './simulation.js';

const MAX_DELTA_SECONDS = 1 / 20;
const MAX_PIXEL_RATIO = 1.5;
const MOTION_STATES = new Set(['running', 'focused', 'static']);

function createCanvas(document, descriptor) {
  const canvas = document.createElement('canvas');
  canvas.dataset.backgroundId = descriptor.id;
  canvas.dataset.backgroundKind = descriptor.kind;
  canvas.dataset.wallpaperSurface = '';
  canvas.dataset.wallpaperRenderer = 'three-webgl2';
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

function fogDensity(amount) {
  return 0.012 + (amount * 0.052);
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
    targetRuntime.scene.fog.density = fogDensity(nextMapped.fogAmount);
    targetRuntime.planeMaterial.opacity = nextMapped.shadowOpacity;
    targetRuntime.directional.intensity = 1.05 + (nextMapped.shadowOpacity * 0.35);
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
      return { simulation, shards, size: nextMapped.simulationSize };
    } catch (error) {
      simulation.dispose();
      throw error;
    }
  };

  const renderPipeline = (targetRuntime, pipeline, delta, bloomMapped = mapped) => {
    const nextState = pipeline.simulation.step(delta, simulationTime);
    pipeline.shards.updateState(nextState);
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
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1;
      assertFlowCapabilities(THREE, renderer, view);

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(normalized.backgroundColor);
      scene.fog = new THREE.FogExp2(normalized.backgroundColor, fogDensity(mapped.fogAmount));
      nextRuntime.scene = scene;

      const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 48);
      camera.position.set(0, 1.25, 11);
      camera.lookAt(0, 0, 0);
      nextRuntime.camera = camera;

      const ambient = new THREE.AmbientLight(0x9BCBFF, 0.24);
      const directional = new THREE.DirectionalLight(0xDDF2FF, 1.2);
      directional.position.set(4.5, 7.5, 5.5);
      directional.castShadow = true;
      directional.shadow.mapSize.set(1024, 1024);
      directional.shadow.camera.left = -8;
      directional.shadow.camera.right = 8;
      directional.shadow.camera.top = 8;
      directional.shadow.camera.bottom = -8;
      directional.shadow.camera.near = 0.1;
      directional.shadow.camera.far = 30;
      directional.shadow.camera.updateProjectionMatrix();
      directional.shadow.bias = -0.00035;
      scene.add(ambient, directional);
      nextRuntime.ambient = ambient;
      nextRuntime.directional = directional;

      const planeGeometry = new THREE.PlaneGeometry(26, 26);
      const planeMaterial = new THREE.ShadowMaterial({
        color: 0x020810,
        opacity: mapped.shadowOpacity,
        transparent: true,
      });
      const plane = new THREE.Mesh(planeGeometry, planeMaterial);
      plane.position.y = -4.25;
      plane.rotation.x = -Math.PI / 2;
      plane.receiveShadow = true;
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
      renderPipeline(nextRuntime, nextRuntime.pipeline, 0);
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
          runtime.scene.remove(previous.shards.mesh);
          runtime.scene.add(candidate.shards.mesh);
          applySceneConfig(runtime, nextMapped, nextNormalized);
          try {
            renderPipeline(runtime, candidate, 0, nextMapped);
          } catch (error) {
            runtime.scene.remove(candidate.shards.mesh);
            runtime.scene.add(previous.shards.mesh);
            applySceneConfig(runtime, mapped, normalized);
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
