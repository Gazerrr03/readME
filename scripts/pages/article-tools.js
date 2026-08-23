import {
  addAnnotation,
  addHighlight,
  loadHighlights,
  loadNotes,
  removeHighlight,
  removeNote,
  renderNotesMarkdown,
  updateNote,
} from '../state/article-notes.js';

function createElement(document, tagName, attributes = {}, text = '') {
  const element = document.createElement(tagName);
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
  element.textContent = text;
  return element;
}

const MARK_SELECTOR = '[data-note-mark], [data-highlight-mark]';

const MARK_ATTRIBUTES = Object.freeze({
  note: {
    'data-note-mark': '',
    'data-note-type': 'annotation',
  },
  highlight: {
    'data-highlight-mark': '',
  },
});

const MARKDOWN_EDITIONS = Object.freeze([
  ['en', 'en.md'],
  ['zh-CN', 'zh.md'],
  ['ja', 'ja.md'],
]);

export function markdownEditionLinks(document, i18n) {
  const block = createElement(document, 'div', { 'data-content-markdown-links': '' });
  block.append(createElement(document, 'span', { 'data-content-markdown-label': '' },
    i18n.t('writing.markdownEdition')));
  MARKDOWN_EDITIONS.forEach(([locale, file]) => {
    block.append(createElement(document, 'a', {
      href: file,
      'data-content-markdown': locale,
    }, file));
  });
  return block;
}

