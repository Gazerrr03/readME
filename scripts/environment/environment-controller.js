import {
  ENVIRONMENT_CAPABILITY,
  formatEnvironmentClock,
  getEnvironmentCapability,
  getEnvironmentMotionState,
  nextEnvironmentView,
} from './environment-state.js';
import { DESKTOP_BACKGROUND } from './background/background-assets.js';
import { createDesktopBackground } from './background/background-controller.js';
import { createMusicDeck } from './music-deck.js';
import { tracks } from '../../media/catalog.js';
import { projects } from '../data/content.js';

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
  backgroundFactory = createDesktopBackground,
}) {
  const view = root.ownerDocument.defaultView;
  const document = root.ownerDocument;
  const coarseQuery = view.matchMedia('(pointer: coarse)');
  const motionQuery = view.matchMedia('(prefers-reduced-motion: reduce)');
  let mode = 'windows';
  let capability = ENVIRONMENT_CAPABILITY.OFF;
  let reading = 'time';
  let mount = null;
  let background = null;
  let deck = null;
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

  const refreshCompactLabels = () => {
    if (!mount) return;
    const nowButton = mount.querySelector('[data-environment-open="projects"]');
    if (nowButton) {
      nowButton.querySelector('span').textContent = i18n.t('environment.now');
      nowButton.setAttribute('aria-label', i18n.t('environment.openProjects'));
    }
    deck?.syncLocale();
  };

  const destroyDeck = () => {
    deck?.destroy();
    deck = null;
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
    const latestYear = String(Math.max(...projects.map((project) => project.year)));
    nowButton.append(element(document, 'span', {}, i18n.t('environment.now')), element(document, 'strong', {}, latestYear));
    destroyDeck();
    deck = createMusicDeck({
      document,
      i18n,
      tracks,
      shouldAnimate: () => mount?.dataset.environmentMotion === 'running',
    });
    widgets.append(primary, nowButton, deck.element);
    return widgets;
  };

  const syncBackground = () => {
    if (!mount) return;
    const motion = getEnvironmentMotionState({
      capability,
      hasVisibleWindow: root.dataset.hasVisibleWindow === 'true',
      documentHidden: document.hidden,
    });
    mount.dataset.environmentCapability = capability;
    mount.dataset.environmentMotion = motion;
    background?.setMotionState(motion);
  };

  const unmount = () => {
    background?.destroy();
    background = null;
    destroyDeck();
    mount?.remove();
    mount = null;
    if (minuteTimer !== null) view.clearInterval(minuteTimer);
    minuteTimer = null;
  };

  const mountEnvironment = () => {
    if (mount && root.contains(mount)) return;
    unmount();
    mount = element(document, 'section', { 'data-macos-environment': '' });
    try {
      const nextBackground = backgroundFactory({
        document,
        asset: DESKTOP_BACKGROUND,
      });
      if (!nextBackground?.element || typeof nextBackground.setMotionState !== 'function') {
        throw new Error('Invalid desktop background');
      }
      background = nextBackground;
      mount.append(background.element);
    } catch {
      background = null;
      mount.dataset.environmentFallback = 'background-unavailable';
    }
    if (capability !== ENVIRONMENT_CAPABILITY.PHONE_STATIC) mount.append(createWidgets());
    root.prepend(mount);
    renderReading();
    minuteTimer = view.setInterval(renderReading, 60_000);
    syncBackground();
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
      destroyDeck();
    } else if (!mount.querySelector('[data-environment-widgets]')) {
      mount.append(createWidgets());
      renderReading();
    }
    syncBackground();
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
  root.addEventListener('click', handleClick);
  const observer = new MutationObserver(syncBackground);
  observer.observe(root, { attributes: true, attributeFilter: ['data-has-visible-window'] });
  const unsubscribeI18n = i18n.subscribe(() => {
    renderReading();
    refreshCompactLabels();
    sync();
  });
  const handleEnvironmentChange = () => sync();
  view.addEventListener('resize', handleEnvironmentChange);
  document.addEventListener('visibilitychange', syncBackground);
  coarseQuery.addEventListener('change', handleEnvironmentChange);
  motionQuery.addEventListener('change', handleEnvironmentChange);

  return {
    sync,
    destroy() {
      unmount();
      observer.disconnect();
      unsubscribeI18n();
      view.removeEventListener('resize', handleEnvironmentChange);
      document.removeEventListener('visibilitychange', syncBackground);
      coarseQuery.removeEventListener('change', handleEnvironmentChange);
      motionQuery.removeEventListener('change', handleEnvironmentChange);
      root.removeEventListener('click', handleClick);
    },
  };
}
