import { pick } from '../data/content.js';

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
    'data-writing-band': '',
    'aria-hidden': 'true',
  }, Array.from({ length: 24 }, () => word).join(' — '));
}

export function renderWritingApp({ i18n, content, mount, host = {} }) {
  const document = mount.ownerDocument;
  const root = createElement(document, 'section', { 'data-writing-app': '' });
  let openSlug = null;

  const renderList = (locale) => {
    const { articles } = content();
    const header = createElement(document, 'header', { 'data-writing-header': '' });
    header.append(
      createElement(document, 'p', { 'data-writing-kicker': '' }, i18n.t('writing.archive')),
      createElement(document, 'p', { 'data-writing-count': '' },
        i18n.t('writing.entries').replace('{n}', String(articles.length))),
    );
    const list = createElement(document, 'ul', { 'data-writing-list': '' });
    articles.forEach((entry, index) => {
      const row = createElement(document, 'li', {});
      const button = createElement(document, 'button', {
        type: 'button', 'data-writing-open': entry.slug,
      });
      button.append(
        createElement(document, 'span', { 'data-writing-index': '' }, `${padIndex(index + 1)}.`),
        createElement(document, 'span', { 'data-writing-date': '' }, pick(entry.dateLabel, locale)),
        createElement(document, 'span', { 'data-writing-title': '' }, pick(entry.title, locale)),
        createElement(document, 'span', { 'data-writing-tag': '' }, `{${pick(entry.tagLabel, locale)}}`),
      );
      row.append(button);
      list.append(row);
    });
    root.replaceChildren(header, list);
  };

  const renderReader = (article, index, locale) => {
    const { articles } = content();
    const reader = createElement(document, 'article', { 'data-writing-reader': '' });

    const masthead = createElement(document, 'header', { 'data-writing-masthead': '' });
    const toolbar = createElement(document, 'div', { 'data-writing-toolbar': '' });
    toolbar.append(
      createElement(document, 'button', { type: 'button', 'data-writing-back': '' },
        `← ${i18n.t('nav.back')}`),
      createElement(document, 'span', { 'data-writing-position': '' },
        `${padIndex(index + 1)} / ${padIndex(articles.length)}`),
    );
    const body = pick(article.body, locale);
    const minutes = estimateMinutes(body);
    masthead.append(
      toolbar,
      createElement(document, 'h3', {}, pick(article.title, locale)),
      createElement(document, 'p', { 'data-writing-meta': '' },
        `${pick(article.dateLabel, locale)} / {${pick(article.tagLabel, locale)}} / ${i18n.t('writing.minutes').replace('{n}', String(minutes))}`),
    );

    const bodyContainer = createElement(document, 'div', { 'data-writing-body': '' });
    let leadApplied = false;
    body.forEach((item) => {
      if (typeof item === 'string') {
        const paragraph = createElement(document, 'p', leadApplied ? {} : { 'data-writing-lead': '' }, item);
        leadApplied = true;
        bodyContainer.append(paragraph);
        return;
      }
      if (item.h) {
        bodyContainer.append(createElement(document, 'h4', { 'data-writing-section': '' }, item.h));
        return;
      }
      if (item.a) {
        const paragraph = createElement(document, 'p', {});
        const link = createElement(document, 'a', {
          href: item.href, target: '_blank', rel: 'noreferrer',
        }, item.a);
        paragraph.append(link);
        if (item.rest) paragraph.append(document.createTextNode(item.rest));
        bodyContainer.append(paragraph);
      }
    });

    const previous = articles[(index - 1 + articles.length) % articles.length];
    const next = articles[(index + 1) % articles.length];
    const pagination = createElement(document, 'footer', { 'data-writing-pagination': '' });
    [
      { entry: previous, label: `← ${i18n.t('writing.prev')}`, number: index - 1 },
      { entry: next, label: `${i18n.t('writing.next')} →`, number: index + 1 },
    ].forEach(({ entry, label, number }) => {
      const wrapped = (number + articles.length) % articles.length;
      const button = createElement(document, 'button', {
        type: 'button', 'data-writing-goto': entry.slug,
      });
      button.append(
        createElement(document, 'span', { 'data-writing-nav-label': '' },
          `${label} / ${padIndex(wrapped + 1)}`),
        createElement(document, 'span', { 'data-writing-nav-title': '' },
          pick(entry.title, locale)),
      );
      pagination.append(button);
    });

    reader.append(masthead, readingBand(document, i18n), bodyContainer, readingBand(document, i18n), pagination);
    root.replaceChildren(reader);
  };

  const render = () => {
    const locale = i18n.locale;
    const { articles } = content();
    const index = openSlug ? articles.findIndex(({ slug }) => slug === openSlug) : -1;
    if (index < 0) openSlug = null;

    if (!openSlug) renderList(locale);
    else renderReader(articles[index], index, locale);

    mount.scrollTop = 0;
  };

  root.addEventListener('click', (event) => {
    const open = event.target.closest('[data-writing-open]');
    if (open) {
      openSlug = open.dataset.writingOpen;
      host.maximize?.();
      render();
      return;
    }
    const goto = event.target.closest('[data-writing-goto]');
    if (goto) {
      openSlug = goto.dataset.writingGoto;
      render();
      return;
    }
    if (event.target.closest('[data-writing-back]')) {
      openSlug = null;
      host.unmaximize?.();
      render();
    }
  });

  render();
  i18n.subscribe(render);
  return root;
}
