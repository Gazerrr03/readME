import { pick } from '../data/content.js';
import { createContentStore } from '../content/content-store.js';
import { defaultContentDocument } from '../content/default-document.js';
import { connectReviewPreview } from '../content/review-preview.js';
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

const contentStore = createContentStore({ defaultDocument: defaultContentDocument });
await contentStore.loadPublished(new URL('content/content.json', documentRef.baseURI).href);
const disconnectReviewPreview = connectReviewPreview({
  location: window.location,
  contentStore,
});

const SUPPORTED_LOCALES = new Set(['en', 'zh-CN', 'ja']);
const READING_THEME_KEY = 'portfolio-os:reading-theme';
const READING_THEMES = Object.freeze(['dark', 'light']);

function readLocaleFromUrl() {
  const value = new URLSearchParams(window.location.search).get('lang');
  return SUPPORTED_LOCALES.has(value) ? value : null;
}

function writeLocaleToUrl(locale) {
  const url = new URL(window.location.href);
  url.searchParams.set('lang', locale);
  window.history.replaceState(null, '', url);
}

function reviewPreviewPath(path) {
  const parameters = new URLSearchParams(window.location.search);
  if (parameters.get('reviewPreview') !== '1' || !parameters.get('channel')) return path;
  return `${path}&skipBoot=1&reviewPreview=1&channel=${encodeURIComponent(parameters.get('channel'))}`;
}

const locale = readLocaleFromUrl() ?? resolvePreferredLocale(localStorage, navigator.languages);
const i18n = createI18n(locale, undefined, contentStore);
let readingTheme = resolveReadingTheme();
let focused = false;
let disposePresentation = () => {};

function resolveReadingTheme() {
  try {
    const stored = localStorage.getItem(READING_THEME_KEY);
    if (READING_THEMES.includes(stored)) return stored;
  } catch {
    // The dark palette remains the safe fallback when storage is unavailable.
  }
  return 'dark';
}

function saveReadingTheme(theme) {
  try {
    localStorage.setItem(READING_THEME_KEY, theme);
  } catch {
    // The current page can still switch themes when persistence is blocked.
  }
}

function applyReadingTheme() {
  if (kind !== 'writing') {
    documentRef.documentElement.removeAttribute('data-reading-theme');
    return;
  }
  documentRef.documentElement.dataset.readingTheme = readingTheme;
}

function syncThemeButton(button) {
  const isLight = readingTheme === 'light';
  button.setAttribute('aria-pressed', String(isLight));
  button.setAttribute('aria-label', i18n.t(
    isLight ? 'content.themeToDark' : 'content.themeToLight',
  ));
  button.title = i18n.t(isLight ? 'content.themeToDark' : 'content.themeToLight');
  const value = button.querySelector('[data-content-theme-value]');
  if (value) value.textContent = i18n.t(isLight ? 'content.themeLight' : 'content.themeDark');
}

function supportedKind() {
  return kind === 'projects' ? 'projects' : 'writing';
}

function renderHeader() {
  const header = createElement(documentRef, 'header', { 'data-content-header': '' });
  const returnLink = createElement(documentRef, 'a', {
    href: reviewPreviewPath(desktopPath(supportedKind())),
    'data-content-return': '',
  }, `← ${i18n.t(kind === 'projects' ? 'content.returnProjects' : 'content.returnWriting')}`);
  const identity = createElement(documentRef, 'div', { 'data-content-identity': '' });
  identity.append(
    createElement(documentRef, 'strong', {}, 'QIZHI'),
    createElement(documentRef, 'span', {},
      i18n.t(kind === 'projects' ? 'content.project' : 'content.article')),
  );
  const controls = createElement(documentRef, 'div', { 'data-content-controls': '' });
  const readingControls = createElement(documentRef, 'div', {
    'data-content-reading-controls': '',
    'aria-label': i18n.t('content.displayMode'),
    role: 'group',
  });
  const label = createElement(documentRef, 'label', { 'data-content-language-label': '' });
  label.append(createElement(documentRef, 'span', {
    'data-content-language-name': '',
  }, i18n.t('content.language')));
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
  readingControls.append(label);
  if (kind === 'writing') {
    const themeButton = createElement(documentRef, 'button', {
      type: 'button',
      'data-content-theme-toggle': '',
      'aria-pressed': 'false',
    });
    themeButton.append(createElement(documentRef, 'span', {
      'data-content-theme-prefix': '',
      'aria-hidden': 'true',
    }, 'MODE / '), createElement(documentRef, 'span', {
      'data-content-theme-value': '',
    }));
    syncThemeButton(themeButton);
    themeButton.addEventListener('click', () => {
      readingTheme = readingTheme === 'dark' ? 'light' : 'dark';
      saveReadingTheme(readingTheme);
      applyReadingTheme();
      syncThemeButton(themeButton);
    });
    readingControls.append(themeButton);
  }
  controls.append(readingControls);
  header.append(returnLink, identity, controls);
  return header;
}

function renderUnavailable() {
  const section = createElement(documentRef, 'section', { 'data-content-unavailable': '' });
  section.append(
    createElement(documentRef, 'h1', { tabindex: '-1' }, i18n.t('content.unavailable')),
    createElement(documentRef, 'a', {
      href: reviewPreviewPath(desktopPath(supportedKind())),
    }, i18n.t(kind === 'projects' ? 'content.returnProjects' : 'content.returnWriting')),
  );
  return section;
}

function render() {
  applyReadingTheme();
  disposePresentation();
  const { articles, projects } = contentStore.snapshot;
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
window.addEventListener('pagehide', () => {
  disposePresentation();
  disconnectReviewPreview();
}, { once: true });
render();
