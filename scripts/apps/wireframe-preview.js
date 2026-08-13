const THREE_URL = '../../vendor/three.module.min.js';
const INK = 0x183b9b;
const STEP_MS = 220;
const STEP_ANGLE = Math.PI / 24;
const MAX_DPR = 1.5;

let threePromise = null;
const loadThree = () => {
  threePromise ??= import(THREE_URL);
  return threePromise;
};

function displacePlane(THREE, width, height, segments, heightAt) {
  const geometry = new THREE.PlaneGeometry(width, height, segments, segments);
  const position = geometry.attributes.position;
  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index);
    const y = position.getY(index);
    position.setZ(index, heightAt(x, y));
  }
  return geometry;
}

function buildModel(THREE, name) {
  switch (name) {
    case 'cube':
      return new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(1.5, 1.5, 1.5)),
        new THREE.LineBasicMaterial({ color: INK }),
      );
    case 'torus-knot':
      return new THREE.LineSegments(
        new THREE.WireframeGeometry(new THREE.TorusKnotGeometry(0.72, 0.2, 56, 8)),
        new THREE.LineBasicMaterial({ color: INK }),
      );
    case 'sphere':
      return new THREE.LineSegments(
        new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(1.05, 1)),
        new THREE.LineBasicMaterial({ color: INK }),
      );
    case 'wave': {
      const model = new THREE.LineSegments(
        new THREE.WireframeGeometry(displacePlane(
          THREE, 2.6, 1.8, 26, 8,
          (x) => Math.sin(x * 2.4) * 0.16,
        )),
        new THREE.LineBasicMaterial({ color: INK }),
      );
      model.rotation.x = -Math.PI / 2.6;
      return model;
    }
    case 'terrain':
    default: {
      const model = new THREE.LineSegments(
        new THREE.WireframeGeometry(displacePlane(
          THREE, 2.4, 2.4, 16, 16,
          (x, y) => Math.sin(x * 1.7) * Math.cos(y * 1.3) * 0.22,
        )),
        new THREE.LineBasicMaterial({ color: INK }),
      );
      model.rotation.x = -Math.PI / 2.8;
      return model;
    }
  }
}

/**
 * Mounts a stepped blue-on-white wireframe into `canvas`.
 * The loop disposes itself once the canvas leaves the document
 * (the window manager owns DOM teardown; there is no destroy hook).
 * Returns a dispose function for early teardown (e.g. selection change).
 * `options.isActive` gates rendering each step without killing the loop —
 * used by the ring carousel to skip back-facing cards.
 */
export function createWireframePreview(canvas, geometryName, { isActive } = {}) {
  let disposed = false;
  let disposeRenderer = null;
  let frame = null;
  let observer = null;
  const view = canvas.ownerDocument.defaultView;
  const reducedMotion = view.matchMedia('(prefers-reduced-motion: reduce)');

  loadThree().then((THREE) => {
    if (disposed || !canvas.isConnected) return;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
    } catch {
      canvas.dataset.previewFailed = 'true';
      return;
    }
    renderer.setClearColor(0xffffff, 1);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 0.35, 4.1);
    camera.lookAt(0, 0, 0);
    const model = buildModel(THREE, geometryName);
    scene.add(model);

    const resize = () => {
      const { clientWidth, clientHeight } = canvas;
      if (!clientWidth || !clientHeight) return;
      renderer.setPixelRatio(Math.min(view.devicePixelRatio || 1, MAX_DPR));
      renderer.setSize(clientWidth, clientHeight, false);
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    };
    observer = new view.ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    if (reducedMotion.matches) {
      model.rotation.y = STEP_ANGLE * 3;
      renderer.render(scene, camera);
    } else {
      let lastStep = -1;
      const tick = (time) => {
        if (disposed || !canvas.isConnected) return;
        frame = view.requestAnimationFrame(tick);
        if (canvas.offsetParent === null) return;
        if (isActive && !isActive()) { lastStep = -1; return; }
        const step = Math.floor(time / STEP_MS);
        if (step === lastStep) return;
        lastStep = step;
        model.rotation.y = step * STEP_ANGLE;
        renderer.render(scene, camera);
      };
      frame = view.requestAnimationFrame(tick);
    }

    disposeRenderer = () => {
      if (frame !== null) view.cancelAnimationFrame(frame);
      observer?.disconnect();
      model.geometry.dispose();
      model.material.dispose();
      renderer.dispose();
    };
  }).catch(() => {
    canvas.dataset.previewFailed = 'true';
  });

  return {
    dispose() {
      disposed = true;
      disposeRenderer?.();
    },
  };
}
