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

function toggleControl(document, label, name, checked = false) {
  const field = createElement(document, 'label', { 'data-settings-toggle': '' });
  const input = createElement(document, 'input', { type: 'checkbox', name, 'aria-label': label });
  input.checked = checked;
  field.append(input, createElement(document, 'span', {}, label));
  return field;
}

function meter(document, label, value, suffix = '') {
  const field = createElement(document, 'label', { 'data-settings-meter': '' });
  field.append(
    createElement(document, 'span', {}, label),
    createElement(document, 'output', {}, `${value}${suffix}`),
  );
  const input = createElement(document, 'input', {
    type: 'range', min: '0', max: '100', value: String(value), 'aria-label': label,
  });
  input.addEventListener('input', () => {
    field.querySelector('output').textContent = `${input.value}${suffix}`;
  });
  field.append(input);
  return field;
}

function demoPanel(document, i18n, section) {
  const panel = createElement(document, 'section', { 'data-settings-panel': section });
  panel.append(createElement(document, 'h3', {}, i18n.t(`settings.${section}`)));

  if (section === 'display') {
    panel.append(
      createElement(document, 'p', { 'data-settings-panel-kicker': '' }, i18n.t('settings.visualOutput')),
      meter(document, i18n.t('settings.resolutionGridDensity'), 72),
      selectControl(document, i18n.t('settings.syncFrequency'), 'syncFrequency', '60Hz', [
        ['60Hz', '60Hz'], ['75Hz', '75Hz'], ['120Hz', '120Hz'],
      ]),
      toggleControl(document, i18n.t('settings.ditherOverlay'), 'ditherOverlay', true),
      toggleControl(document, i18n.t('settings.moireInterference'), 'moireInterference'),
      toggleControl(document, i18n.t('settings.aliasedEdges'), 'aliasedEdges', true),
    );
  } else if (section === 'mouse') {
    panel.append(
      createElement(document, 'p', { 'data-settings-panel-kicker': '' }, i18n.t('settings.tactileInput')),
      meter(document, i18n.t('settings.trackingSensitivity'), 45),
      meter(document, i18n.t('settings.doubleClickThreshold'), 62),
      toggleControl(document, i18n.t('settings.pointerAcceleration'), 'pointerAcceleration', true),
      toggleControl(document, i18n.t('settings.linearDecay'), 'linearDecay'),
      toggleControl(document, i18n.t('settings.snapToGrid'), 'snapToGrid', true),
    );
  } else {
    panel.append(
      createElement(document, 'p', { 'data-settings-panel-kicker': '' }, i18n.t('settings.signalProtocol')),
      meter(document, i18n.t('settings.packetDitherRate'), 90),
      selectControl(document, i18n.t('settings.protocolArchitecture'), 'protocolArchitecture', 'TCP/IP', [
        ['TCP/IP', 'TCP/IP'], ['UDP', 'UDP'], ['LOCAL', 'LOCAL'],
      ]),
      toggleControl(document, i18n.t('settings.encryptionLevel'), 'encryptionLevel', true),
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
        toggleControl(document, i18n.t('settings.systemAudio'), 'audioEnabled', preferences.audioEnabled),
        createElement(document, 'button', { type: 'button', 'data-replay-boot': '' }, i18n.t('settings.replayBoot')),
      );
    } else {
      panel = demoPanel(document, i18n, activeSection);
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
    if (event.target.name === 'layout') updatePreferences({ layout: event.target.value });
    else if (event.target.name === 'locale') updatePreferences({ locale: event.target.value });
    else if (event.target.name === 'audioEnabled') updatePreferences({ audioEnabled: event.target.checked });
  });

  render();
  i18n.subscribe(render);
  return root;
}
