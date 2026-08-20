function createElement(document, tagName, attributes = {}, text = '') {
  const element = document.createElement(tagName);
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
  element.textContent = text;
  return element;
}

function localizedText(value, locale, fallback) {
  return value?.[locale] ?? value?.en ?? fallback;
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
  let selectedId = null;
  let activeId = currentId;
  let applyStatus = 'idle';

  const getWallpaper = () => wallpapers.find((wallpaper) => wallpaper.id === selectedId) ?? null;
  const isCurrent = (wallpaper) => wallpaper.id === activeId;

  const renderCurrentBadge = (wallpaper) => {
    if (!isCurrent(wallpaper)) return null;
    return createElement(document, 'span', { 'data-wallpaper-current-badge': '' }, i18n.t('photos.wallpapers.current'));
  };

  const openDetail = (id) => {
    if (!wallpapers.some((wallpaper) => wallpaper.id === id)) return;
    selectedId = id;
    applyStatus = 'idle';
    render();
    root.querySelector('[data-wallpaper-apply]')?.focus({ preventScroll: true });
  };

  const showGrid = () => {
    selectedId = null;
    applyStatus = 'idle';
    render();
  };

  const renderGrid = () => {
    const grid = createElement(document, 'div', {
      'data-wallpaper-grid': '',
      role: 'list',
      'aria-label': i18n.t('photos.wallpapers'),
    });

    wallpapers.forEach((wallpaper) => {
      const title = localizedText(wallpaper.title, i18n.locale, wallpaper.id);
      const card = createElement(document, 'button', {
        type: 'button',
        'data-wallpaper-card': wallpaper.id,
        'data-wallpaper-current': String(isCurrent(wallpaper)),
        'aria-label': title,
      });
      const preview = createElement(document, 'img', {
        src: wallpaper.previewSrc,
        alt: '',
      });
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
    return grid;
  };

  const applySelectedWallpaper = async () => {
    const wallpaper = getWallpaper();
    if (!wallpaper || applyStatus === 'applying') return;
    applyStatus = 'applying';
    render();

    try {
      const result = await applyWallpaper(wallpaper.id);
      if (result?.ok === true) {
        activeId = wallpaper.id;
        applyStatus = 'success';
      } else {
        applyStatus = 'error';
      }
    } catch {
      applyStatus = 'error';
    }
    render();
  };

  const renderDetail = () => {
    const wallpaper = getWallpaper();
    if (!wallpaper) return renderGrid();
    const title = localizedText(wallpaper.title, i18n.locale, wallpaper.id);
    const description = localizedText(wallpaper.description, i18n.locale, '');
    const detail = createElement(document, 'section', {
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
    const status = createElement(document, 'p', {
      'data-wallpaper-apply-status': applyStatus,
      'aria-live': 'polite',
    }, i18n.t(`photos.wallpapers.${applyStatus}`));
    const apply = createElement(document, 'button', {
      type: 'button',
      'data-wallpaper-apply': '',
    }, i18n.t('photos.wallpapers.apply'));
    if (applyStatus === 'applying') apply.disabled = true;
    apply.addEventListener('click', applySelectedWallpaper);

    detail.append(back, preview, heading, copy);
    const badge = renderCurrentBadge(wallpaper);
    if (badge) detail.append(badge);
    detail.append(apply, status);
    return detail;
  };

  const render = () => {
    root.dataset.wallpaperView = selectedId ? 'detail' : 'grid';
    root.replaceChildren(selectedId ? renderDetail() : renderGrid());
  };

  render();
  i18n.subscribe(() => {
    if (root.isConnected) render();
  });
  return root;
}
