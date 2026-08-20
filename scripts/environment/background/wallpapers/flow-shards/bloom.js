import {
  BLOOM_BLUR_FRAGMENT_SHADER,
  BLOOM_COMPOSITE_FRAGMENT_SHADER,
  BLOOM_COPY_FRAGMENT_SHADER,
  BLOOM_THRESHOLD_FRAGMENT_SHADER,
  FULLSCREEN_VERTEX_SHADER,
} from './shaders.js';

const REFERENCE_BLOOM_GAIN = 1.8;
const BLUR_RADIUS_SCALES = Object.freeze([1, 5 / 3, 7 / 3, 3, 11 / 3]);

function createTarget(THREE, width, height, { depthBuffer = false } = {}) {
  const target = new THREE.WebGLRenderTarget(width, height, {
    depthBuffer,
    format: THREE.RGBAFormat,
    generateMipmaps: false,
    magFilter: THREE.LinearFilter,
    minFilter: THREE.LinearFilter,
    stencilBuffer: false,
    type: THREE.HalfFloatType,
  });
  target.texture.name = depthBuffer ? 'Flow Shards scene' : 'Flow Shards bloom';
  return target;
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

function createPostMaterial(THREE, fragmentShader, uniforms) {
  return new THREE.ShaderMaterial({
    depthTest: false,
    depthWrite: false,
    fragmentShader,
    toneMapped: false,
    uniforms,
    vertexShader: FULLSCREEN_VERTEX_SHADER,
  });
}

export function createBloomPipeline({ THREE, renderer, width, height }) {
  const sceneTarget = createTarget(THREE, 1, 1, { depthBuffer: true });
  const levels = Array.from({ length: 5 }, () => ({
    horizontal: createTarget(THREE, 1, 1),
    vertical: createTarget(THREE, 1, 1),
  }));
  const thresholdMaterial = createPostMaterial(THREE, BLOOM_THRESHOLD_FRAGMENT_SHADER, {
    uTexture: { value: sceneTarget.texture },
    uThreshold: { value: 1 },
  });
  const copyMaterial = createPostMaterial(THREE, BLOOM_COPY_FRAGMENT_SHADER, {
    uTexture: { value: sceneTarget.texture },
  });
  const blurMaterial = createPostMaterial(THREE, BLOOM_BLUR_FRAGMENT_SHADER, {
    uTexture: { value: sceneTarget.texture },
    uTexelSize: { value: new THREE.Vector2(1, 1) },
    uDirection: { value: new THREE.Vector2(1, 0) },
  });
  const compositeMaterial = createPostMaterial(THREE, BLOOM_COMPOSITE_FRAGMENT_SHADER, {
    uScene: { value: sceneTarget.texture },
    uBloom0: { value: levels[0].vertical.texture },
    uBloom1: { value: levels[1].vertical.texture },
    uBloom2: { value: levels[2].vertical.texture },
    uBloom3: { value: levels[3].vertical.texture },
    uBloom4: { value: levels[4].vertical.texture },
    uStrength: { value: 0 },
    uDevicePixelRatio: { value: 1 },
  });
  const fullscreenGeometry = createFullscreenTriangle(THREE);
  const fullscreenScene = new THREE.Scene();
  const fullscreenCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const fullscreenMesh = new THREE.Mesh(fullscreenGeometry, thresholdMaterial);
  fullscreenMesh.frustumCulled = false;
  fullscreenScene.add(fullscreenMesh);

  let targetWidth = 0;
  let targetHeight = 0;
  let disposed = false;

  const renderPass = (material, target) => {
    fullscreenMesh.material = material;
    renderer.setRenderTarget(target);
    renderer.render(fullscreenScene, fullscreenCamera);
  };

  const resize = (nextWidth, nextHeight) => {
    const safeWidth = Math.max(1, Math.floor(nextWidth));
    const safeHeight = Math.max(1, Math.floor(nextHeight));
    if (safeWidth === targetWidth && safeHeight === targetHeight) return;
    targetWidth = safeWidth;
    targetHeight = safeHeight;
    sceneTarget.setSize(targetWidth, targetHeight);
    levels.forEach((level, index) => {
      const divisor = 2 ** (index + 1);
      const levelWidth = Math.max(1, Math.floor(targetWidth / divisor));
      const levelHeight = Math.max(1, Math.floor(targetHeight / divisor));
      level.horizontal.setSize(levelWidth, levelHeight);
      level.vertical.setSize(levelWidth, levelHeight);
    });
  };

  resize(width, height);

  return {
    render(scene, camera, { strength, threshold }) {
      if (disposed) throw new Error('Flow Shards bloom pipeline has been disposed');
      renderer.setRenderTarget(sceneTarget);
      renderer.render(scene, camera);

      if (strength > 0) {
        thresholdMaterial.uniforms.uTexture.value = sceneTarget.texture;
        thresholdMaterial.uniforms.uThreshold.value = threshold;
        renderPass(thresholdMaterial, levels[0].vertical);

        for (let index = 0; index < levels.length; index += 1) {
          const level = levels[index];
          const radiusScale = BLUR_RADIUS_SCALES[index];
          if (index > 0) {
            copyMaterial.uniforms.uTexture.value = levels[index - 1].vertical.texture;
            renderPass(copyMaterial, level.vertical);
          }
          blurMaterial.uniforms.uTexture.value = level.vertical.texture;
          blurMaterial.uniforms.uTexelSize.value.set(
            1 / level.vertical.width,
            1 / level.vertical.height,
          );
          blurMaterial.uniforms.uDirection.value.set(radiusScale, 0);
          renderPass(blurMaterial, level.horizontal);

          blurMaterial.uniforms.uTexture.value = level.horizontal.texture;
          blurMaterial.uniforms.uTexelSize.value.set(
            1 / level.horizontal.width,
            1 / level.horizontal.height,
          );
          blurMaterial.uniforms.uDirection.value.set(0, radiusScale);
          renderPass(blurMaterial, level.vertical);
        }
      }

      compositeMaterial.uniforms.uStrength.value = strength * REFERENCE_BLOOM_GAIN;
      compositeMaterial.uniforms.uDevicePixelRatio.value = renderer.getPixelRatio();
      renderPass(compositeMaterial, null);
    },
    resize,
    dispose() {
      if (disposed) return;
      disposed = true;
      fullscreenScene.remove(fullscreenMesh);
      sceneTarget.dispose();
      levels.forEach((level) => {
        level.horizontal.dispose();
        level.vertical.dispose();
      });
      fullscreenGeometry.dispose();
      thresholdMaterial.dispose();
      copyMaterial.dispose();
      blurMaterial.dispose();
      compositeMaterial.dispose();
    },
  };
}
