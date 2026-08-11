import { createWireframePreview } from '../apps/wireframe-preview.js';
import { pick } from '../data/content.js';

function createElement(document, tagName, attributes = {}, text = '') {
  const element = document.createElement(tagName);
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
  element.textContent = text;
  return element;
}

export function renderProjectPage({ document, i18n, project }) {
  const element = createElement(document, 'section', {
    'data-content-project': '',
    'aria-label': pick(project.title, i18n.locale),
  });
  const previewMount = createElement(document, 'div', { 'data-content-project-preview': '' });
  const canvas = createElement(document, 'canvas', {
    'data-content-project-canvas': '',
    role: 'img',
    'aria-label': i18n.t('projects.modelPreview'),
  });
  previewMount.append(canvas);

  const body = createElement(document, 'div', { 'data-content-project-body': '' });
  const heading = createElement(document, 'header', { 'data-content-project-heading': '' });
  heading.append(
    createElement(document, 'p', { 'data-content-project-kicker': '' },
      `${project.year} / ${project.kind} / ${project.status}`),
    createElement(document, 'h1', { tabindex: '-1' }, pick(project.title, i18n.locale)),
  );

  const metadata = createElement(document, 'dl', { 'data-content-project-meta': '' });
  [
    [i18n.t('projects.year'), String(project.year)],
    [i18n.t('projects.stack'), project.stack],
    [i18n.t('projects.status'), project.status],
  ].forEach(([term, value]) => {
    metadata.append(
      createElement(document, 'dt', {}, term),
      createElement(document, 'dd', {}, value),
    );
  });

  const actions = createElement(document, 'nav', {
    'data-content-project-actions': '',
    'aria-label': pick(project.title, i18n.locale),
  });
  [
    [i18n.t('projects.open'), project.url],
    [i18n.t('projects.source'), project.source],
  ].forEach(([label, href]) => {
    actions.append(createElement(document, 'a', {
      href,
      target: '_blank',
      rel: 'noreferrer',
    }, label));
  });
  body.append(
    heading,
    metadata,
    createElement(document, 'p', { 'data-content-project-description': '' },
      pick(project.description, i18n.locale)),
    actions,
  );
  element.append(previewMount, body);

  const preview = createWireframePreview(canvas, project.geometry);
  return {
    element,
    dispose() {
      preview.dispose();
    },
  };
}
