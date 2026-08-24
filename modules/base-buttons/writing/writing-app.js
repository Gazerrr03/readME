import { articles as baseArticles } from './data.js';
import { pick } from '../../../scripts/data/content.js';
import { contentPath } from '../../../scripts/routing/content-routes.js';

function createElement(document, tagName, attributes = {}, text = '') {
  const element = document.createElement(tagName);
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
  element.textContent = text;
  return element;
}

const padIndex = (value) => String(value).padStart(2, '0');
const localizedValue = (value, locale) => (
  value && typeof value === 'object' ? pick(value, locale) : String(value ?? '')
);

function articleHref(document, slug) {
  const href = contentPath('writing', slug);
  const params = new URLSearchParams(document.defaultView.location.search);
  if (params.get('reviewPreview') !== '1' || !params.get('channel')) return href;
  const query = new URLSearchParams({
    reviewPreview: '1',
    channel: params.get('channel'),
  });
  return `${href}?${query.toString()}`;
}

export function renderWritingApp({ i18n, content = () => ({ articles: baseArticles }), mount }) {
  const document = mount.ownerDocument;
  const root = createElement(document, 'section', { 'data-writing-app': '' });

  const render = () => {
    const { articles } = content();
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
        href: articleHref(document, entry.slug),
        'data-writing-open': entry.slug,
      });
      link.append(
        createElement(document, 'span', { 'data-writing-index': '' }, `${padIndex(index + 1)}.`),
        createElement(document, 'span', { 'data-writing-date': '' }, localizedValue(entry.dateLabel ?? entry.date, i18n.locale)),
        createElement(document, 'span', { 'data-writing-title': '' }, pick(entry.title, i18n.locale)),
        createElement(document, 'span', { 'data-writing-tag': '' }, `{${localizedValue(entry.tagLabel ?? entry.tag, i18n.locale)}}`),
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
