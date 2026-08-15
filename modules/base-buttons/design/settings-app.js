function createElement(document, tagName, attributes = {}, text = '') {
  const element = document.createElement(tagName);
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
  element.textContent = text;
  return element;
}

const sections = ['system', 'display', 'mouse', 'network'];

function option(document, value, label) {
  return createElement(document, 'option', { value }, label);
}

function selectControl(document, label, name, value, options) {
  const field = createElement(document, 'label', { 'data-settings-field': '' });
  field.append(createElement(document, 'span', {}, label));
  const select = createElement(document, 'select', { name, 'aria-label': label });
  options.forEach(([optionValue, optionLabel]) => select.append(option(document, optionValue, optionLabel)));
  select.value = value;
  field.append(select);
  return field;
}

function toggleControl(document, label, name, checked = false, i18n) {
  const field = createElement(document, 'label', { 'data-settings-toggle': '' });
  const input = createElement(document, 'input', { type: 'checkbox', name, 'aria-label': label });
  input.checked = checked;
  const state = createElement(document, 'span', { 'data-settings-toggle-state': '' },
    i18n.t(checked ? 'settings.on' : 'settings.off'));
  input.addEventListener('change', () => {
    state.textContent = i18n.t(input.checked ? 'settings.on' : 'settings.off');
  });
  field.append(input, createElement(document, 'span', {}, label), state);
  return field;
}

function meter(document, label, name, value, { min = 0, max = 100, suffix = '' } = {}) {
  const field = createElement(document, 'label', { 'data-settings-meter': '' });
  field.append(
    createElement(document, 'span', {}, label),
    createElement(document, 'output', {}, `${value}${suffix}`),
  );
  const input = createElement(document, 'input', {
    type: 'range', name, min: String(min), max: String(max), value: String(value),
    'aria-label': label, 'data-output-suffix': suffix,
  });
  input.addEventListener('input', () => {
    field.querySelector('output').textContent = `${input.value}${suffix}`;
  });
  field.append(input);
  return field;
}

function settingsPanel(document, i18n, section, preferences) {
  const panel = createElement(document, 'section', { 'data-settings-panel': section });
  panel.append(createElement(document, 'h3', {}, i18n.t(`settings.${section}`)));

  if (section === 'display') {
    panel.append(
      createElement(document, 'p', { 'data-settings-panel-kicker': '' }, i18n.t('settings.visualOutput')),
      meter(document, i18n.t('settings.resolutionGridDensity'), 'gridDensity', preferences.gridDensity, {
        min: 16, max: 64, suffix: 'px',
      }),
      selectControl(document, i18n.t('settings.syncFrequency'), 'syncFrequency', preferences.syncFrequency, [
        ['60Hz', '60Hz'], ['75Hz', '75Hz'], ['120Hz', '120Hz'],
      ]),
      selectControl(
        document,
        i18n.t('settings.postProcessFilter'),
        'postProcessFilter',
        preferences.postProcessFilter,
        [
          ['none', i18n.t('settings.filterNone')],
          ['scanline', i18n.t('settings.filterScanline')],
          ['contrast', i18n.t('settings.filterContrast')],
        ],
      ),
      toggleControl(document, i18n.t('settings.ditherOverlay'), 'ditherOverlay', preferences.ditherOverlay, i18n),
      toggleControl(document, i18n.t('settings.moireInterference'), 'moireInterference', preferences.moireInterference, i18n),
      toggleControl(document, i18n.t('settings.aliasedEdges'), 'aliasedEdges', preferences.aliasedEdges, i18n),
    );
  } else if (section === 'mouse') {
    panel.append(
      createElement(document, 'p', { 'data-settings-panel-kicker': '' }, i18n.t('settings.tactileInput')),
      meter(document, i18n.t('settings.trackingSensitivity'), 'trackingSensitivity', preferences.trackingSensitivity, {
        min: 25, max: 100, suffix: '%',
      }),
      meter(document, i18n.t('settings.doubleClickThreshold'), 'doubleClickThreshold', preferences.doubleClickThreshold, {
        min: 200, max: 700, suffix: 'ms',
      }),
      toggleControl(document, i18n.t('settings.pointerAcceleration'), 'pointerAcceleration', preferences.pointerAcceleration, i18n),
      toggleControl(document, i18n.t('settings.linearDecay'), 'linearDecay', preferences.linearDecay, i18n),
      toggleControl(document, i18n.t('settings.snapToGrid'), 'snapToGrid', preferences.snapToGrid, i18n),
    );
  } else {
    panel.append(
      createElement(document, 'p', { 'data-settings-panel-kicker': '' }, i18n.t('settings.signalProtocol')),
      meter(document, i18n.t('settings.packetDitherRate'), 'packetDitherRate', preferences.packetDitherRate, {
        suffix: '%',
      }),
      selectControl(document, i18n.t('settings.protocolArchitecture'), 'protocolArchitecture', preferences.protocolArchitecture, [
        ['TCP/IP', 'TCP/IP'], ['UDP', 'UDP'], ['LOCAL', 'LOCAL'],
      ]),
      toggleControl(document, i18n.t('settings.encryptionLevel'), 'encryptionLevel', preferences.encryptionLevel, i18n),
    );
  }
  return panel;
}

