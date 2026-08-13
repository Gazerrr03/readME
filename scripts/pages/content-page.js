import { articles, pick, projects } from '../data/content.js';
import { createI18n } from '../i18n/i18n.js';
import { desktopPath } from '../routing/content-routes.js';
import {
  loadPreferences,
  resolvePreferredLocale,
  savePreferences,
} from '../state/preferences.js';
import { renderArticlePage } from './article-page.js';
import { renderProjectPage } from './project-page.js';

function createElement(document, tagName, attributes = {}, text = '') {
  const element = document.createElement(tagName);
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
  element.textContent = text;
  return element;
}

const documentRef = document;
const kind = documentRef.body.dataset.contentKind;
const slug = documentRef.body.dataset.contentSlug;
const mount = documentRef.querySelector('[data-content-page]');

const SUPPORTED_LOCALES = new Set(['en', 'zh-CN', 'ja']);

function readLocaleFromUrl() {
  const value = new URLSearchParams(window.location.search).get('lang');
  return SUPPORTED_LOCALES.has(value) ? value : null;
}

function writeLocaleToUrl(locale) {
  const url = new URL(window.location.href);
  url.searchParams.set('lang', locale);
  window.history.replaceState(null, '', url);
}

const locale = readLocaleFromUrl() ?? resolvePreferredLocale(localStorage, navigator.languages);
const i18n = createI18n(locale);
let focused = false;
let disposePresentation = () => {};

function supportedKind() {
  return kind === 'projects' ? 'projects' : 'writing';
}

function renderHeader() {
  const header = createElement(documentRef, 'header', { 'data-content-header': '' });
  const identity = createElement(documentRef, 'div', { 'data-content-identity': '' });
  identity.append(
    createElement(documentRef, 'strong', {}, 'QIZHI'),
    createElement(documentRef, 'span', {},
      i18n.t(kind === 'projects' ? 'content.project' : 'content.article')),
  );
  const controls = createElement(documentRef, 'div', { 'data-content-controls': '' });
  const returnLink = createElement(documentRef, 'a', {
    href: desktopPath(supportedKind()),
    'data-content-return': '',
  }, i18n.t(kind === 'projects' ? 'content.returnProjects' : 'content.returnWriting'));
  const label = createElement(documentRef, 'label', { 'data-content-language-label': '' });
  label.append(createElement(documentRef, 'span', {}, i18n.t('content.language')));
  const select = createElement(documentRef, 'select', {
    'data-content-language': '',
    'aria-label': i18n.t('content.language'),
  });
  [
    ['en', i18n.t('language.en')],
    ['zh-CN', i18n.t('language.zh')],
    ['ja', i18n.t('language.ja')],
  ].forEach(([value, text]) => {
    const option = createElement(documentRef, 'option', { value }, text);
    if (value === i18n.locale) option.selected = true;
    select.append(option);
  });
  select.addEventListener('change', () => {
    const preferences = loadPreferences(localStorage);
    preferences.locale = select.value;
    savePreferences(localStorage, preferences);
    writeLocaleToUrl(select.value);
    i18n.setLocale(select.value);
  });
  label.append(select);
  controls.append(returnLink, label);
  header.append(identity, controls);
  return header;
}

function renderUnavailable() {
  const section = createElement(documentRef, 'section', { 'data-content-unavailable': '' });
  section.append(
    createElement(documentRef, 'h1', { tabindex: '-1' }, i18n.t('content.unavailable')),
    createElement(documentRef, 'a', {
      href: desktopPath(supportedKind()),
    }, i18n.t(kind === 'projects' ? 'content.returnProjects' : 'content.returnWriting')),
  );
  return section;
}

function render() {
  disposePresentation();
  const article = kind === 'writing'
    ? articles.find((entry) => entry.slug === slug)
    : null;
  const project = kind === 'projects'
    ? projects.find((entry) => entry.slug === slug)
    : null;
  const main = createElement(documentRef, 'main', { 'data-content-main': '' });
  let presentation;
  if (article) {
    presentation = renderArticlePage({ document: documentRef, i18n, article, articles });
  } else if (project) {
    presentation = renderProjectPage({ document: documentRef, i18n, project });
  } else {
    presentation = { element: renderUnavailable(), dispose() {} };
  }
  disposePresentation = presentation.dispose;
  main.append(presentation.element);
  mount.replaceChildren(renderHeader(), main);
  documentRef.documentElement.lang = i18n.locale;
  const item = article ?? project;
  documentRef.title = item
    ? `${pick(item.title, i18n.locale)} - QIZHI`
    : i18n.t('content.unavailable');
  if (!focused) {
    main.querySelector('h1')?.focus({ preventScroll: true });
    focused = true;
  }
}

i18n.subscribe(render);
window.addEventListener('pagehide', () => disposePresentation(), { once: true });
render();