function timelineExcerpt(value, maxLength = 116) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 1).trimEnd()}…` : text;
}

export function sectionsFromBody(body) {
  const sections = [];
  body.forEach((item, itemIndex) => {
    if (typeof item === 'string' && item.trim()) {
      sections.push({
        id: `section-${itemIndex}`,
        title: timelineExcerpt(item),
        kind: 'paragraph',
      });
      return;
    }
    if (item?.h) {
      sections.push({
        id: `section-${itemIndex}`,
        title: timelineExcerpt(item.h),
        kind: 'heading',
      });
      return;
    }
    if (item?.q) {
      sections.push({
        id: `section-${itemIndex}`,
        title: timelineExcerpt(item.q),
        kind: 'quote',
      });
      return;
    }
    if (item?.a) {
      sections.push({
        id: `section-${itemIndex}`,
        title: timelineExcerpt(`${item.a}${item.rest ?? ''}`),
        kind: 'paragraph',
      });
    }
  });
  return sections;
}

function downloadMarkdown(document, filename, content) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = createElement(document, 'a', { href: url, download: filename });
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function wrapQuoteInElement(element, quote, attributes) {
  const walker = element.ownerDocument.createTreeWalker(
    element,
    element.ownerDocument.defaultView.NodeFilter.SHOW_TEXT,
  );
  const nodes = [];
  let fullText = '';
  let node;
  while ((node = walker.nextNode())) {
    if (node.parentElement?.closest(MARK_SELECTOR)) continue;
    nodes.push({ node, start: fullText.length });
    fullText += node.data;
  }
  const position = fullText.indexOf(quote);
  if (position === -1) return false;
  const endPosition = position + quote.length;
  const startNode = nodes.find(({ start, node: textNode }) => (
    position >= start && position <= start + textNode.data.length
  ));
  const endNode = nodes.find(({ start, node: textNode }) => (
    endPosition >= start && endPosition <= start + textNode.data.length
  ));
  if (!startNode || !endNode) return false;
  const range = element.ownerDocument.createRange();
  range.setStart(startNode.node, position - startNode.start);
  range.setEnd(endNode.node, endPosition - endNode.start);
  const mark = element.ownerDocument.createElement('mark');
  Object.entries(attributes).forEach(([name, value]) => mark.setAttribute(name, value));
  try {
    range.surroundContents(mark);
  } catch {
    mark.append(range.extractContents());
    range.insertNode(mark);
  }
  return true;
}

function applyMarks(bodyContainer, entries, attributes) {
  const candidates = bodyContainer.querySelectorAll('p, blockquote');
  let applied = 0;
  entries.forEach((entry) => {
    const quote = String(entry.quote ?? '').trim();
    if (!quote) return;
    for (const candidate of candidates) {
      if (!candidate.textContent.includes(quote)) continue;
      if (wrapQuoteInElement(candidate, quote, attributes)) {
        applied += 1;
        break;
      }
    }
  });
  return applied;
}

export function applyNoteMarks(bodyContainer, entries) {
  return applyMarks(bodyContainer, entries, MARK_ATTRIBUTES.note);
}

export function applyHighlightMarks(bodyContainer, entries) {
  return applyMarks(bodyContainer, entries, MARK_ATTRIBUTES.highlight);
}

function unwrapMarks(bodyContainer, selector = MARK_SELECTOR) {
  bodyContainer.querySelectorAll(selector).forEach((mark) => {
    const parent = mark.parentNode;
    mark.replaceWith(...mark.childNodes);
    parent?.normalize();
  });
}

export function resetNoteMarks(bodyContainer, entries) {
  unwrapMarks(bodyContainer, '[data-note-mark]');
  return applyNoteMarks(bodyContainer, entries);
}

function resetAllMarks(bodyContainer, entries, highlights) {
  unwrapMarks(bodyContainer);
  // An annotation is the stronger semantic mark. If the same passage has both
  // states, its blue/white rendering still communicates the highlight while the
  // note panel retains the annotation topic.
  const appliedNotes = applyNoteMarks(bodyContainer, entries);
  const appliedHighlights = applyHighlightMarks(bodyContainer, highlights);
  return appliedNotes + appliedHighlights;
}

function renderNotesPanel(document, i18n, {
  slug,
  title,
  bodyContainer,
  onChange,
}) {
  const panel = createElement(document, 'div', { 'data-tool-panel-notes': '' });

  function refresh() {
    const entries = loadNotes(localStorage, slug);
    panel.replaceChildren();
    panel.append(
      createElement(document, 'p', { 'data-tool-panel-kicker': '' }, i18n.t('writing.notesTool')),
      createElement(document, 'h2', { 'data-tool-panel-title': '' }, i18n.t('writing.notesTitle')),
    );
    if (!entries.length) {
      panel.append(createElement(document, 'p', { 'data-tool-notes-empty': '' },
        i18n.t('writing.noNotes')));
    }
    entries.forEach((entry, index) => {
      const item = createElement(document, 'div', {
        'data-tool-note-item': '',
        'data-tool-note-type': 'annotation',
      });
      item.append(
        createElement(document, 'span', { 'data-tool-note-kind': '' }, i18n.t('writing.annotate')),
        createElement(document, 'blockquote', { 'data-tool-note-quote': '' }, entry.quote),
      );
      const noteInput = createElement(document, 'textarea', {
        'data-tool-note-text': '',
        placeholder: i18n.t('writing.notePlaceholder'),
        rows: '3',
      }, entry.note ?? '');
      noteInput.addEventListener('input', () => {
        updateNote(localStorage, slug, index, noteInput.value);
      });
      const removeButton = createElement(document, 'button', {
        type: 'button',
        'data-tool-note-remove': '',
      }, i18n.t('writing.deleteNote'));
      removeButton.addEventListener('click', () => {
        removeNote(localStorage, slug, index);
        resetNoteMarks(bodyContainer, loadNotes(localStorage, slug));
        refresh();
        onChange(loadNotes(localStorage, slug).length);
      });
      item.append(noteInput, removeButton);
      panel.append(item);
    });
    if (entries.length) {
      const exportButton = createElement(document, 'button', {
        type: 'button',
        'data-tool-notes-export': '',
      }, i18n.t('writing.exportNotes'));
      exportButton.addEventListener('click', () => {
        downloadMarkdown(document, `notes-on-${slug}.md`, renderNotesMarkdown({
          title, slug, entries: loadNotes(localStorage, slug),
        }));
      });
      panel.append(exportButton);
    }
  }

  refresh();
  return panel;
}

async function copyText(document, text) {
  const navigatorRef = document.defaultView?.navigator;
  if (navigatorRef?.clipboard?.writeText) {
    try {
      await navigatorRef.clipboard.writeText(text);
      return true;
    } catch {
      // Try the legacy path below for non-secure local pages and older browsers.
    }
  }
  const fallback = createElement(document, 'textarea', {
    'aria-hidden': 'true',
  }, text);
  fallback.style.position = 'fixed';
  fallback.style.opacity = '0';
  fallback.style.pointerEvents = 'none';
  document.body.append(fallback);
  fallback.select();
  let copied = false;
  try {
    copied = Boolean(document.execCommand?.('copy'));
  } catch {
    copied = false;
  }
  fallback.remove();
  if (!copied) throw new Error('Clipboard is unavailable');
  return true;
}

function renderSharePanel(document, i18n, title) {
  const panel = createElement(document, 'div', { 'data-tool-panel-share': '' });
  const url = window.location.href;
  panel.append(
    createElement(document, 'p', { 'data-tool-panel-kicker': '' }, i18n.t('writing.share')),
    createElement(document, 'h2', { 'data-tool-panel-title': '' }, i18n.t('writing.shareTitle')),
    createElement(document, 'p', { 'data-tool-panel-description': '' }, i18n.t('writing.shareDescription')),
  );
  panel.append(createElement(document, 'input', {
    type: 'text',
    readonly: '',
    value: url,
    'data-tool-share-url': '',
    'aria-label': i18n.t('writing.share'),
  }));
  const copyButton = createElement(document, 'button', {
    type: 'button',
    'data-tool-share-copy': '',
  }, i18n.t('writing.copyLink'));
  copyButton.addEventListener('click', async () => {
    try {
      await copyText(document, url);
      copyButton.textContent = i18n.t('writing.copied');
    } catch {
      copyButton.textContent = i18n.t('writing.copyFailed');
    }
  });
  const emailLink = createElement(document, 'a', {
    href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`,
    'data-tool-share-email': '',
  }, i18n.t('writing.email'));
  panel.append(copyButton, emailLink);
  return panel;
}