export function renderSettingsApp({ i18n, preferences, updatePreferences, replayBoot, mount }) {
  const document = mount.ownerDocument;
  const root = createElement(document, 'section', { 'data-settings-app': '' });
  let activeSection = 'system';

  const render = () => {
    const navigation = createElement(document, 'nav', {
      'data-settings-nav': '', 'aria-label': i18n.t('apps.settings'),
    });
    sections.forEach((section) => {
      navigation.append(createElement(document, 'button', {
        type: 'button', 'data-settings-section': section,
        'aria-pressed': String(activeSection === section),
      }, i18n.t(`settings.${section}`)));
    });

    let panel;
    if (activeSection === 'system') {
      panel = createElement(document, 'section', { 'data-settings-panel': 'system' });
      panel.append(
        createElement(document, 'h3', {}, i18n.t('settings.system')),
        selectControl(document, i18n.t('settings.desktopLayout'), 'layout', preferences.layout, [
          ['auto', i18n.t('settings.auto')],
          ['windows', i18n.t('settings.windows')],
          ['macos', i18n.t('settings.macos')],
        ]),
        selectControl(document, i18n.t('settings.language'), 'locale', preferences.locale, [
          ['en', i18n.t('language.en')],
          ['zh-CN', i18n.t('language.zh')],
          ['ja', i18n.t('language.ja')],
        ]),
        toggleControl(document, i18n.t('settings.systemAudio'), 'audioEnabled', preferences.audioEnabled, i18n),
        createElement(document, 'button', { type: 'button', 'data-replay-boot': '' }, i18n.t('settings.replayBoot')),
      );
    } else {
      panel = settingsPanel(document, i18n, activeSection, preferences);
    }

    root.replaceChildren(navigation, panel);
  };

  root.addEventListener('click', (event) => {
    const section = event.target.closest('[data-settings-section]');
    if (section) {
      activeSection = section.dataset.settingsSection;
      render();
      return;
    }
    if (event.target.closest('[data-replay-boot]')) replayBoot();
  });
  root.addEventListener('change', (event) => {
    const { name } = event.target;
    if (!name) return;
    if (event.target.type === 'checkbox') updatePreferences({ [name]: event.target.checked });
    else if (event.target.type !== 'range') updatePreferences({ [name]: event.target.value });
  });
  root.addEventListener('input', (event) => {
    if (event.target.type !== 'range' || !event.target.name) return;
    updatePreferences({ [event.target.name]: Number(event.target.value) });
  });

  render();
  i18n.subscribe(render);
  return root;
}
