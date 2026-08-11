import { about, pick } from '../data/content.js';

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

    const masthead = createElement(document, 'header', { 'data-about-masthead': '' });
    masthead.append(
      createElement(document, 'h3', {}, about.name),
      createElement(document, 'p', { 'data-about-role': '' }, pick(about.role, locale)),
    );

    const bio = createElement(document, 'section', { 'data-about-section': 'bio' });
    bio.append(
      sectionKicker(document, i18n.t('about.bio')),
      createElement(document, 'p', { 'data-about-bio': '' }, pick(about.bio, locale)),
    );

    const timeline = createElement(document, 'section', { 'data-about-section': 'timeline' });
    timeline.append(sectionKicker(document, i18n.t('about.timeline')));
    const timelineList = createElement(document, 'ul', { 'data-about-timeline': '' });
    about.timeline.forEach((entry) => {
      const row = createElement(document, 'li', {});
      row.append(
        createElement(document, 'span', { 'data-about-year': '' }, entry.year),
        createElement(document, 'span', {}, pick(entry.event, locale)),
      );
      timelineList.append(row);
    });
    timeline.append(timelineList);

    const stack = createElement(document, 'section', { 'data-about-section': 'stack' });
    stack.append(sectionKicker(document, i18n.t('about.stack')));
    const stackList = createElement(document, 'ul', { 'data-about-stack': '' });
    about.stack.forEach((line) => {
      stackList.append(createElement(document, 'li', {}, line));
    });
    stack.append(stackList);

    const now = createElement(document, 'section', { 'data-about-section': 'now' });
    now.append(sectionKicker(document, i18n.t('about.now')));
    const nowList = createElement(document, 'dl', { 'data-about-now': '' });
    about.now.forEach((entry) => {
      nowList.append(
        createElement(document, 'dt', {}, entry.key),
        createElement(document, 'dd', {}, pick(entry.value, locale)),
      );
    });
    now.append(nowList);

    root.replaceChildren(masthead, bio, timeline, stack, now);
  };

  render();
  i18n.subscribe(render);
  return root;
}
