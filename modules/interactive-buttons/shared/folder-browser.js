function createElement(document, tagName, attributes = {}, text = '') {
  const element = document.createElement(tagName);
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
  element.textContent = text;
  return element;
}

function replaceCount(template, count) {
  return template.replace('{n}', String(count));
}

function isSingleTapDevice(document) {
  const view = document.defaultView;
  return view.matchMedia('(pointer: coarse)').matches
    || view.matchMedia('(max-width: 760px)').matches;
}

function focusSelectedItem(root, selectedId) {
  const item = [...root.querySelectorAll('[data-folder-item]')]
    .find((candidate) => candidate.dataset.folderItem === selectedId);
  item?.focus({ preventScroll: true });
}

function observeDisconnect(document, root, cleanup) {
  const observer = new document.defaultView.MutationObserver(() => {
    if (!root.isConnected) cleanup();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  return () => observer.disconnect();
}

/**
 * Shared two-state collection shell for photos, records, games, and books.
 * The OS window remains outside this node; this module only owns the
 * folder -> viewer route and the item activation policy.
 */
export function createFolderBrowser({
  document,
  i18n,
  appId,
  titleKey,
  items,
  initialItemId = items[0]?.slug ?? null,
  renderItem,
  renderViewer,
  renderEmpty = null,
  emptyKey = 'folders.empty',
  doubleClickThreshold = 400,
  onBeforeBack = () => {},
  onSelectionChange = () => {},
}) {
  const resolveItems = () => (typeof items === 'function' ? items() : items);
  let itemList = resolveItems();
  const root = createElement(document, 'section', {
    'data-folder-browser': '',
    'data-content-container': appId,
    'data-content-view': 'folder',
    'data-content-status': itemList.length ? 'ready' : 'empty',
    tabindex: '-1',
  });
  let view = 'folder';
  let selectedId = itemList.some((item) => item.slug === initialItemId)
    ? initialItemId
    : itemList[0]?.slug ?? null;
  let pendingOpen = false;
  let lastItemClick = null;

  const getItem = () => itemList.find((item) => item.slug === selectedId) ?? null;
  const setSelection = (slug) => {
    if (!itemList.some((item) => item.slug === slug)) return;
    selectedId = slug;
    onSelectionChange(slug);
    root.querySelectorAll('[data-folder-item]').forEach((item) => {
      const selected = item.dataset.folderItem === selectedId;
      item.dataset.selected = String(selected);
      item.setAttribute('aria-current', String(selected));
    });
  };

  const navigate = (direction) => {
    if (!itemList.length) return;
    const index = Math.max(0, itemList.findIndex((item) => item.slug === selectedId));
    selectedId = itemList[(index + direction + itemList.length) % itemList.length].slug;
    onSelectionChange(selectedId);
    pendingOpen = true;
    render();
  };

  const openItem = (slug) => {
    if (!itemList.some((item) => item.slug === slug)) return;
    lastItemClick = null;
    setSelection(slug);
    pendingOpen = true;
    view = 'viewer';
    render();
  };

  const goBack = () => {
    if (view !== 'viewer') return;
    onBeforeBack(getItem());
    pendingOpen = false;
    view = 'folder';
    render();
    queueMicrotask(() => focusSelectedItem(root, selectedId));
  };

  const renderHeader = () => {
    const header = createElement(document, 'header', { 'data-folder-header': '' });
    const heading = createElement(document, 'div', { 'data-folder-heading': '' });
    heading.append(
      createElement(document, 'p', { 'data-folder-kicker': '' }, i18n.t('folders.folder')),
      createElement(document, 'h3', { 'data-folder-title': '' }, i18n.t(titleKey)),
      createElement(document, 'span', { 'data-folder-count': '' }, replaceCount(
        i18n.t('folders.items'), itemList.length,
      )),
    );
    header.append(heading);
    if (view === 'viewer') {
      const back = createElement(document, 'button', {
        type: 'button',
        'data-folder-back': '',
        'aria-label': i18n.t('folders.back'),
      }, `← ${i18n.t('nav.back')}`);
      back.addEventListener('click', goBack);
      header.append(back);
    } else {
      header.append(createElement(document, 'p', {
        'data-folder-hint': '',
      }, i18n.t(isSingleTapDevice(document) ? 'folders.tap' : 'folders.open')));
    }
    return header;
  };

  const renderFolder = () => {
    const list = createElement(document, 'div', {
      'data-folder-list': '',
      role: 'list',
      'aria-label': i18n.t(titleKey),
    });
    if (!itemList.length) {
      const empty = createElement(document, 'p', {
        'data-folder-empty': '',
        role: 'status',
      }, i18n.t(emptyKey));
      const additional = renderEmpty?.({ document, i18n, empty });
      if (additional) empty.append(...(Array.isArray(additional) ? additional : [additional]));
      list.append(empty);
      return list;
    }

    itemList.forEach((item, index) => {
      const button = createElement(document, 'button', {
        type: 'button',
        'data-folder-item': item.slug,
        'data-selected': String(item.slug === selectedId),
        'aria-current': String(item.slug === selectedId),
        'aria-label': item.accessibleTitle ?? item.title?.[i18n.locale] ?? item.slug,
      });
      const rendered = renderItem({ document, i18n, item, index });
      if (rendered) button.append(...(Array.isArray(rendered) ? rendered : [rendered]));
      button.addEventListener('click', (event) => {
        if (isSingleTapDevice(document)) {
          openItem(item.slug);
          return;
        }
        setSelection(item.slug);
        const now = performance.now();
        const withinDistance = lastItemClick
          && Math.hypot(event.clientX - lastItemClick.x, event.clientY - lastItemClick.y) <= 8;
        if (
          lastItemClick?.itemId === item.slug
          && now - lastItemClick.time <= doubleClickThreshold
          && withinDistance
        ) {
          openItem(item.slug);
          return;
        }
        lastItemClick = {
          itemId: item.slug,
          time: now,
          x: event.clientX,
          y: event.clientY,
        };
      });
      button.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          openItem(item.slug);
        }
        if (event.key === 'Escape') {
          event.preventDefault();
          goBack();
        }
      });
      list.append(button);
    });
    return list;
  };

  const render = () => {
    itemList = resolveItems();
    if (!itemList.some((item) => item.slug === selectedId)) selectedId = itemList[0]?.slug ?? null;
    root.dataset.contentStatus = itemList.length ? 'ready' : 'empty';
    root.dataset.contentView = view;
    root.dataset.folderView = view;
    root.replaceChildren(renderHeader());
    if (view === 'folder') {
      root.append(renderFolder());
      return;
    }

    const item = getItem();
    if (!item) {
      view = 'folder';
      root.dataset.contentView = view;
      root.dataset.folderView = view;
      root.append(renderFolder());
      return;
    }
    root.append(renderViewer({
      document,
      i18n,
      item,
      index: itemList.indexOf(item),
      total: itemList.length,
      back: goBack,
      previous: () => navigate(-1),
      next: () => navigate(1),
      shouldAutoplay: pendingOpen,
    }));
    pendingOpen = false;
    queueMicrotask(() => root.querySelector('[data-folder-back]')?.focus({ preventScroll: true }));
  };

  root.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && view === 'viewer') {
      event.preventDefault();
      goBack();
    }
  });

  // 3D collection renderers can use the same folder contract without
  // duplicating the desktop/mobile activation rules.
  root.selectItem = (slug) => setSelection(slug);
  root.openItem = openItem;

  let destroyed = false;
  let unsubscribeI18n = () => {};
  let stopObserving = () => {};
  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    unsubscribeI18n();
    stopObserving();
  };
  root.destroy = destroy;
  render();
  unsubscribeI18n = i18n.subscribe(() => {
    if (root.isConnected) render();
  });
  stopObserving = observeDisconnect(document, root, destroy);
  return root;
}
