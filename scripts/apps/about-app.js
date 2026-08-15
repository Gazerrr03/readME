import { about, pick } from '../data/content.js';
import { createAboutAvatar, createAboutBanner } from './about-graphics.js';

function createElement(document, tagName, attributes = {}, text = '') {
  const element = document.createElement(tagName);
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
  element.textContent = text;
  return element;
}

function sectionKicker(document, label) {
  return createElement(document, 'p', { 'data-about-kicker': '' }, label);
}

export function renderAboutApp({ i18n, mount }) {
  const document = mount.ownerDocument;
  const root = createElement(document, 'section', { 'data-about-app': '' });

  const render = () => {
    const locale = i18n.locale;
    const banner = createAboutBanner({ document, i18n });

    const masthead = createElement(document, 'header', { 'data-about-masthead': '' });
    masthead.append(
      createElement(document, 'h3', {}, about.name),
      createElement(document, 'p', { 'data-about-role': '' }, pick(about.role, locale)),
    );
    const identity = createElement(document, 'div', { 'data-about-identity': '' });
    identity.append(createAboutAvatar({ document, i18n }), masthead);

    const bio = createElement(document, 'section', { 'data-about-section': 'bio' });
    bio.append(
      sectionKicker(document, i18n.t('about.bio')),
      createElement(document, 'p', { 'data-about-bio': '' }, pick(about.bio, locale)),
    );

    const experience = createElement(document, 'section', { 'data-about-section': 'experience' });
    experience.append(sectionKicker(document, i18n.t('about.experience')));
    const experienceList = createElement(document, 'ul', { 'data-about-experience': '' });
    about.experience.forEach((entry) => {
      const row = createElement(document, 'li', {});
      row.append(
        createElement(document, 'span', { 'data-about-experience-label': '' }, pick(entry.label, locale)),
        createElement(document, 'span', { 'data-about-experience-name': '' }, entry.name),
      );
      experienceList.append(row);
    });
    experience.append(experienceList);

    const works = createElement(document, 'section', { 'data-about-section': 'works' });
    works.append(sectionKicker(document, i18n.t('about.works')));
    const worksList = createElement(document, 'ul', { 'data-about-works': '' });
    about.works.forEach((entry) => {
      const row = createElement(document, 'li', { 'data-about-work': '' });
      const heading = createElement(document, 'div', { 'data-about-work-heading': '' });
      heading.append(
        createElement(document, 'h4', { 'data-about-work-name': '' }, entry.name),
        createElement(document, 'span', { 'data-about-work-meta': '' }, pick(entry.meta, locale)),
      );
      row.append(
        heading,
        createElement(document, 'p', { 'data-about-work-description': '' }, pick(entry.description, locale)),
      );
      worksList.append(row);
    });
    works.append(worksList);

    const toolbox = createElement(document, 'section', { 'data-about-section': 'toolbox' });
    toolbox.append(sectionKicker(document, i18n.t('about.toolbox')));
    const toolboxList = createElement(document, 'ul', { 'data-about-toolbox': '' });
    about.toolbox.forEach((line) => {
      toolboxList.append(createElement(document, 'li', {}, pick(line, locale)));
    });
    toolbox.append(toolboxList);

    const now = createElement(document, 'section', { 'data-about-section': 'now' });
    now.append(sectionKicker(document, i18n.t('about.now')));
    const nowList = createElement(document, 'dl', { 'data-about-now': '' });
    about.now.forEach((entry) => {
      nowList.append(
        createElement(document, 'dt', {}, pick(entry.key, locale)),
        createElement(document, 'dd', {}, pick(entry.value, locale)),
      );
    });
    now.append(nowList);

    root.replaceChildren(banner, identity, bio, experience, works, toolbox, now);
  };

  render();
  i18n.subscribe(render);
  return root;
}
