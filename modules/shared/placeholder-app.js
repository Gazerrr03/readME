function createElement(document, tagName, attributes = {}, text = '') {
  const element = document.createElement(tagName);
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
  element.textContent = text;
  return element;
}

export function renderPlaceholderApp({ app, i18n, mount }) {
  const document = mount.ownerDocument;
  const root = createElement(document, 'section', { 'data-window-placeholder': '' });

  const render = () => {
    root.replaceChildren(
      createElement(document, 'p', { 'data-placeholder-code': '' }, `/${app.id.toUpperCase()}`),
      createElement(document, 'h3', {}, i18n.t(app.titleKey)),
      createElement(document, 'p', { 'data-placeholder-primary': '' }, i18n.t('windows.comingSoon')),
      createElement(document, 'p', { 'data-placeholder-status': '' }, `[··] ${i18n.t('windows.moduleNotMounted')}`),
    );
  };

  render();
  i18n.subscribe(render);
  return root;
}
