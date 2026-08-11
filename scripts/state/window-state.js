const TITLE_BAR_REACH = 32;
const LEFT_TITLE_BAR_REACH = TITLE_BAR_REACH * 3;
const RIGHT_TITLE_BAR_REACH = TITLE_BAR_REACH * 2;
const CASCADE_STEP = 24;

export function createWindowState() {
  return { windows: [], activeId: null, nextZ: 1, cascade: 0 };
}

function copyState(state, overrides = {}) {
  return {
    ...state,
    windows: state.windows.slice(),
    ...overrides,
  };
}

function topVisibleId(windows) {
  return windows
    .filter(({ status }) => status === 'normal')
    .reduce((top, window) => (!top || window.z > top.z ? window : top), null)?.appId ?? null;
}

export function clampGeometry(geometry, bounds) {
  const minimumX = bounds.x - geometry.width + LEFT_TITLE_BAR_REACH;
  const maximumX = bounds.width - RIGHT_TITLE_BAR_REACH;
  const minimumY = bounds.y;
  const maximumY = bounds.height - TITLE_BAR_REACH;

  return {
    ...geometry,
    x: Math.min(maximumX, Math.max(minimumX, geometry.x)),
    y: Math.min(maximumY, Math.max(minimumY, geometry.y)),
  };
}

export function focusWindow(state, appId) {
  const target = state.windows.find((window) => window.appId === appId);
  if (!target || target.status === 'minimized') return copyState(state);

  return copyState(state, {
    windows: state.windows.map((window) => (
      window.appId === appId ? { ...window, z: state.nextZ } : window
    )),
    activeId: appId,
    nextZ: state.nextZ + 1,
  });
}

export function restoreWindow(state, appId) {
  const target = state.windows.find((window) => window.appId === appId);
  if (!target) return copyState(state);

  return copyState(state, {
    windows: state.windows.map((window) => (
      window.appId === appId
        ? { ...window, status: 'normal', z: state.nextZ }
        : window
    )),
    activeId: appId,
    nextZ: state.nextZ + 1,
  });
}

export function openWindow(state, app, bounds) {
  const existing = state.windows.find((window) => window.appId === app.id);
  if (existing) {
    return existing.status === 'minimized'
      ? restoreWindow(state, app.id)
      : focusWindow(state, app.id);
  }

  const geometry = clampGeometry({
    x: (bounds.x + bounds.width - app.defaultSize.width) / 2 + state.cascade,
    y: (bounds.y + bounds.height - app.defaultSize.height) / 2 + state.cascade,
    width: app.defaultSize.width,
    height: app.defaultSize.height,
  }, bounds);
  const window = {
    appId: app.id,
    ...geometry,
    z: state.nextZ,
    status: 'normal',
  };

  return copyState(state, {
    windows: [...state.windows, window],
    activeId: app.id,
    nextZ: state.nextZ + 1,
    cascade: state.cascade + CASCADE_STEP,
  });
}

export function minimizeWindow(state, appId) {
  const target = state.windows.find((window) => window.appId === appId);
  if (!target) return copyState(state);

  const windows = state.windows.map((window) => (
    window.appId === appId ? { ...window, status: 'minimized' } : window
  ));
  return copyState(state, {
    windows,
    activeId: state.activeId === appId ? topVisibleId(windows) : state.activeId,
  });
}

export function closeWindow(state, appId) {
  if (!state.windows.some((window) => window.appId === appId)) return copyState(state);

  const windows = state.windows.filter((window) => window.appId !== appId);
  return copyState(state, {
    windows,
    activeId: state.activeId === appId ? topVisibleId(windows) : state.activeId,
  });
}

export function moveWindow(state, appId, position, bounds) {
  if (!state.windows.some((window) => window.appId === appId)) return copyState(state);

  return copyState(state, {
    windows: state.windows.map((window) => (
      window.appId === appId
        ? { ...window, ...clampGeometry({ ...window, ...position }, bounds) }
        : window
    )),
  });
}