function renderTimelineRail(document, i18n, sections) {
  const rail = createElement(document, 'nav', {
    'data-article-timeline': '',
    'aria-label': i18n.t('writing.timeline'),
  });
  const caption = createElement(document, 'span', {
    'data-tool-timeline-caption': '',
    'aria-hidden': 'true',
  }, i18n.t('writing.timeline'));
  const track = createElement(document, 'div', {
    'data-tool-timeline-track': '',
    'data-tool-timeline-total': String(sections.length),
  });
  const items = [];

  const setActive = (targetId) => {
    items.forEach((item) => {
      item.toggleAttribute('aria-current', item.dataset.toolTimelineTarget === targetId);
    });
  };

  sections.forEach((section, index) => {
    const kindLabel = section.kind === 'heading'
      ? i18n.t('writing.timelineHeading')
      : i18n.t('writing.timelineParagraph');
    const button = createElement(document, 'button', {
      type: 'button',
      'data-tool-timeline-item': '',
      'data-tool-timeline-index': String(index),
      'data-tool-timeline-kind': section.kind,
      'data-tool-timeline-target': section.id,
      'aria-label': `${kindLabel} ${String(index + 1).padStart(2, '0')} / ${section.title}`,
      title: section.title,
    });
    const position = sections.length === 1 ? 50 : (index / (sections.length - 1)) * 100;
    button.style.setProperty('--timeline-position', `${position}%`);
    button.append(createElement(document, 'span', {
      'data-tool-timeline-label': '',
      'aria-hidden': 'true',
    }, `${String(index + 1).padStart(2, '0')} / ${section.title}`));
    button.addEventListener('click', () => {
      document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActive(section.id);
    });
    items.push(button);
    track.append(button);
  });

  setActive(sections[0]?.id);
  rail.append(caption, track);
  const windowRef = document.defaultView;
  const observer = windowRef?.IntersectionObserver
    ? new windowRef.IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((left, right) => left.boundingClientRect.top - right.boundingClientRect.top)[0];
      if (visible) setActive(visible.target.id);
    }, { rootMargin: '-18% 0px -70% 0px', threshold: [0, 0.1] })
    : null;
  sections.forEach((section) => {
    const target = document.getElementById(section.id);
    if (target) observer?.observe(target);
  });

  return {
    element: rail,
    dispose() {
      observer?.disconnect();
    },
  };
}

