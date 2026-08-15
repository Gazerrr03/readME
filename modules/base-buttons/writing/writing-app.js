import { articles } from './data.js';
import { pick } from '../../../scripts/data/content.js';
import { contentPath } from '../../../scripts/routing/content-routes.js';

function createElement(document, tagName, attributes = {}, text = '') {
  const element = document.createElement(tagName);
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
  element.textContent = text;
  return element;
}

const padIndex = (value) => String(value).padStart(2, '0');

export function renderWritingApp({ i18n, mount }) {
  const document = mount.ownerDocument;
  const root = createElement(document, 'section', { 'data-writing-app': '' });

  const render = () => {
    const header = createElement(document, 'header', { 'data-writing-header': '' });
    header.append(
      createElement(document, 'p', { 'data-writing-kicker': '' }, i18n.t('writing.archive')),
      createElement(document, 'p', { 'data-writing-count': '' },
        i18n.t('writing.entries').replace('{n}', String(articles.length))),
    );

    const list = createElement(document, 'ul', { 'data-writing-list': '' });
    articles.forEach((entry, index) => {
      const row = createElement(document, 'li');
      const link = createElement(document, 'a', {
        href: contentPath('writing', entry.slug),
        'data-writing-open': entry.slug,
      });
      link.append(
        createElement(document, 'span', { 'data-writing-index': '' }, `${padIndex(index + 1)}.`),
        createElement(document, 'span', { 'data-writing-date': '' }, entry.date),
        createElement(document, 'span', { 'data-writing-title': '' }, pick(entry.title, i18n.locale)),
        createElement(document, 'span', { 'data-writing-tag': '' }, `{${entry.tag}}`),
      );
      row.append(link);
      list.append(row);
    });

    root.replaceChildren(header, list);
    mount.scrollTop = 0;
  };

  render();
  i18n.subscribe(render);
  return root;
}
