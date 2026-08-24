# Media library

This folder is the single source of truth for the desktop photo wall and music players.

- `catalog.js` contains photo pixels, album covers, localized titles, dates, and track metadata. Raster album covers live in `covers/` and are referenced by their catalog entry.
- `music/` contains the audio files used by both the desktop deck and the Albums app. Catalog entries may use browser-readable `.wav` or `.m4a` files; M4A playback still depends on the codec inside the container and must be verified with real playback.
- `sources/` contains source artwork used by offline media generators. It is not loaded at runtime.

Keep runtime paths in `catalog.js` relative to the repository root so the static site can serve them directly.
