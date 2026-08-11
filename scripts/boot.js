export const BOOT_STEPS = Object.freeze([
  { id: 'projects', at: 400 },
  { id: 'writing', at: 950 },
  { id: 'about', at: 1500 },
  { id: 'contact', at: 2050 },
  { id: 'settings', at: 2600 },
  { id: 'bot', at: 3150 },
]);

const BOOT_EXIT_AT = 4400;
const BOOT_COMPLETE_AT = 5000;

function createElement(document, tagName, attributes = {}, text = '') {
  const element = document.createElement(tagName);
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
  element.textContent = text;
  return element;
}

function renderBoot(root, i18n) {
  const document = root.ownerDocument;
  const panel = createElement(document, 'div', { 'data-boot-panel': '' });
  const header = createElement(document, 'header', { 'data-boot-header': '' });
  header.append(
    createElement(document, 'p', { 'data-boot-kicker': '' }, i18n.t('boot.portfolioOs')),
    createElement(document, 'p', { 'data-boot-build': '' }, i18n.t('protocol.build')),
  );

  const title = createElement(document, 'h1', { 'data-boot-title': '' }, i18n.t('site.title'));
  const status = createElement(document, 'div', {
    'data-boot-status': '',
    'aria-label': i18n.t('boot.initializing'),
  });
  BOOT_STEPS.forEach(({ id }, index) => {
    const row = createElement(document, 'div', {
      'data-boot-step': id,
      'data-status': 'pending',
    });
    const message = createElement(document, 'span', { 'data-boot-message': '' });
    message.append(
      createElement(
        document,
        'span',
        {},
        id === 'bot' ? 'BOT' : i18n.t(`apps.${id}`).toLocaleUpperCase(i18n.locale),
      ),
      document.createTextNode(' '),
      createElement(document, 'span', { 'data-boot-result': '', 'aria-live': 'polite' }, '[··]'),
    );
    row.append(
      createElement(document, 'span', { 'aria-hidden': 'true' }, String(index + 1).padStart(2, '0')),
      message,
    );
    status.append(row);
  });

  const progress = createElement(document, 'div', {
    'data-boot-progress': '',
    role: 'progressbar',
    'aria-label': i18n.t('boot.initializing'),
    'aria-valuemin': '0',
    'aria-valuemax': String(BOOT_STEPS.length),
  });
  BOOT_STEPS.forEach(({ id }) => {
    progress.append(createElement(document, 'span', { 'data-boot-progress-step': id }));
  });

  const skipButton = createElement(
    document,
    'button',
    { type: 'button', 'data-boot-skip': '' },
    i18n.t('boot.skip'),
  );
  const dither = createElement(document, 'div', { 'data-boot-dither': '', 'aria-hidden': 'true' });
  for (let cell = 0; cell < 77; cell += 1) {
    dither.append(createElement(document, 'span'));
  }
  panel.append(header, title, status, progress, skipButton);
  root.replaceChildren(panel, dither);
}

export function createBootController({ root, i18n, preferences, persistPreferences, onComplete }) {
  let timers = [];
  let completed = false;

  const clearTimers = () => {
    timers.forEach(clearTimeout);
    timers = [];
  };
  const reset = () => {
    completed = false;
    root.dataset.phase = 'running';
    root.querySelectorAll('[data-boot-step]').forEach((step) => {
      step.dataset.status = 'pending';
      step.querySelector('[data-boot-result]').textContent = '[··]';
    });
    root.querySelectorAll('[data-boot-progress-step]').forEach((step) => {
      step.dataset.status = 'pending';
    });
    root.querySelector('[data-boot-progress]').setAttribute('aria-valuenow', '0');
  };
  const applyStep = (id, index) => {
    const step = root.querySelector(`[data-boot-step="${id}"]`);
    step.dataset.status = 'ok';
    step.querySelector('[data-boot-result]').textContent = '[OK]';
    root.querySelector(`[data-boot-progress-step="${id}"]`).dataset.status = 'ok';
    root.querySelector('[data-boot-progress]').setAttribute('aria-valuenow', String(index + 1));
  };
  const beginExit = () => {
    root.dataset.phase = 'exiting';
  };
  const finish = () => {
    if (completed) return;
    completed = true;
    clearTimers();
    preferences.bootComplete = true;
    persistPreferences(preferences);
    root.dataset.phase = 'complete';
    root.hidden = true;
    onComplete();
  };

  const renderAndBind = () => {
    renderBoot(root, i18n);
    root.querySelector('[data-boot-skip]').addEventListener('click', finish);
  };

  const controller = {
    start({ force = false } = {}) {
      clearTimers();
      if (preferences.bootComplete && !force) {
        root.hidden = true;
        return onComplete();
      }

      reset();
      root.hidden = false;
      const reduced = root.ownerDocument.defaultView
        .matchMedia('(prefers-reduced-motion: reduce)').matches;
      BOOT_STEPS.forEach(({ id, at }, index) => {
        const apply = () => applyStep(id, index);
        if (reduced) apply();
        else timers.push(setTimeout(apply, at));
      });
      if (!reduced) {
        timers.push(setTimeout(beginExit, BOOT_EXIT_AT));
        timers.push(setTimeout(finish, BOOT_COMPLETE_AT));
      }
    },
    skip: finish,
    replay() {
      preferences.bootComplete = false;
      renderAndBind();
      this.start({ force: true });
    },
  };

  renderAndBind();
  return controller;
}
