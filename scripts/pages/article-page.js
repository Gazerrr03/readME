import { pick } from '../data/content.js';
import { contentPath } from '../routing/content-routes.js';

function createElement(document, tagName, attributes = {}, text = '') {
  const element = document.createElement(tagName);
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
  element.textContent = text;
  return element;
}

const padIndex = (value) => String(value).padStart(2, '0');

function estimateMinutes(body) {
  const text = body.filter((item) => typeof item === 'string').join(' ');
  const cjk = (text.match(/[\u3000-\u9fff\uff00-\uffef]/g) ?? []).length;
  const words = text
    .replace(/[\u3000-\u9fff\uff00-\uffef]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(cjk / 400 + words / 200));
}

function readingBand(document, i18n) {
  const word = i18n.t('writing.band');
  return createElement(document, 'p', {
    'data-content-reading-band': '',
    'aria-hidden': 'true',
  }, Array.from({ length: 24 }, () => word).join(' / '));
}

function renderBody(document, body) {
  const container = createElement(document, 'div', { 'data-content-article-body': '' });
  let leadApplied = false;
  body.forEach((item) => {
    if (typeof item === 'string') {
      const paragraph = createElement(document, 'p', leadApplied ? {} : {
        'data-content-article-lead': '',
      }, item);
      leadApplied = true;
      container.append(paragraph);
      return;
    }
    if (item.h) {
      container.append(createElement(document, 'h2', {
        'data-content-article-section': '',
      }, item.h));
      return;
    }
    if (item.a) {
      const paragraph = createElement(document, 'p');
      const link = createElement(document, 'a', {
        href: item.href,
        target: '_blank',
        rel: 'noreferrer',
      }, item.a);
      paragraph.append(link);
      if (item.rest) paragraph.append(document.createTextNode(item.rest));
      container.append(paragraph);
    }
  });
  return container;
}

function articleLink(document, i18n, entry, index, direction) {
  const link = createElement(document, 'a', {
    href: contentPath('writing', entry.slug),
    [`data-content-${direction}`]: '',
  });
  const label = direction === 'previous' ? i18n.t('writing.prev') : i18n.t('writing.next');
  link.append(
    createElement(document, 'span', { 'data-content-nav-label': '' },
      `${label} / ${padIndex(index + 1)}`),
    createElement(document, 'span', { 'data-content-nav-title': '' },
      pick(entry.title, i18n.locale)),
  );
  return link;
}

export function renderArticlePage({ document, i18n, article, articles }) {
  const index = articles.findIndex((entry) => entry.slug === article.slug);
  const body = pick(article.body, i18n.locale);
  const previousIndex = (index - 1 + articles.length) % articles.length;
  const nextIndex = (index + 1) % articles.length;
  const element = createElement(document, 'article', { 'data-content-article': '' });
  const masthead = createElement(document, 'header', { 'data-content-article-masthead': '' });
  masthead.append(
    createElement(document, 'p', { 'data-content-position': '' },
      `${padIndex(index + 1)} / ${padIndex(articles.length)}`),
    createElement(document, 'h1', { tabindex: '-1' }, pick(article.title, i18n.locale)),
    createElement(document, 'p', { 'data-content-article-meta': '' },
      `${article.date} / {${article.tag}} / ${i18n.t('writing.minutes').replace('{n}', String(estimateMinutes(body)))}`),
  );
  const navigation = createElement(document, 'nav', {
    'data-content-pagination': '',
    'aria-label': i18n.t('apps.writing'),
  });
  navigation.append(
    articleLink(document, i18n, articles[previousIndex], previousIndex, 'previous'),
    articleLink(document, i18n, articles[nextIndex], nextIndex, 'next'),
  );
  element.append(
    masthead,
    readingBand(document, i18n),
    renderBody(document, body),
    readingBand(document, i18n),
    navigation,
  );
  return element;
}
