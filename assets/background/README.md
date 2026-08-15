# Desktop backgrounds

This folder contains processed raster backgrounds used by the desktop environment.

- Keep source-independent, project-ready PNG or GIF assets here.
- Use a descriptive kebab-case filename, such as `railway-platform-pixel.png`.
- Register the active asset in `scripts/environment/background/background-assets.js`.
- Keep composition important to the desktop shell: the image is displayed full-bleed with `object-fit: cover` and UI quiet zones are handled by the surrounding layout.
