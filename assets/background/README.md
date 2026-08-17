# Desktop backgrounds

This folder contains processed raster sources for the desktop environment. The active background may also be a procedural shader registered by descriptor; raster files remain the source path for future PNG and GIF variations.

- Keep source-independent, project-ready PNG or GIF assets here.
- Use a descriptive kebab-case filename, such as `storm-clouds-pixel.png`.
- Register the active background in `scripts/environment/background/background-assets.js` with its `kind` (`image` or `shader`).
- Raster images are displayed full-bleed with `object-fit: cover`; shader backgrounds fill the same layer through a single canvas.
- Keep the desktop shell responsible for UI quiet zones. Do not bake menus, widgets, windows, Dock elements or Pen Pen into a background asset.
- Do not add runtime ASCII conversion, pointer ripples, particle overlays or high-frequency background distortion.
