import { pick, projects } from '../data/content.js';
import { contentPath } from '../routing/content-routes.js';
import { createWireframePreview } from './wireframe-preview.js';

const SLOT_COUNT = projects.length * 2; // ring shows each project twice so the loop closes seamlessly
const STEP_DEG = 360 / SLOT_COUNT;
const DRAG_DEG_PER_PX = 0.25;
const FLING_FRAMES = 12;
const AUTO_ADVANCE_MS = 4200;
const ACTIVE_COS = 0.35; // only near-front cards animate their wireframes
const EASE = 0.14;

function createElement(document, tagName, attributes = {}, text = '') {
  const element = document.createElement(tagName);
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
  element.textContent = text;
  return element;
}

const mod = (value, base) => ((value % base) + base) % base;
const snap = (degrees) => Math.round(degrees / STEP_DEG) * STEP_DEG;
const shortestDelta = (degrees) => mod(degrees + 180, 360) - 180;
const pad = (value) => String(value).padStart(2, '0');

export function renderProjectsApp({ i18n, mount }) {
  const document = mount.ownerDocument;
  const view = document.defaultView;
  const reducedMotion = view.matchMedia('(prefers-reduced-motion: reduce)');
  const root = createElement(document, 'section', { 'data-projects-app': '' });

  let current = 0; // ring rotation, degrees; card i sits at current + i * STEP_DEG
  let target = 0;
  let dragging = false;
  let hovering = false;
  let suppressClick = false;
  let previews = [];
  let rafId = null;
  let cards = [];
  let radius = 460;

  // u: front position in slot units (fractional while easing)
  const slotUnits = () => -current / STEP_DEG;
  const frontSlot = () => mod(Math.round(slotUnits()), SLOT_COUNT);
  const frontIndex = () => mod(frontSlot(), projects.length);
  // wrapped slot offset in [-N/2, N/2): 0 = front, ±1 = immediate neighbours
  const slotOffset = (slot) => mod(slot - slotUnits() + SLOT_COUNT / 2, SLOT_COUNT) - SLOT_COUNT / 2;
  const angleFor = (slot) => slotOffset(slot) * STEP_DEG;

  const disposePreviews = () => {
    previews.forEach((preview) => preview.dispose());
    previews = [];
  };

  const toolbar = (locale) => {
    const bar = createElement(document, 'header', { 'data-projects-toolbar': '' });
    const crumb = createElement(document, 'span', { 'data-projects-crumb': '' },
      `${i18n.t('apps.projects')} /`);
    const count = createElement(document, 'span', { 'data-projects-count': '' },
      i18n.t('projects.count').replace('{n}', pad(projects.length)));
    bar.append(crumb, count);
    return bar;
  };

  const statusbar = () => {
    const bar = createElement(document, 'footer', { 'data-projects-statusbar': '' });
    const left = createElement(document, 'span', { 'data-projects-position': '' },
      `${pad(frontIndex() + 1)} / ${pad(projects.length)}`);
    const right = createElement(document, 'span', { 'data-projects-hint': '' }, i18n.t('projects.hint'));
    bar.append(left, right);
    return bar;
  };

  const layoutRing = () => {
    const position = root.querySelector('[data-projects-position]');
    const front = frontSlot();
    cards.forEach(({ card }, slot) => {
      const theta = angleFor(slot);
      const rad = (theta * Math.PI) / 180;
      const cos = Math.cos(rad);
      const x = radius * Math.sin(rad);
      const z = radius * (cos - 1);
      card.style.transform = `translate(-50%, -50%) translate3d(${x.toFixed(1)}px, 0, ${z.toFixed(1)}px) rotateY(${theta.toFixed(2)}deg)`;
      card.style.zIndex = String(100 + Math.round(50 * cos));
      card.style.opacity = (0.45 + 0.55 * Math.max(0, cos)).toFixed(3);
      const isFront = slot === front;
      if (isFront && card.getAttribute('aria-current') !== 'true') card.setAttribute('aria-current', 'true');
      if (!isFront && card.getAttribute('aria-current') === 'true') card.removeAttribute('aria-current');
    });
    if (position) position.textContent = `${pad(frontIndex() + 1)} / ${pad(projects.length)}`;
  };

  const ringView = (locale) => {
    const viewport = createElement(document, 'div', {
      'data-projects-ring': '',
      tabindex: '0',
      'aria-label': i18n.t('apps.projects'),
    });
    const strip = createElement(document, 'div', { 'data-projects-strip': '' });
    viewport.append(strip);

    cards = [];
    for (let slot = 0; slot < SLOT_COUNT; slot += 1) {
      const project = projects[slot % projects.length];
      const card = createElement(document, 'a', {
        href: contentPath('projects', project.slug),
        'data-projects-card': '',
        'data-slot': String(slot),
        'data-slug': project.slug,
        role: 'option',
      });
      const frame = createElement(document, 'span', { 'data-projects-card-frame': '' });
      const canvas = createElement(document, 'canvas', {
        'data-projects-card-canvas': project.geometry,
        role: 'img',
        'aria-label': i18n.t('projects.modelPreview'),
      });
      frame.append(canvas);
      card.append(
        frame,
        createElement(document, 'span', { 'data-projects-card-label': '' }, pick(project.title, locale)),
        createElement(document, 'span', { 'data-projects-card-meta': '' }, `${project.year} · ${project.kind}`),
      );
      strip.append(card);
      cards.push({ card, canvas, slot, project });
    }

    viewport.addEventListener('pointerenter', () => { hovering = true; });
    viewport.addEventListener('pointerleave', () => { hovering = false; });
    viewport.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      dragging = true;
      suppressClick = false;
      let lastX = event.clientX;
      let lastVelocity = 0;
      let totalDx = 0;
      const onMove = (move) => {
        const dx = move.clientX - lastX;
        lastX = move.clientX;
        totalDx += dx;
        lastVelocity = dx * DRAG_DEG_PER_PX;
        current += dx * DRAG_DEG_PER_PX;
        target = current;
        if (Math.abs(totalDx) > 5) suppressClick = true;
      };
      const onUp = () => {
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
        document.removeEventListener('pointercancel', onUp);
        dragging = false;
        target = snap(current + lastVelocity * FLING_FRAMES);
        // a click fired by this drag lands before the timeout; a stray flag must not eat the next real click
        if (suppressClick) view.setTimeout(() => { suppressClick = false; }, 0);
      };
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
      document.addEventListener('pointercancel', onUp);
    });
    viewport.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        target = snap(target) + (event.key === 'ArrowLeft' ? STEP_DEG : -STEP_DEG);
      }
    });

    return viewport;
  };

  const render = () => {
    disposePreviews();
    const locale = i18n.locale;

    const fragment = document.createDocumentFragment();
    fragment.append(toolbar(locale));
    fragment.append(ringView(locale), statusbar());
    root.replaceChildren(fragment);
    radius = Math.max(220, ((cards[0]?.card.offsetWidth || 190) * 1.05) / (2 * Math.sin((STEP_DEG / 2) * (Math.PI / 180))));
    cards.forEach(({ canvas, slot, project: cardProject }) => {
      previews.push(createWireframePreview(canvas, cardProject.geometry, {
        isActive: () => Math.cos((angleFor(slot) * Math.PI) / 180) > ACTIVE_COS,
      }));
    });
    layoutRing();

    if (rafId === null) {
      const tick = () => {
        if (!root.isConnected) { rafId = null; return; }
        rafId = view.requestAnimationFrame(tick);
        if (!dragging) {
          const delta = target - current;
          current = reducedMotion.matches || Math.abs(delta) < 0.01 ? target : current + delta * EASE;
        }
        layoutRing();
      };
      rafId = view.requestAnimationFrame(tick);
    }
  };

  root.addEventListener('click', (event) => {
    const card = event.target.closest('[data-projects-card]');
    if (!card) return;
    if (suppressClick) {
      event.preventDefault();
      suppressClick = false;
      return;
    }
    const slot = cards.find((candidate) => candidate.card === card)?.slot;
    if (slot === undefined) return;
    if (slot === frontSlot()) return;
    event.preventDefault();
    target = current + shortestDelta(-slot * STEP_DEG - current);
  });

  const autoAdvance = view.setInterval(() => {
    if (!root.isConnected) { view.clearInterval(autoAdvance); return; }
    if (dragging || hovering || reducedMotion.matches) return;
    if (document.hasFocus && !document.hasFocus()) return;
    target = snap(target) - STEP_DEG;
  }, AUTO_ADVANCE_MS);

  render();
  i18n.subscribe(render);
  return root;
}
