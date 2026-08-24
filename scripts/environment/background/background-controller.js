import { DESKTOP_BACKGROUND } from './background-assets.js';
import { createWallpaperManager } from './wallpaper-manager.js';

export function createDesktopBackground({
  document,
  asset = DESKTOP_BACKGROUND,
  initialWallpaperId = asset.id,
  storage,
  transitionMs,
  registry,
}) {
  return createWallpaperManager({
    document,
    initialId: initialWallpaperId,
    storage,
    transitionMs,
    registry,
  });
}
