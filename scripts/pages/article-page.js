import { pick } from '../data/content.js';
import { contentPath, desktopPath } from '../routing/content-routes.js';
import { markdownEditionLinks, renderArticleTools } from './article-tools.js';

function createElement(document, tagName, attributes = {}, text = '') {
  const element = document.createElement(tagName);
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
  element.textContent = text;
  return element;
}

const padIndex = (value) => String(value).padStart(2, '0');

function reviewPreviewPath(document, path) {
  const params = new URLSearchParams(document.defaultView.location.search);
  if (params.get('reviewPreview') !== '1' || !params.get('channel')) return path;
  return `${path}?${new URLSearchParams({
    reviewPreview: '1',
    channel: params.get('channel'),
  }).toString()}`;
}

export function getWritingCoverVariant(slug, index) {
  const hash = Array.from(slug).reduce((total, character) => (
    (total * 31 + character.codePointAt(0)) >>> 0
  ), 0);
  return padIndex((hash + index) % 4 + 1);
}

export function getWritingTitleTier(title) {
  const length = Array.from(title.trim()).length;
  if (length >= 48) return 'long';
  if (length >= 22) return 'medium';
  return 'short';
}

function estimateMinutes(body) {
  const text = body.filter((item) => typeof item === 'string' || (item && item.q))
    .map((item) => (typeof item === 'string' ? item : item.q))
    .join(' ');
  const cjk = (text.match(/[\u3000-\u9fff\uff00-\uffef]/g) ?? []).length;
  const words = text
    .replace(/[\u3000-\u9fff\uff00-\uffef]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(cjk / 400 + words / 200));
}

function renderBody(document, body) {
  const container = createElement(document, 'div', { 'data-content-article-body': '' });
  let leadApplied = false;
  body.forEach((item, itemIndex) => {
    const blockAttributes = {
      id: `section-${itemIndex}`,
      'data-content-article-block': '',
      'data-content-section-index': String(itemIndex),
    };
    if (typeof item === 'string') {
      const paragraph = createElement(document, 'p', {
        ...blockAttributes,
        ...(leadApplied ? {} : { 'data-content-article-lead': '' }),
      }, item);
      leadApplied = true;
      container.append(paragraph);
      return;
    }
    if (item.h) {
      container.append(createElement(document, 'h2', {
        ...blockAttributes,
        'data-content-article-section': '',
      }, item.h));
      return;
    }
    if (item.q) {
      container.append(createElement(document, 'blockquote', {
        ...blockAttributes,
        'data-content-quote': '',
      }, item.q));
      return;
    }
    if (item.a) {
      const paragraph = createElement(document, 'p', blockAttributes);
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

function renderMasthead(document, i18n, article, body, index, total) {
  const title = pick(article.title, i18n.locale);
  const masthead = createElement(document, 'header', {
    'data-content-article-masthead': '',
    'data-writing-cover': '',
    'data-writing-cover-variant': getWritingCoverVariant(article.slug, index),
    'data-writing-title-tier': getWritingTitleTier(title),
  });
  const meta = createElement(document, 'p', {
    'data-content-article-meta': '',
    'data-writing-meta': '',
  });
  meta.append(
    createElement(document, 'span', { 'data-content-published': '' },
      `${i18n.t('writing.published')} ${article.date}`),
  );
  if (article.edited && article.edited !== article.date) {
    meta.append(
      createElement(document, 'span', { 'data-content-edited': '' },
        `${i18n.t('writing.lastEdited')} ${article.edited}`),
    );
  }
  meta.append(
    createElement(document, 'span', { 'data-content-minutes': '' },
      i18n.t('writing.minutes').replace('{n}', String(estimateMinutes(body)))),
  );
  const tagLink = createElement(document, 'a', {
    href: `../../${reviewPreviewPath(document, desktopPath('writing'))}`,
    'data-content-tag': '',
    'data-writing-cover-tag': '',
  }, `{${article.tag}}`);
  masthead.append(
    createElement(document, 'p', { 'data-content-position': '' },
      `${padIndex(index + 1)} / ${padIndex(total)}`),
    createElement(document, 'span', { 'data-writing-cover-index': '', 'aria-hidden': 'true' }, padIndex(index + 1)),
    createElement(document, 'h1', { tabindex: '-1', 'data-writing-title': '' }, title),
    meta,
    tagLink,
    createElement(document, 'span', { 'data-writing-scroll-cue': '', 'aria-hidden': 'true' }),
  );
  return masthead;
}

function renderFieldNotes(document, i18n, article) {
  if (!article.notes) return null;
  const aside = createElement(document, 'aside', { 'data-content-field-notes': '' });
  aside.append(
    createElement(document, 'p', { 'data-content-field-notes-label': '' },
      i18n.t('writing.fieldNotes')),
    createElement(document, 'p', { 'data-content-field-notes-text': '' },
      pick(article.notes, i18n.locale)),
  );
  return aside;
}

function renderFooter(document, i18n) {
  const footer = createElement(document, 'footer', { 'data-content-article-footer': '' });
  footer.append(
    createElement(document, 'p', { 'data-content-rights': '' }, i18n.t('writing.rights')),
    markdownEditionLinks(document, i18n),
  );
  return footer;
}

function articleLink(document, i18n, entry, index, direction) {
  const link = createElement(document, 'a', {
    href: reviewPreviewPath(document, contentPath('writing', entry.slug)),
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
  const element = createElement(document, 'article', {
    'data-content-article': '',
    'data-writing-reader': '',
  });
  const navigation = createElement(document, 'nav', {
    'data-content-pagination': '',
    'aria-label': i18n.t('apps.writing'),
  });
  navigation.append(
    articleLink(document, i18n, articles[previousIndex], previousIndex, 'previous'),
    articleLink(document, i18n, articles[nextIndex], nextIndex, 'next'),
  );
  const bodyContainer = renderBody(document, body);
  const fieldNotes = renderFieldNotes(document, i18n, article);
  const articleRegion = createElement(document, 'div', { 'data-writing-article': '' });
  articleRegion.append(bodyContainer);
  element.append(renderMasthead(document, i18n, article, body, index, articles.length), articleRegion);
  if (fieldNotes) {
    articleRegion.append(
      createElement(document, 'hr', { 'data-content-field-notes-rule': '' }),
      fieldNotes,
    );
  }
  articleRegion.append(
    navigation,
    renderFooter(document, i18n),
  );
  const tools = renderArticleTools({
    document, i18n, article, body, bodyContainer,
  });
  element.append(tools.element);
  return {
    element,
    dispose: tools.dispose,
  };
}
