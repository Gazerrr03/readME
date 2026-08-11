import {
  ENVIRONMENT_CAPABILITY,
  formatEnvironmentClock,
  getEnvironmentCapability,
  getEnvironmentMotionState,
  nextEnvironmentView,
} from './environment-state.js';
import { createEnvironmentRenderer } from './environment-renderer.js';
import { OPEN_HORIZON_MAP } from './open-horizon-map.js';

function element(document, tagName, attributes = {}, text = '') {
  const node = document.createElement(tagName);
  Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
  node.textContent = text;
  return node;
}

export function createDesktopEnvironmentController({
  root,
  i18n,
  onOpen = () => {},
  now = () => new Date(),
  rendererFactory = createEnvironmentRenderer,
}) {
  const view = root.ownerDocument.defaultView;
  const document = root.ownerDocument;
  const coarseQuery = view.matchMedia('(pointer: coarse)');
  const motionQuery = view.matchMedia('(prefers-reduced-motion: reduce)');
  let mode = 'windows';
  let capability = ENVIRONMENT_CAPABILITY.OFF;
  let reading = 'time';
  let mount = null;
  let renderer = null;
  let minuteTimer = null;

  const getCapability = () => getEnvironmentCapability({
    mode,
    width: view.innerWidth,
    coarsePointer: coarseQuery.matches,
    reducedMotion: motionQuery.matches,
  });

  const renderReading = () => {
    if (!mount) return;
    const primary = mount.querySelector('[data-environment-primary]');
    if (!primary) return;
    primary.dataset.environmentView = reading;
    const title = primary.querySelector('[data-environment-reading-title]');
    const value = primary.querySelector('[data-environment-reading-value]');
    const detail = primary.querySelector('[data-environment-reading-detail]');
    const clock = formatEnvironmentClock(now(), i18n.locale);
    const presentations = {
      time: [i18n.t('environment.localTime'), clock.time, clock.date],
      weather: [i18n.t('environment.weather'), i18n.t('environment.conditionEmpty'), i18n.t('environment.locationEmpty')],
      'tide-wind': [i18n.t('environment.tideWind'), i18n.t('environment.windEmpty'), i18n.t('environment.tideEmpty')],
    };
    [title.textContent, value.textContent, detail.textContent] = presentations[reading];
    primary.setAttribute('aria-label', `${title.textContent}: ${value.textContent}, ${detail.textContent}`);
  };

  const createWidgets = () => {
    const widgets = element(document, 'aside', { 'data-environment-widgets': '' });
    const primary = element(document, 'button', {
      type: 'button', 'data-environment-primary': '', 'data-environment-view': reading,
    });
    primary.append(
      element(document, 'span', { 'data-environment-reading-title': '' }),
      element(document, 'strong', { 'data-environment-reading-value': '' }),
      element(document, 'span', { 'data-environment-reading-detail': '' }),
    );
    const nowButton = element(document, 'button', {
      type: 'button', 'data-environment-open': 'projects', 'aria-label': i18n.t('environment.openProjects'),
    });
    nowButton.append(element(document, 'span', {}, i18n.t('environment.now')), element(document, 'strong', {}, '--'));
    const latestButton = element(document, 'button', {
      type: 'button', 'data-environment-open': 'writing', 'aria-label': i18n.t('environment.openWriting'),
    });
    latestButton.append(element(document, 'span', {}, i18n.t('environment.latest')), element(document, 'strong', {}, '--'));
    widgets.append(primary, nowButton, latestButton);
    return widgets;
  };

  const getQuietZones = () => {
    const environmentBounds = mount?.getBoundingClientRect();
    const widgets = mount?.querySelector('[data-environment-widgets]')?.getBoundingClientRect();
    const dock = root.querySelector('[data-macos-dock]')?.getBoundingClientRect();
    if (!environmentBounds) return [];
    return [widgets, dock].filter(Boolean).map((rect) => ({
      left: rect.left - environmentBounds.left - 24,
      top: rect.top - environmentBounds.top - 24,
      right: rect.right - environmentBounds.left + 24,
      bottom: rect.bottom - environmentBounds.top + 24,
      feather: 72,
    }));
  };

  const syncRenderer = () => {
    if (!mount) return;
    const motion = getEnvironmentMotionState({
      capability,
      hasVisibleWindow: root.dataset.hasVisibleWindow === 'true',
      documentHidden: document.hidden,
    });
    mount.dataset.environmentCapability = capability;
    mount.dataset.environmentMotion = motion;
    if (!renderer) return;
    renderer.resize({
      width: mount.clientWidth,
      height: mount.clientHeight,
      dpr: view.devicePixelRatio,
      quietZones: getQuietZones(),
    });
    renderer.setMotionState(motion);
  };

  const unmount = () => {
    renderer?.destroy();
    renderer = null;
    mount?.remove();
    mount = null;
    if (minuteTimer !== null) view.clearInterval(minuteTimer);
    minuteTimer = null;
  };

  const mountEnvironment = () => {
    if (mount && root.contains(mount)) return;
    unmount();
    mount = element(document, 'section', { 'data-macos-environment': '' });
    const canvas = element(document, 'canvas', {
      'data-environment-canvas': '', 'aria-hidden': 'true',
    });
    mount.append(canvas);
    if (capability !== ENVIRONMENT_CAPABILITY.PHONE_STATIC) mount.append(createWidgets());
    root.prepend(mount);
    try {
      renderer = rendererFactory({ canvas, terrainMap: OPEN_HORIZON_MAP });
    } catch {
      renderer = null;
      mount.dataset.environmentFallback = 'canvas-unavailable';
    }
    renderReading();
    minuteTimer = view.setInterval(renderReading, 60_000);
    syncRenderer();
  };

  const sync = ({ mode: nextMode = mode } = {}) => {
    mode = nextMode;
    capability = getCapability();
    if (capability === ENVIRONMENT_CAPABILITY.OFF) {
      unmount();
      return;
    }
    mountEnvironment();
    if (capability === ENVIRONMENT_CAPABILITY.PHONE_STATIC) {
      mount.querySelector('[data-environment-widgets]')?.remove();
    } else if (!mount.querySelector('[data-environment-widgets]')) {
      mount.append(createWidgets());
      renderReading();
    }
    syncRenderer();
  };

  const handleClick = (event) => {
    if (!mount || !mount.contains(event.target)) return;
    const launch = event.target.closest('[data-environment-open]');
    if (launch) onOpen(launch.dataset.environmentOpen);
    if (event.target.closest('[data-environment-primary]')) {
      reading = nextEnvironmentView(reading);
      renderReading();
    }
  };
  const handlePointerMove = (event) => {
    if (
      capability !== ENVIRONMENT_CAPABILITY.ANIMATED
      || mount?.dataset.environmentMotion !== 'running'
      || !renderer
    ) return;
    const bounds = mount.getBoundingClientRect();
    renderer.setPointer({
      x: (event.clientX - bounds.left) / bounds.width,
      y: (event.clientY - bounds.top) / bounds.height,
    });
  };
  root.addEventListener('click', handleClick);
  root.addEventListener('pointermove', handlePointerMove);
  const observer = new MutationObserver(syncRenderer);
  observer.observe(root, { attributes: true, attributeFilter: ['data-has-visible-window'] });
  const unsubscribeI18n = i18n.subscribe(() => { renderReading(); sync(); });
  const handleEnvironmentChange = () => sync();
  view.addEventListener('resize', handleEnvironmentChange);
  document.addEventListener('visibilitychange', syncRenderer);
  coarseQuery.addEventListener('change', handleEnvironmentChange);
  motionQuery.addEventListener('change', handleEnvironmentChange);

  return {
    sync,
    destroy() {
      unmount();
      observer.disconnect();
      unsubscribeI18n();
      view.removeEventListener('resize', handleEnvironmentChange);
      document.removeEventListener('visibilitychange', syncRenderer);
      coarseQuery.removeEventListener('change', handleEnvironmentChange);
      motionQuery.removeEventListener('change', handleEnvironmentChange);
      root.removeEventListener('click', handleClick);
      root.removeEventListener('pointermove', handlePointerMove);
    },
  };
}
