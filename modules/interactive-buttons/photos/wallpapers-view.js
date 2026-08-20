function createElement(document, tagName, attributes = {}, text = '') {
  const element = document.createElement(tagName);
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
  element.textContent = text;
  return element;
}

function localizedText(value, locale, fallback) {
  return value?.[locale] ?? value?.en ?? fallback;
}

function observeDisconnect(document, root, cleanup) {
  const observer = new document.defaultView.MutationObserver(() => {
    if (!root.isConnected) cleanup();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  return () => observer.disconnect();
}

/**
 * Static wallpaper selection view. Wallpaper renderers remain owned by the
 * desktop manager; this view only displays the registry's safe metadata.
 */
export function createWallpapersView({
  document,
  i18n,
  wallpapers = [],
  currentId = null,
  applyWallpaper = async () => ({ ok: false }),
}) {
  const root = createElement(document, 'section', {
    'data-wallpapers-view': '',
    'data-wallpaper-view': 'grid',
  });
  const content = createElement(document, 'div', { 'data-wallpaper-content': '' });
  const status = createElement(document, 'p', {
    'data-wallpaper-apply-status': 'idle',
    'aria-live': 'polite',
  });
  root.append(content, status);

  let selectedId = null;
  let activeId = currentId;
  let pendingRequest = null;
  let requestToken = 0;
  let detail = null;
  let destroyed = false;
  let unsubscribeI18n = () => {};
  let stopObserving = () => {};

  const getWallpaper = () => wallpapers.find((wallpaper) => wallpaper.id === selectedId) ?? null;
  const isCurrent = (wallpaper) => wallpaper.id === activeId;
  const setStatus = (next) => {
    status.dataset.wallpaperApplyStatus = next;
    status.textContent = i18n.t(`photos.wallpapers.${next}`);
  };

  const renderCurrentBadge = (wallpaper) => {
    if (!isCurrent(wallpaper)) return null;
    return createElement(document, 'span', { 'data-wallpaper-current-badge': '' }, i18n.t('photos.wallpapers.current'));
  };

  const updateDetail = () => {
    if (!detail) return;
    const wallpaper = getWallpaper();
    if (!wallpaper) return;
    const applying = pendingRequest !== null;
    detail.root.dataset.wallpaperCurrent = String(isCurrent(wallpaper));
    detail.apply.disabled = applying;
    detail.back.disabled = applying;
    detail.badge.replaceChildren();
    const badge = renderCurrentBadge(wallpaper);
    if (badge) detail.badge.append(badge);
  };

  const renderGrid = (focusId = null) => {
    selectedId = null;
    detail = null;
    root.dataset.wallpaperView = 'grid';
    const grid = createElement(document, 'div', { 'data-wallpaper-grid': '' });

    wallpapers.forEach((wallpaper) => {
      const title = localizedText(wallpaper.title, i18n.locale, wallpaper.id);
      const card = createElement(document, 'button', {
        type: 'button',
        'data-wallpaper-card': wallpaper.id,
        'data-wallpaper-current': String(isCurrent(wallpaper)),
        'aria-current': String(isCurrent(wallpaper)),
      });
      const preview = createElement(document, 'img', { src: wallpaper.previewSrc, alt: '' });
      const label = createElement(document, 'span', { 'data-wallpaper-card-label': '' }, title);
      card.append(preview, label);
      const badge = renderCurrentBadge(wallpaper);
      if (badge) card.append(badge);
      card.addEventListener('click', () => openDetail(wallpaper.id));
      card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          openDetail(wallpaper.id);
        }
      });
      grid.append(card);
    });
    content.replaceChildren(grid);
    if (focusId) {
      queueMicrotask(() => root.querySelector(`[data-wallpaper-card="${focusId}"]`)?.focus({ preventScroll: true }));
    }
  };

  const showGrid = () => {
    if (pendingRequest) return;
    setStatus('idle');
    renderGrid(selectedId);
  };

  const applySelectedWallpaper = async () => {
    const wallpaper = getWallpaper();
    if (!wallpaper || pendingRequest || destroyed) return;
    const request = { id: wallpaper.id, token: ++requestToken };
    pendingRequest = request;
    setStatus('applying');
    updateDetail();

    try {
      const result = await applyWallpaper(wallpaper.id);
      if (destroyed || pendingRequest !== request || request.token !== requestToken) return;
      pendingRequest = null;
      if (result?.ok === true) {
        activeId = wallpaper.id;
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch {
      if (destroyed || pendingRequest !== request || request.token !== requestToken) return;
      pendingRequest = null;
      setStatus('error');
    }
    updateDetail();
    detail?.apply.focus({ preventScroll: true });
  };

  const openDetail = (id) => {
    if (pendingRequest || !wallpapers.some((wallpaper) => wallpaper.id === id)) return;
    selectedId = id;
    setStatus('idle');
    root.dataset.wallpaperView = 'detail';
    const wallpaper = getWallpaper();
    const title = localizedText(wallpaper.title, i18n.locale, wallpaper.id);
    const description = localizedText(wallpaper.description, i18n.locale, '');
    const panel = createElement(document, 'section', {
      'data-wallpaper-detail': wallpaper.id,
      'data-wallpaper-current': String(isCurrent(wallpaper)),
    });
    const back = createElement(document, 'button', {
      type: 'button',
      'data-wallpaper-back': '',
    }, `← ${i18n.t('photos.wallpapers.back')}`);
    back.addEventListener('click', showGrid);
    const preview = createElement(document, 'img', { src: wallpaper.previewSrc, alt: '' });
    const heading = createElement(document, 'h3', { 'data-wallpaper-title': '' }, title);
    const copy = createElement(document, 'p', { 'data-wallpaper-description': '' }, description);
    const badge = createElement(document, 'span', { 'data-wallpaper-current-slot': '' });
    const apply = createElement(document, 'button', {
      type: 'button',
      'data-wallpaper-apply': '',
    }, i18n.t('photos.wallpapers.apply'));
    apply.addEventListener('click', applySelectedWallpaper);
    panel.append(back, preview, heading, copy, badge, apply);
    content.replaceChildren(panel);
    detail = { root: panel, back, apply, badge };
    updateDetail();
    queueMicrotask(() => apply.focus({ preventScroll: true }));
  };

  const renderForLocale = () => {
    if (destroyed) return;
    const focused = document.activeElement;
    const focusApply = focused === detail?.apply;
    const focusBack = focused === detail?.back;
    if (selectedId) openDetail(selectedId);
    else renderGrid();
    if (focusApply) detail?.apply.focus({ preventScroll: true });
    if (focusBack) detail?.back.focus({ preventScroll: true });
  };

  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    requestToken += 1;
    pendingRequest = null;
    unsubscribeI18n();
    stopObserving();
  };

  root.destroy = destroy;
  renderGrid();
  unsubscribeI18n = i18n.subscribe(renderForLocale);
  stopObserving = observeDisconnect(document, root, destroy);
  return root;
}
