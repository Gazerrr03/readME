import { pick } from '../data/content.js';

function createElement(document, tagName, attributes = {}, text = '') {
  const element = document.createElement(tagName);
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
  element.textContent = text;
  return element;
}

export function renderContactApp({ i18n, content, mount }) {
  const document = mount.ownerDocument;
  const root = createElement(document, 'section', { 'data-contact-app': '' });

  const render = () => {
    const { channels } = content();
    const directory = createElement(document, 'div', { 'data-contact-directory': '' });
    directory.append(createElement(document, 'p', { 'data-contact-kicker': '' },
      i18n.t('contact.directory')));

    const head = createElement(document, 'div', { 'data-contact-row': 'head' });
    head.append(
      createElement(document, 'span', {}, i18n.t('contact.channel')),
      createElement(document, 'span', {}, i18n.t('contact.address')),
      createElement(document, 'span', {}, i18n.t('contact.status')),
    );
    directory.append(head);

    channels.forEach((entry) => {
      const row = createElement(document, 'a', {
        'data-contact-row': entry.id,
        href: entry.href,
      });
      if (!entry.href.startsWith('mailto:') && !entry.href.startsWith('/')) {
        row.setAttribute('target', '_blank');
        row.setAttribute('rel', 'noreferrer');
      }
      row.append(
        createElement(document, 'span', { 'data-contact-channel': '' }, pick(entry.channelLabel, i18n.locale)),
        createElement(document, 'span', { 'data-contact-address': '' }, pick(entry.addressLabel, i18n.locale)),
        createElement(document, 'span', { 'data-contact-status': '' }, pick(entry.statusLabel, i18n.locale)),
      );
      directory.append(row);
    });

    const footer = createElement(document, 'p', { 'data-contact-footer': '' },
      `${i18n.t('contact.receiving')} [OK]`);
    root.replaceChildren(directory, footer);
  };

  render();
  i18n.subscribe(render);
  return root;
}
