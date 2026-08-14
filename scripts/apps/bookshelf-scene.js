const THREE_URL = '../../vendor/three.module.min.js';
const MAX_DPR = 1.5;
const INK = 0x183b9b;
const PAPER = 0xffffff;
const STROKE = 0x111111;
const SHELF_X = -1.75;
const SHELF_Y = -0.35;
const SHELF_YAW = -0.12;
const SHELF_Z = -3.2;
const SHELF_SCALE = Object.freeze({ x: 0.72, y: 0.9, z: 0.9 });
const PIXEL_PALETTE = Object.freeze([
  Object.freeze([255, 255, 255]),
  Object.freeze([24, 59, 155]),
  Object.freeze([24, 59, 155]),
  Object.freeze([24, 59, 155]),
]);
const SHELF_LEVELS = Object.freeze([-2.2, -0.35, 1.5]);
const PIXEL_PATTERNS = Object.freeze([
  Object.freeze(['00110011', '01111110', '11011011', '11111111', '10100101', '11111111', '01111110', '00110011']),
  Object.freeze(['11001100', '11111110', '01100110', '11111111', '11011011', '01111110', '00111100', '00011000']),
  Object.freeze(['11111111', '10011001', '10111101', '11111111', '00111100', '01111110', '11011011', '11111111']),
]);

let threePromise = null;

const loadThree = () => {
  threePromise ??= import(THREE_URL);
  return threePromise;
};

function createPixelTexture(THREE, palette, pattern, repeatX = 1, repeatY = 1) {
  const size = pattern.length;
  const data = new Uint8Array(size * size * 4);
  pattern.forEach((row, y) => {
    [...row].forEach((value, x) => {
      const color = palette[Number(value)] ?? palette[0];
      const offset = (y * size + x) * 4;
      data[offset] = color[0];
      data[offset + 1] = color[1];
      data[offset + 2] = color[2];
      data[offset + 3] = 255;
    });
  });
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.needsUpdate = true;
  return texture;
}

function makeMaterial(THREE, texture, color, extra = {}) {
  return new THREE.MeshLambertMaterial({
    color,
    map: texture,
    flatShading: true,
    ...extra,
  });
}

function makeSolidMaterial(THREE, color, extra = {}) {
  return new THREE.MeshLambertMaterial({
    color,
    flatShading: true,
    ...extra,
  });
}

function addBox(
  THREE,
  parent,
  size,
  position,
  material,
  { castShadow = true, outlineMaterial = null } = {},
) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  if (outlineMaterial) {
    mesh.add(new THREE.LineSegments(
      new THREE.EdgesGeometry(mesh.geometry),
      outlineMaterial,
    ));
  }
  parent.add(mesh);
  return mesh;
}

function createShelf(THREE) {
  const group = new THREE.Group();
  const shelfMaterial = makeSolidMaterial(THREE, PAPER, {
    emissive: PAPER,
    emissiveIntensity: 0.52,
  });
  const inkMaterial = makeSolidMaterial(THREE, INK, {
    emissive: INK,
    emissiveIntensity: 0.08,
  });
  const backMaterial = makeSolidMaterial(THREE, PAPER, {
    emissive: PAPER,
    emissiveIntensity: 0.68,
  });
  const outlineMaterial = new THREE.LineBasicMaterial({
    color: STROKE,
    transparent: true,
    opacity: 0.72,
  });
  const width = 8.6;
  const depth = 1.32;
  const sidePanelMaterials = [
    inkMaterial,
    inkMaterial,
    shelfMaterial,
    shelfMaterial,
    shelfMaterial,
    shelfMaterial,
  ];
  const shelfPanelMaterials = [
    inkMaterial,
    inkMaterial,
    shelfMaterial,
    shelfMaterial,
    shelfMaterial,
    shelfMaterial,
  ];

  addBox(THREE, group, [width, 6.25, 0.18], [0, 0.42, -0.68], backMaterial, { outlineMaterial });
  addBox(THREE, group, [0.3, 6.45, depth], [-4.18, 0.42, 0], sidePanelMaterials, { outlineMaterial });
  addBox(THREE, group, [0.3, 6.45, depth], [4.18, 0.42, 0], sidePanelMaterials, { outlineMaterial });
  [...SHELF_LEVELS, 3.34].forEach((level) => {
    addBox(THREE, group, [width, 0.2, depth], [0, level, 0], shelfPanelMaterials, { outlineMaterial });
    addBox(
      THREE,
      group,
      [width, 0.1, 0.14],
      [0, level + 0.04, depth / 2 + 0.04],
      inkMaterial,
      { outlineMaterial },
    );
  });
  addBox(THREE, group, [9.2, 0.24, 1.58], [0, -2.94, 0.06], shelfPanelMaterials, { outlineMaterial });

  return group;
}

