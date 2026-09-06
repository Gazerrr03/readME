import * as THREE from '../../vendor/three.module.min.js';
import { SPIRITS, HOME, CAMP, BEACON } from './state.js';

const groundY = 0;
const hash = (x, z) => {
  const n = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return n - Math.floor(n);
};
const onIsland = (x, z) => (x * x / 121 + z * z / 144) < 1;
const pond = (x, z) => x > 4 && z > 5;
const path = (x, z) => Math.abs(x) < 1.4 || (z >= 3 && z <= 5 && Math.abs(x) < 9);

export function createIsland(canvas, journey, reducedMotion) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'low-power', preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.28;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#8dccd3');
  scene.fog = new THREE.Fog('#8dccd3', 32, 70);
  const camera = new THREE.OrthographicCamera(-12, 12, 9, -9, .1, 90);
  const sun = new THREE.DirectionalLight('#fff3d3', 3.2);
  sun.position.set(-9, 18, 7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -19, right: 19, top: 19, bottom: -19, near: 1, far: 60 });
  sun.shadow.normalBias = .05;
  scene.add(new THREE.HemisphereLight('#d3efff', '#608a42', 2.2), sun);

  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const materials = new Map();
  const batches = new Map();
  const obstacles = [];
  const material = color => {
    if (!materials.has(color)) materials.set(color, new THREE.MeshLambertMaterial({ color }));
    return materials.get(color);
  };
  const box = (x, y, z, w, h, d, color, parent = null) => {
    if (!parent) {
      if (!batches.has(color)) batches.set(color, []);
      batches.get(color).push([x, y, z, w, h, d]);
      return null;
    }
    const mesh = new THREE.Mesh(geometry, material(color));
    mesh.position.set(x, y, z);
    mesh.scale.set(w, h, d);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const block = (x, z, w, d) => obstacles.push(new THREE.Box3(
    new THREE.Vector3(x - w / 2, -1, z - d / 2), new THREE.Vector3(x + w / 2, 6, z + d / 2),
  ));
  const flower = (x, z, color) => {
    box(x, .16, z, .07, .34, .07, '#438557');
    box(x, .36, z, .24, .09, .24, color);
    box(x, .41, z, .09, .03, .09, '#fff4b9');
  };
  const tree = (x, z, size = 1) => {
    box(x, .65, z, .32, 1.3, .32, '#826653');
    box(x, 1.3, z, 1.5 * size, .6, 1.5 * size, '#33846a');
    box(x, 1.85, z, 1.2 * size, .6, 1.2 * size, '#56a66d');
    box(x - .1, 2.3, z, .8 * size, .4, .8 * size, '#8ac36b');
    block(x, z, .7, .7);
  };
  const grass = (x, z) => {
    for (let i = 0; i < 4; i++) {
      const dx = (hash(x + i, z) - .5) * .65;
      const dz = (hash(x, z + i) - .5) * .65;
      box(x + dx, .14, z + dz, .09, .28 + i * .025, .09, i % 2 ? '#75b95e' : '#408b54');
    }
  };

  box(0, -1.65, 0, 90, .3, 90, '#52b3bd');
  for (let x = -11; x <= 11; x++) {
    for (let z = -12; z <= 12; z++) {
      if (!onIsland(x, z)) continue;
      if (pond(x, z)) {
        box(x, -.52, z, 1, .17, 1, '#57c3cb');
        if (hash(x, z) > .6) box(x, -.42, z, .7, .02, .1, '#ade5da');
        continue;
      }
      const edge = !onIsland(x + 1, z) || !onIsland(x - 1, z) || !onIsland(x, z + 1) || !onIsland(x, z - 1);
      const top = edge ? '#d4cd91' : path(x, z) ? '#e2d6a2' : hash(x, z) > .48 ? '#8fbb6b' : '#85b365';
      box(x, -.21, z, 1, .42, 1, top);
      box(x, -.85, z, 1, .9, 1, edge ? '#af9970' : '#a29668');
      if (edge) box(x, -1.3, z, .88, .28, .88, '#8c8968');
      if (!edge && !path(x, z) && hash(x + 8, z) > .83) grass(x, z);
      if (!edge && !path(x, z) && hash(x - 4, z) > .94) flower(x + .2, z, ['#ffdf7d', '#ed8baa', '#eef8e3'][Math.abs(x + z) % 3]);
    }
  }
  // The clear central path and three side paths keep every encounter reachable.
  for (let x = -7; x <= 7; x++) {
    box(x, .015, -2, .93, .03, .8, '#cdd093');
    if (x >= 1) box(x, .015, -6, .93, .03, .8, '#cdd093');
  }
  [[-9, 2], [-8, -4], [-5, -5], [-3, -7], [-6, -8], [-7, 0], [-9, -1], [-3, 0], [8, -1], [9, 1], [3, -3], [8, -5], [5, -9], [3, -10], [-9, 5], [-6, 8], [-3, 10], [3, 9]].forEach(([x, z], i) => tree(x, z, .88 + (i % 3) * .1));

  // Field station: stepped coral roof, glazed windows and a garden.
  box(-5.7, .15, 5.5, 3.4, .3, 3.1, '#d4c7a7');
  box(-5.7, 1.05, 5.3, 2.8, 1.8, 2.4, '#f1eacb');
  box(-5.7, .72, 6.52, .65, 1.42, .08, '#46726b');
  box(-5.65, .8, 6.59, .09, .08, .05, '#ffdc7e');
  for (const x of [-6.55, -4.85]) {
    box(x, 1.15, 6.54, .55, .65, .08, '#688fa0');
    box(x, 1.15, 6.59, .06, .7, .05, '#fff5d7');
  }
  for (let i = 0; i < 5; i++) box(-5.7, 2.08 + i * .22, 5.3, 3.25 - i * .52, .23, 2.95, i % 2 ? '#d27773' : '#e68c78');
  box(-6.45, 2.55, 4.8, .4, 1.4, .4, '#efe6c7');
  block(-5.7, 5.3, 2.95, 2.5);
  box(CAMP.x, .45, CAMP.z, .35, .9, .35, '#487b60');
  box(CAMP.x, .95, CAMP.z, .85, .65, .2, '#f0e9c6');
  box(CAMP.x, .95, CAMP.z + .12, .4, .1, .04, '#dc7e71');
  box(CAMP.x, .95, CAMP.z + .12, .1, .4, .04, '#dc7e71');

  // Lighthouse and its approach.
  box(0, .1, -8.4, 3.4, .2, 3, '#d4d7bb');
  box(0, 1.65, -9, 1.25, 3.3, 1.25, '#f3eed5');
  box(0, 1.9, -9, 1.28, .55, 1.28, '#75aab1');
  box(0, 3.35, -9, 1.65, .25, 1.65, '#557c7c');
  box(0, 3.7, -9, 1.15, .55, 1.15, '#eacb74');
  box(0, 4.06, -9, 1.75, .18, 1.75, '#dd8a77');
  box(0, 4.25, -9, 1.2, .24, 1.2, '#cb726d');
  box(0, 4.43, -9, .65, .15, .65, '#b86367');
  block(0, -9, 1.65, 1.6);
  for (const x of [-1.15, 1.15]) box(x, .4, -8.3, .28, .8, .28, '#b7be9d');
  const beaconLight = new THREE.PointLight('#ffe49d', 0, 14);
  beaconLight.position.set(0, 4, -9);
  scene.add(beaconLight);

  // Small piers, reeds, sunstones and shoreline ripples.
  for (let i = 0; i < 7; i++) box(5.3, -.08, 5.5 + i * .32, 1.6, .12, .25, i % 2 ? '#b7a574' : '#c9b783');
  for (const x of [4.55, 6.05]) for (const z of [5.6, 7.4]) box(x, -.32, z, .14, 1.2, .14, '#877c60');
  for (const [x, z] of [[5, -7], [7, -7], [6.8, -5], [-4, -4]]) {
    box(x, .28, z, .8, .55, .65, '#b8bea1');
    box(x - .12, .58, z, .4, .22, .42, '#d9d3ae');
    block(x, z, .8, .65);
  }
  const ripples = new THREE.Group();
  for (let i = 0; i < 45; i++) {
    const x = (hash(i, 3) - .5) * 36;
    const z = (hash(i, 9) - .5) * 34;
    if (!onIsland(x, z)) box(x, -1.45, z, .35 + hash(i, 12), .03, .09, '#a1ddda', ripples);
  }
  scene.add(ripples);

  for (const [color, instances] of batches) {
    const mesh = new THREE.InstancedMesh(geometry, material(color), instances.length);
    const transform = new THREE.Object3D();
    instances.forEach(([x, y, z, w, h, d], i) => {
      transform.position.set(x, y, z);
      transform.scale.set(w, h, d);
      transform.updateMatrix();
      mesh.setMatrixAt(i, transform.matrix);
    });
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
  }
  batches.clear();

  function creature(color, accent, kind) {
    const group = new THREE.Group();
    box(0, .42, 0, .62, .5, .58, color, group);
    box(0, .77, .05, .72, .4, .64, color, group);
    box(0, .39, .3, .36, .3, .05, '#fff1ca', group);
    for (const x of [-.21, .21]) {
      box(x, .12, .05, .18, .16, .3, accent, group);
      box(x, .79, .38, .11, .14, .05, '#243d42', group);
      box(x - .018, .82, .411, .035, .035, .015, '#ffffff', group);
    }
    if (kind === 'fern') {
      box(-.18, 1.13, 0, .18, .43, .18, '#529456', group);
      box(.16, 1.06, 0, .27, .27, .18, '#87c263', group);
    } else if (kind === 'tide') {
      box(-.46, .55, -.08, .22, .35, .13, accent, group);
      box(.46, .55, -.08, .22, .35, .13, accent, group);
      box(0, 1.03, -.07, .15, .22, .35, accent, group);
    } else {
      box(-.25, 1.05, 0, .18, .3, .18, accent, group);
      box(.25, 1.05, 0, .18, .3, .18, accent, group);
      box(0, .4, -.48, .25, .26, .4, accent, group);
      box(0, .6, -.65, .15, .22, .16, '#ffdd83', group);
    }
    scene.add(group);
    return group;
  }
  const hero = new THREE.Group();
  const legs = [];
  for (const x of [-.14, .14]) {
    legs.push(box(x, .22, 0, .21, .4, .24, '#344f65', hero));
    box(x, .075, .07, .23, .15, .35, '#384645', hero);
  }
  box(0, .69, 0, .53, .55, .34, '#e77d69', hero);
  box(0, .65, -.24, .38, .43, .19, '#e8ba6d', hero);
  box(0, 1.15, .02, .47, .44, .44, '#f1c299', hero);
  box(0, 1.44, 0, .62, .15, .57, '#fcf0cc', hero);
  box(0, 1.55, -.03, .45, .15, .4, '#e5d594', hero);
  box(0, 1.34, -.14, .49, .14, .23, '#715350', hero);
  for (const x of [-.12, .12]) box(x, 1.15, .25, .075, .09, .035, '#34434b', hero);
  for (const x of [-.35, .35]) box(x, .65, 0, .17, .4, .21, '#f1c299', hero);
  scene.add(hero);
  hero.position.set(journey.x, groundY, journey.z);
  const companion = creature('#f4cd6c', '#df9b57', 'ember');
  companion.scale.setScalar(.58);
  companion.position.set(journey.x + .75, 0, journey.z + .75);
  const spirits = SPIRITS.map(spec => {
    const mesh = creature(spec.color, spec.accent, spec.id);
    mesh.position.set(spec.x, 0, spec.z);
    return { ...spec, mesh };
  });
  const interactionMarker = new THREE.Group();
  box(0, 0, 0, .12, .25, .12, '#fff3c2', interactionMarker);
  box(0, -.25, 0, .12, .07, .12, '#fff3c2', interactionMarker);
  scene.add(interactionMarker);

  const playerBounds = new THREE.Box3();
  const center = new THREE.Vector3();
  const size = new THREE.Vector3(.48, 1.8, .48);
  const walkable = (x, z) => {
    if (!onIsland(x, z) || pond(x, z) || !onIsland(x + .35, z + .35) || !onIsland(x - .35, z - .35)) return false;
    center.set(x, .8, z);
    playerBounds.setFromCenterAndSize(center, size);
    return !obstacles.some(obstacle => obstacle.intersectsBox(playerBounds));
  };
  if (!walkable(journey.x, journey.z)) Object.assign(journey, HOME);
  let aspect = 1;
  let encounter = null;
  const aim = new THREE.Vector3(journey.x, 0, journey.z - 2);
  const desired = new THREE.Vector3();
  let frame = 0;

  function resize() {
    const { width, height } = canvas.getBoundingClientRect();
    aspect = width / Math.max(1, height);
    const scale = Math.min(1, 720 / Math.max(width, height));
    renderer.setSize(Math.max(1, Math.floor(width * scale)), Math.max(1, Math.floor(height * scale)), false);
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  resize();

  return {
    move(dx, dz) {
      const x = journey.x + dx;
      const z = journey.z + dz;
      if (walkable(x, journey.z)) journey.x = x;
      if (walkable(journey.x, z)) journey.z = z;
      if (dx || dz) hero.rotation.y = Math.atan2(dx, dz);
    },
    nearest() {
      const candidates = [
        ...SPIRITS.filter(s => !journey.friends.includes(s.id)),
        { ...CAMP, id: 'camp' }, { ...BEACON, id: 'beacon' },
      ].map(s => ({ ...s, distance: Math.hypot(s.x - journey.x, s.z - journey.z) }));
      candidates.sort((a, b) => a.distance - b.distance);
      return candidates[0]?.distance < 2 ? candidates[0] : null;
    },
    setEncounter(next) { encounter = next; },
    render(time, dt, moving = false) {
      hero.position.set(journey.x, moving && !reducedMotion ? Math.abs(Math.sin(time * 12)) * .06 : 0, journey.z);
      legs.forEach((leg, i) => { leg.rotation.x = moving && !reducedMotion ? Math.sin(time * 12 + i * Math.PI) * .4 : 0; });
      const ease = 1 - Math.exp(-dt * 8);
      const buddyX = journey.x + (encounter ? -.8 : .75);
      companion.position.x = THREE.MathUtils.lerp(companion.position.x, buddyX, ease);
      companion.position.z = THREE.MathUtils.lerp(companion.position.z, journey.z + .85, ease);
      companion.position.y = reducedMotion ? 0 : Math.abs(Math.sin(time * 4)) * .12;
      spirits.forEach((s, i) => {
        s.mesh.visible = !journey.friends.includes(s.id);
        s.mesh.position.y = reducedMotion ? 0 : Math.sin(time * 2.6 + i) * .06 + .06;
        s.mesh.rotation.y = encounter?.id === s.id ? Math.atan2(journey.x - s.x, journey.z - s.z) : Math.sin(time * .4 + i) * .2;
      });
      const near = this.nearest();
      interactionMarker.visible = !!near && !encounter;
      if (near) interactionMarker.position.set(near.x, 2 + (reducedMotion ? 0 : Math.sin(time * 3) * .08), near.z);
      ripples.position.x = reducedMotion ? 0 : Math.sin(time * .35) * .15;
      beaconLight.intensity = journey.complete ? 10 : 0;
      if (encounter) {
        const spec = SPIRITS.find(s => s.id === encounter.id);
        desired.set((journey.x + spec.x) / 2, .25, (journey.z + spec.z) / 2 + 1.5);
      } else desired.set(journey.x * .7, 0, journey.z - 2.3);
      aim.lerp(desired, reducedMotion ? 1 : ease);
      const halfHeight = encounter ? (aspect < .8 ? 6 : 4.8) : (aspect < .8 ? 11 : 8.7);
      camera.left = -halfHeight * aspect;
      camera.right = halfHeight * aspect;
      camera.top = halfHeight;
      camera.bottom = -halfHeight;
      camera.updateProjectionMatrix();
      camera.position.copy(aim).add(new THREE.Vector3(0, 17, 14));
      camera.lookAt(aim);
      renderer.render(scene, camera);
      canvas.dataset.frame = String(++frame);
      canvas.dataset.position = `${journey.x.toFixed(2)},${journey.z.toFixed(2)}`;
    },
    dispose() {
      resizeObserver.disconnect();
      geometry.dispose();
      materials.forEach(m => m.dispose());
      scene.traverse(object => { if (object.isInstancedMesh) object.dispose(); });
      sun.shadow.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