function selectionInsideBody(document, bodyContainer) {
  const selection = document.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null;
  const range = selection.getRangeAt(0);
  if (!bodyContainer.contains(range.startContainer)
    || !bodyContainer.contains(range.endContainer)) return null;
  const text = String(selection.toString()).trim();
  if (!text) return null;
  return {
    text,
    range: range.cloneRange(),
    rect: range.getBoundingClientRect(),
  };
}

export function renderArticleTools({ document, i18n, article, body, bodyContainer }) {
  const sections = sectionsFromBody(body);
  const root = createElement(document, 'div', { 'data-article-tools': '' });
  const timelineRail = sections.length ? renderTimelineRail(document, i18n, sections) : null;
  const dock = createElement(document, 'div', {
    'data-article-tools-dock': '',
    role: 'toolbar',
    'aria-label': i18n.t('writing.notesTool'),
  });
  const panelHost = createElement(document, 'aside', {
    'data-article-tools-panel': '',
    'aria-modal': 'false',
    hidden: '',
    role: 'dialog',
  });
  const selectionMenu = createElement(document, 'div', {
    'data-tool-selection': '',
    role: 'toolbar',
    'aria-label': i18n.t('writing.selectionTools'),
    hidden: '',
  });
  let activeTool = null;
  let notesCount = 0;
  let notesButton = null;
  let pendingSelection = null;
  let copyFeedbackTimer = null;

  const notesButtonLabel = () => `${i18n.t('writing.notesTool')}${notesCount ? ` [${notesCount}]` : ''}`;

  function closePanel() {
    activeTool = null;
    panelHost.hidden = true;
    panelHost.removeAttribute('data-tool-active');
    panelHost.replaceChildren();
    dock.querySelectorAll('[data-tool-open]').forEach((button) => {
      button.setAttribute('aria-expanded', 'false');
    });
  }

  function openTool(tool, button) {
    if (activeTool === tool) {
      closePanel();
      return;
    }
    activeTool = tool;
    panelHost.replaceChildren();
    panelHost.setAttribute('data-tool-active', tool);
    panelHost.setAttribute('aria-label', i18n.t(
      tool === 'share' ? 'writing.share' : 'writing.notesTool',
    ));
    panelHost.hidden = false;
    dock.querySelectorAll('[data-tool-open]').forEach((entry) => {
      entry.setAttribute('aria-expanded', String(entry === button));
    });
    const closeButton = createElement(document, 'button', {
      type: 'button',
      'data-tool-close': '',
      'aria-label': i18n.t('writing.closeTool'),
    }, '\u2715');
    closeButton.addEventListener('click', closePanel);
    panelHost.append(closeButton);
    if (tool === 'share') {
      panelHost.append(renderSharePanel(document, i18n, article.title.en));
    } else if (tool === 'notes') {
      panelHost.append(renderNotesPanel(document, i18n, {
        slug: article.slug,
        title: article.title.en,
        bodyContainer,
        onChange: (count) => {
          notesCount = count;
          notesButton.textContent = notesButtonLabel();
        },
      }));
    }
  }

  [['notes', i18n.t('writing.notesTool')], ['share', i18n.t('writing.share')]].forEach(([tool, label]) => {
    const button = createElement(document, 'button', {
      type: 'button',
      'data-tool-open': tool,
      'aria-expanded': 'false',
    }, label);
    if (tool === 'notes') notesButton = button;
    button.addEventListener('click', () => openTool(tool, button));
    dock.append(button);
  });

  const selectionActions = [
    ['annotate', i18n.t('writing.annotate')],
    ['highlight', i18n.t('writing.highlight')],
    ['copy', i18n.t('writing.copySelection')],
  ];
  selectionActions.forEach(([action, label], index) => {
    if (index) selectionMenu.append(createElement(document, 'span', {
      'data-tool-selection-divider': '',
      'aria-hidden': 'true',
    }, '/'));
    const button = createElement(document, 'button', {
      type: 'button',
      'data-tool-selection-action': action,
      'data-tool-selection-label': label,
      'aria-label': label,
    }, label);
    button.addEventListener('click', async () => {
      const selected = pendingSelection;
      if (!selected) return;

      if (action === 'annotate') {
        addAnnotation(localStorage, article.slug, selected.text);
        resetAllMarks(bodyContainer, loadNotes(localStorage, article.slug),
          loadHighlights(localStorage, article.slug));
        notesCount = loadNotes(localStorage, article.slug).length;
        notesButton.textContent = notesButtonLabel();
        hideSelectionMenu();
        openTool('notes', notesButton);
        panelHost.querySelector('[data-tool-note-text]')?.focus();
        return;
      }

      if (action === 'highlight') {
        const highlights = loadHighlights(localStorage, article.slug);
        const alreadyHighlighted = highlights.some((entry) => entry.quote === selected.text);
        if (alreadyHighlighted) {
          removeHighlight(localStorage, article.slug, selected.text);
        } else {
          addHighlight(localStorage, article.slug, selected.text);
        }
        resetAllMarks(bodyContainer, loadNotes(localStorage, article.slug),
          loadHighlights(localStorage, article.slug));
        hideSelectionMenu();
        return;
      }

      try {
        await copyText(document, selected.text);
        button.textContent = i18n.t('writing.copied');
      } catch {
        button.textContent = i18n.t('writing.copyFailed');
      }
      pendingSelection = null;
      clearTimeout(copyFeedbackTimer);
      copyFeedbackTimer = setTimeout(() => hideSelectionMenu(), 900);
    });
    selectionMenu.append(button);
  });

  function hideSelectionMenu() {
    selectionMenu.hidden = true;
    pendingSelection = null;
    selectionMenu.querySelectorAll('[data-tool-selection-action]').forEach((button) => {
      button.textContent = button.getAttribute('data-tool-selection-label');
    });
  }

  function showSelectionMenu(selected) {
    pendingSelection = selected;
    selectionMenu.hidden = false;
    const menuRect = selectionMenu.getBoundingClientRect();
    const horizontalPadding = 8;
    const left = Math.min(
      Math.max(horizontalPadding, selected.rect.left + (selected.rect.width - menuRect.width) / 2),
      Math.max(horizontalPadding, window.innerWidth - menuRect.width - horizontalPadding),
    );
    const above = selected.rect.top - menuRect.height - 8;
    const top = above >= horizontalPadding
      ? above
      : Math.min(window.innerHeight - menuRect.height - horizontalPadding, selected.rect.bottom + 8);
    selectionMenu.style.left = `${left}px`;
    selectionMenu.style.top = `${Math.max(horizontalPadding, top)}px`;
    const isHighlighted = loadHighlights(localStorage, article.slug)
      .some((entry) => entry.quote === selected.text);
    selectionMenu.querySelector('[data-tool-selection-action="highlight"]')
      ?.setAttribute('aria-pressed', String(isHighlighted));
  }

  const onSelectionChange = () => {
    const selected = selectionInsideBody(document, bodyContainer);
    if (selected) {
      showSelectionMenu(selected);
    } else if (!selectionMenu.matches(':hover')) {
      hideSelectionMenu();
    }
  };

  const onDocumentMouseDown = (event) => {
    if (!selectionMenu.contains(event.target)) hideSelectionMenu();
  };

  // Prevent the menu click from stealing the browser selection before the
  // action handler reads its cloned Range.
  selectionMenu.addEventListener('mousedown', (event) => {
    if (event.target.closest('button')) event.preventDefault();
  });
  document.addEventListener('selectionchange', onSelectionChange);
  document.addEventListener('mousedown', onDocumentMouseDown);

  notesCount = loadNotes(localStorage, article.slug).length;
  notesButton.textContent = notesButtonLabel();
  resetAllMarks(bodyContainer, loadNotes(localStorage, article.slug),
    loadHighlights(localStorage, article.slug));

  if (timelineRail) root.append(timelineRail.element);
  root.append(dock, panelHost, selectionMenu);

  return {
    element: root,
    dispose() {
      document.removeEventListener('selectionchange', onSelectionChange);
      document.removeEventListener('mousedown', onDocumentMouseDown);
      clearTimeout(copyFeedbackTimer);
      timelineRail?.dispose();
      closePanel();
      hideSelectionMenu();
    },
  };
}