function createBook(THREE, item, index, x, shelfY, textures, accentTexture) {
  const width = 0.34 + (index % 4) * 0.055;
  const height = 1.18 + (index % 5) * 0.16;
  const depth = 0.58;
  const pattern = PIXEL_PATTERNS[index % PIXEL_PATTERNS.length];
  const coverTexture = createPixelTexture(
    THREE,
    PIXEL_PALETTE,
    pattern,
    1,
    2,
  );
  textures.add(coverTexture);

  const cover = makeMaterial(THREE, coverTexture, PAPER);
  const side = makeSolidMaterial(THREE, INK, { emissive: INK, emissiveIntensity: 0.08 });
  const pages = makeSolidMaterial(THREE, PAPER, { emissive: PAPER, emissiveIntensity: 0.48 });
  const back = makeSolidMaterial(THREE, INK, { emissive: INK, emissiveIntensity: 0.08 });
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    [side, side, cover, pages, cover, back],
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  const group = new THREE.Group();
  group.add(mesh);
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(mesh.geometry),
    new THREE.LineBasicMaterial({ color: STROKE, transparent: true, opacity: 0.84 }),
  );
  group.add(edges);

  const accent = new THREE.Mesh(
    new THREE.PlaneGeometry(width * 0.64, 0.045),
    new THREE.MeshBasicMaterial({ color: INK, map: accentTexture }),
  );
  accent.position.set(0, height * 0.19, depth / 2 + 0.008);
  group.add(accent);

  group.position.set(x, shelfY + height / 2 + 0.12, 0.02 + (index % 3) * 0.018);
  group.rotation.z = ((index % 5) - 2) * 0.045;
  group.rotation.y = ((index % 3) - 1) * 0.035;
  group.userData.bookSlug = item.slug;
  group.userData.baseY = group.position.y;
  group.userData.cover = cover;
  group.userData.edgeMaterial = edges.material;
  group.userData.hovered = false;
  group.userData.selected = false;
  mesh.userData.bookRoot = group;

  return group;
}

function createBooks(THREE, parent, items, textures, accentTexture) {
  const books = [];
  if (!items.length) return books;

  const columns = Math.ceil(items.length / SHELF_LEVELS.length);
  const slot = Math.min(0.72, 6.8 / Math.max(columns, 1));
  items.forEach((item, index) => {
    const shelfIndex = index % SHELF_LEVELS.length;
    const column = Math.floor(index / SHELF_LEVELS.length);
    const x = -((columns - 1) * slot) / 2 + column * slot;
    const book = createBook(
      THREE, item, index, x, SHELF_LEVELS[shelfIndex], textures, accentTexture,
    );
    parent.add(book);
    books.push(book);
  });
  return books;
}

function setBookState(book, selected, hovered) {
  book.userData.selected = selected;
  book.userData.hovered = hovered;
  book.userData.cover.color.set(selected ? INK : PAPER);
  book.userData.edgeMaterial.color.set(selected || hovered ? INK : STROKE);
  book.userData.edgeMaterial.opacity = selected || hovered ? 1 : 0.9;
}

function getBookFromPointer(THREE, canvas, camera, raycaster, pointer, books, event) {
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(books, true)[0];
  let object = hit?.object ?? null;
  while (object && !object.userData.bookSlug) object = object.parent;
  return object?.userData.bookSlug ? object : null;
}

/**
 * Mounts the actual Three.js bookshelf used by the Books folder. The DOM
 * folder browser stays responsible for the two-state route; this scene only
 * owns the shelf, pixel materials, hover state, and 3D hit testing.
 */
