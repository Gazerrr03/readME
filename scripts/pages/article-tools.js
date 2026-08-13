import {
  addNote,
  loadNotes,
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

export function sectionsFromBody(body) {
  const sections = [];
  body.forEach((item, itemIndex) => {
    if (item && item.h) sections.push({ id: `section-${itemIndex}`, title: item.h });
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

function wrapQuoteInElement(element, quote) {
  const walker = element.ownerDocument.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (node.parentElement?.closest('[data-note-mark]')) continue;
    const position = node.data.indexOf(quote);
    if (position === -1) continue;
    const range = element.ownerDocument.createRange();
    range.setStart(node, position);
    range.setEnd(node, position + quote.length);
    const mark = element.ownerDocument.createElement('mark');
    mark.setAttribute('data-note-mark', '');
    range.surroundContents(mark);
    return true;
  }
  return false;
}

export function applyNoteMarks(bodyContainer, entries) {
  const candidates = bodyContainer.querySelectorAll('p, blockquote');
  let applied = 0;
  entries.forEach((entry) => {
    for (const candidate of candidates) {
      if (!candidate.textContent.includes(entry.quote)) continue;
      if (wrapQuoteInElement(candidate, entry.quote)) {
        applied += 1;
        break;
      }
    }
  });
  return applied;
}

export function resetNoteMarks(bodyContainer, entries) {
  bodyContainer.querySelectorAll('[data-note-mark]').forEach((mark) => {
    const parent = mark.parentNode;
    mark.replaceWith(...mark.childNodes);
    parent?.normalize();
  });
  return applyNoteMarks(bodyContainer, entries);
}

function renderNotesPanel(document, i18n, { slug, title, bodyContainer, onChange }) {
  const panel = createElement(document, 'div', { 'data-tool-panel-notes': '' });

  function refresh() {
    const entries = loadNotes(localStorage, slug);
    panel.replaceChildren();
    if (!entries.length) {
      panel.append(createElement(document, 'p', { 'data-tool-notes-empty': '' },
        i18n.t('writing.noNotes')));
    }
    entries.forEach((entry, index) => {
      const item = createElement(document, 'div', { 'data-tool-note-item': '' });
      item.append(createElement(document, 'blockquote', { 'data-tool-note-quote': '' },
        entry.quote));
      const noteInput = createElement(document, 'textarea', {
        'data-tool-note-text': '',
        placeholder: i18n.t('writing.notePlaceholder'),
        rows: '2',
      }, entry.note ?? '');
      noteInput.addEventListener('change', () => {
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

function renderSharePanel(document, i18n, title) {
  const panel = createElement(document, 'div', { 'data-tool-panel-share': '' });
  const url = window.location.href;
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
      await navigator.clipboard.writeText(url);
      copyButton.textContent = i18n.t('writing.copied');
    } catch {
      copyButton.textContent = url;
    }
  });
  const emailLink = createElement(document, 'a', {
    href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`,
    'data-tool-share-email': '',
  }, i18n.t('writing.email'));
  panel.append(copyButton, emailLink);
  return panel;
}

function renderTimelinePanel(document, i18n, sections) {
  const panel = createElement(document, 'div', { 'data-tool-panel-timeline': '' });
  sections.forEach((section, index) => {
    const button = createElement(document, 'button', {
      type: 'button',
      'data-tool-timeline-item': '',
    }, `${String(index + 1).padStart(2, '0')} / ${section.title}`);
    button.addEventListener('click', () => {
      document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    panel.append(button);
  });
  panel.setAttribute('aria-label', i18n.t('writing.timeline'));
  return panel;
}

export function renderArticleTools({ document, i18n, article, body, bodyContainer }) {
  const sections = sectionsFromBody(body);
  const root = createElement(document, 'div', { 'data-article-tools': '' });
  const dock = createElement(document, 'div', { 'data-article-tools-dock': '' });
  const panelHost = createElement(document, 'div', { 'data-article-tools-panel': '', hidden: '' });
  let activeTool = null;
  let notesCount = 0;

  const notesButtonLabel = () => `${i18n.t('writing.notesTool')}${notesCount ? ` [${notesCount}]` : ''}`;

  function closePanel() {
    activeTool = null;
    panelHost.hidden = true;
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
    panelHost.hidden = false;
    dock.querySelectorAll('[data-tool-open]').forEach((entry) => {
      entry.setAttribute('aria-expanded', String(entry === button));
    });
    if (tool === 'timeline') {
      panelHost.append(renderTimelinePanel(document, i18n, sections));
    } else if (tool === 'share') {
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
    const closeButton = createElement(document, 'button', {
      type: 'button',
      'data-tool-close': '',
      'aria-label': i18n.t('writing.closeTool'),
    }, '\u2715');
    closeButton.addEventListener('click', closePanel);
    panelHost.append(closeButton);
  }

  const tools = [];
  if (sections.length) {
    tools.push(['timeline', i18n.t('writing.timeline')]);
  }
  tools.push(['notes', notesButtonLabel()]);
  tools.push(['share', i18n.t('writing.share')]);

  let notesButton = null;
  tools.forEach(([tool, label]) => {
    const button = createElement(document, 'button', {
      type: 'button',
      'data-tool-open': tool,
      'aria-expanded': 'false',
    }, label);
    if (tool === 'notes') notesButton = button;
    button.addEventListener('click', () => openTool(tool, button));
    dock.append(button);
  });

  // Selection → floating highlight button
  const highlightButton = createElement(document, 'button', {
    type: 'button',
    'data-tool-highlight': '',
    hidden: '',
  }, i18n.t('writing.highlight'));
  let pendingQuote = '';

  function hideHighlight() {
    highlightButton.hidden = true;
    pendingQuote = '';
  }

  const onMouseUp = (event) => {
    if (event.target === highlightButton) return;
    const selection = window.getSelection();
    const text = selection ? String(selection.toString()).trim() : '';
    if (!text || !bodyContainer.contains(selection.anchorNode)) {
      hideHighlight();
      return;
    }
    pendingQuote = text;
    const rect = selection.getRangeAt(0).getBoundingClientRect();
    highlightButton.hidden = false;
    highlightButton.style.left = `${Math.max(8, rect.left)}px`;
    highlightButton.style.top = `${Math.max(8, rect.top - highlightButton.offsetHeight - 6)}px`;
  };
  document.addEventListener('mouseup', onMouseUp);

  highlightButton.addEventListener('click', () => {
    if (!pendingQuote) return;
    const entries = addNote(localStorage, article.slug, pendingQuote);
    applyNoteMarks(bodyContainer, entries.slice(-1));
    notesCount = entries.length;
    notesButton.textContent = notesButtonLabel();
    window.getSelection()?.removeAllRanges();
    hideHighlight();
    if (activeTool === 'notes') {
      closePanel();
      openTool('notes', notesButton);
    }
  });

  notesCount = loadNotes(localStorage, article.slug).length;
  notesButton.textContent = notesButtonLabel();
  applyNoteMarks(bodyContainer, loadNotes(localStorage, article.slug));

  root.append(dock, panelHost, highlightButton);

  return {
    element: root,
    dispose() {
      document.removeEventListener('mouseup', onMouseUp);
      closePanel();
      hideHighlight();
    },
  };
}
