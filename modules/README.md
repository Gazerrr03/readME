# Portfolio OS modules

This directory is the local maintenance boundary for the desktop's product
modules. The runtime shell remains in `scripts/`; module behavior, module data,
and module-owned assets live here.

## Module groups

### Base buttons

Top-level desktop entries:

- `base-buttons/design/` — the control-panel entry currently registered as `settings`.
- `base-buttons/about/` — identity, profile content, banner, and avatar asset.
- `base-buttons/projects/` — project ring and project wireframe preview.
- `base-buttons/contact/` — contact channels and contact view.
- `base-buttons/writing/` — writing archive view and article links.

### Interactive buttons

Content-container entries:

- `interactive-buttons/photos/` — photo collection and viewer.
- `interactive-buttons/albums/` — record collection, player, and viewer.
- `interactive-buttons/games/` — mounted game collection and viewer placeholder.
- `interactive-buttons/books/` — book collection, bookshelf, and viewer.
- `interactive-buttons/shared/` — the common folder-to-viewer shell, launcher, and pixel-art helpers.

## Maintenance rules

- Keep the desktop shell, window manager, i18n runtime, and routing under `scripts/`.
- Keep a module's renderer, module-specific data, and module-specific assets next to that module.
- Shared catalogs remain explicit: media stays in `media/`, while project and article catalogs stay in `scripts/data/content.js` because generated pages and the environment also consume them.
- Keep the shared visual contract in `styles/apps.css`; moving source ownership does not create one-off visual languages for individual buttons.