export function createBookshelfScene(canvas, {
  items = [],
  onSelect = () => {},
  onOpen = () => {},
  onHover = () => {},
  isSingleTap = () => false,
} = {}) {
  const view = canvas.ownerDocument.defaultView;
  const reducedMotion = view.matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = { x: 0, y: 0 };
  let disposed = false;
  let activeBook = null;
  let selectedSlug = null;
  let stop = () => {};
  let setSelected = (slug) => { selectedSlug = slug; };

  loadThree().then((THREE) => {
    if (disposed || !canvas.isConnected) return;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    } catch {
      canvas.dataset.bookshelfScene = 'failed';
      return;
    }

    renderer.setClearColor(0xffffff, 1);
    renderer.setPixelRatio(Math.min(view.devicePixelRatio || 1, MAX_DPR));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(33, 1, 0.1, 100);
    camera.position.set(0.86, 0.86, 8.8);
    camera.lookAt(0, 0.28, 0);
    scene.add(new THREE.AmbientLight(0xffffff, 0.82));
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.1);
    keyLight.position.set(-4.5, 7, 7);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.left = -6;
    keyLight.shadow.camera.right = 6;
    keyLight.shadow.camera.top = 5;
    keyLight.shadow.camera.bottom = -4;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 20;
    keyLight.shadow.bias = -0.0002;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.55);
    fillLight.position.set(5, 2, 4);
    scene.add(fillLight);

    const textures = new Set();
    const accentTexture = createPixelTexture(
      THREE,
      PIXEL_PALETTE,
      ['00000000', '00110000', '01111110', '00110000', '00000000', '00011000', '00111100', '00011000'],
    );
    textures.add(accentTexture);

    const shelfRoot = new THREE.Group();
    shelfRoot.position.set(SHELF_X, SHELF_Y, SHELF_Z);
    shelfRoot.scale.set(SHELF_SCALE.x, SHELF_SCALE.y, SHELF_SCALE.z);
    shelfRoot.rotation.y = SHELF_YAW;
    scene.add(shelfRoot);
    const shelf = createShelf(THREE);
    shelfRoot.add(shelf);
    const books = createBooks(THREE, shelfRoot, items, textures, accentTexture);
    const raycaster = new THREE.Raycaster();
    let frame = null;
    let observer = null;

    const getBook = (event) => getBookFromPointer(
      THREE, canvas, camera, raycaster, pointer, books, event,
    );
    const updateHover = (book) => {
      if (activeBook === book) return;
      if (activeBook) setBookState(activeBook, activeBook.userData.selected, false);
      activeBook = book;
      if (activeBook) setBookState(activeBook, activeBook.userData.selected, true);
      canvas.style.cursor = activeBook ? 'pointer' : 'default';
      onHover(activeBook?.userData.bookSlug ?? null);
    };

    setSelected = (slug) => {
      selectedSlug = slug;
      books.forEach((book) => setBookState(
        book,
        book.userData.bookSlug === slug,
        book === activeBook,
      ));
    };

      const onPointerMove = (event) => updateHover(getBook(event));
    const onPointerLeave = () => updateHover(null);
    const onClick = (event) => {
      const book = getBook(event);
      if (!book) return;
      if (isSingleTap()) onOpen(book.userData.bookSlug);
      else onSelect(book.userData.bookSlug);
    };
    const onDoubleClick = (event) => {
      const book = getBook(event);
      if (book) onOpen(book.userData.bookSlug);
    };
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerleave', onPointerLeave);
    canvas.addEventListener('click', onClick);
    canvas.addEventListener('dblclick', onDoubleClick);

    const resize = () => {
      const { clientWidth, clientHeight } = canvas;
      if (!clientWidth || !clientHeight) return;
      renderer.setSize(clientWidth, clientHeight, false);
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    };
    observer = new view.ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    canvas.dataset.bookshelfScene = 'ready';

    const dispose = () => {
      if (disposed) return;
      disposed = true;
      if (frame !== null) view.cancelAnimationFrame(frame);
      observer?.disconnect();
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      canvas.removeEventListener('click', onClick);
      canvas.removeEventListener('dblclick', onDoubleClick);
      onHover(null);
      const materials = new Set();
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        const list = Array.isArray(object.material) ? object.material : [object.material];
        list.filter(Boolean).forEach((material) => materials.add(material));
      });
      materials.forEach((material) => material.dispose());
      textures.forEach((texture) => texture.dispose());
      renderer.dispose();
    };
    stop = dispose;

    const tick = (time) => {
      if (disposed || !canvas.isConnected) {
        dispose();
        return;
      }
      frame = view.requestAnimationFrame(tick);
      if (canvas.offsetParent === null) return;
      const seconds = time * 0.00035;
      if (!reducedMotion.matches) {
        shelfRoot.rotation.y = SHELF_YAW + Math.sin(seconds) * 0.018;
        shelfRoot.position.y = SHELF_Y + Math.sin(seconds * 1.4) * 0.018;
      }
      books.forEach((book) => {
        const lift = book.userData.selected ? 0.11 : book.userData.hovered ? 0.07 : 0;
        book.position.y += (book.userData.baseY + lift - book.position.y) * 0.16;
      });
      renderer.render(scene, camera);
    };
    frame = view.requestAnimationFrame(tick);
    if (selectedSlug) setSelected(selectedSlug);
  }).catch(() => {
    canvas.dataset.bookshelfScene = 'failed';
  });

  return {
    setSelected(slug) {
      setSelected(slug);
    },
    dispose() {
      stop();
    },
  };
}
