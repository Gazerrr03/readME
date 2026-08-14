# System Model — Evidence Index

Evidence for the current-state architecture model of **portfolio-blogs (two-am-portfolio-os)**.
Canonical model: [`architecture-model.json`](architecture-model.json).
Modeled with the `system-modeler` scenario skill; sources shaped with `c4model` + `graphviz` foundation skills.

## Evidence coverage

| Node / Edge group | Evidence sources | Confidence |
| --- | --- | --- |
| App shell + styles | `index.html` (roots, templates, 10 CSS links), `styles/tokens.css` | high |
| Composition root wiring | `scripts/main.js` (17 imports, controller factories, `?open=` handling, `skipBoot` test hook) | high |
| Boot sequence | `scripts/boot.js` (BOOT_STEPS, `preferences.bootComplete`, reduced-motion branch) | high |
| Desktop kernel | `scripts/desktop.js` (mode detection, bot sprite, folders via `apps/desktop-folders.js`) | high |
| Window lifecycle | `scripts/window-manager.js` + `scripts/state/window-state.js` (pure geometry/state helpers) | high |
| App registry | `scripts/apps/app-registry.js` (frozen 7-app registry, `getApps()`/`getApp()`) | high |
| App renderers | `scripts/apps/*` import graph (see below) | high |
| Environment | `scripts/environment/*` (controller/renderer/state/music-deck/jacket-map) | high |
| i18n | `scripts/i18n/i18n.js`, `scripts/i18n/dictionaries.js` (en/zh-CN/ja) | high |
| Content data | `scripts/data/content.js` (projects, articles, about, channels, `L()` localization) | high |
| Media catalog | `media/catalog.js` (tracks with pixel covers, photos), `media/music/*.wav` | high |
| Routing | `scripts/routing/content-routes.js` (kind/slug validation, `contentPath`, `desktopPath`, `readDesktopTarget`) | high |
| Preferences | `scripts/state/preferences.js` (versioned schema v1, field validation, locale resolution) | high |
| Audio | `scripts/audio.js` (WebAudio cues: boot/click/window/notice) | high |
| Content pages | `scripts/pages/content-page.js` (dispatcher by `data-content-kind`), `article-page.js`, `project-page.js` | high |
| Static generator | `scripts/generate-content-pages.mjs` (render, manifest, `--check`), `content-pages.manifest.json` (14 pages) | high |
| three.js vendor | `vendor/three.module.min.js`, dynamic `import(THREE_URL)` in `scripts/apps/wireframe-preview.js` | high |
| Tests | `tests/unit/*.test.js` (11 files), `tests/e2e/*.spec.js` (9 files), `package.json` scripts | high |
| Hosting | `README.md` (GitHub Pages, static server instructions) | high |

## App renderer import evidence

| Renderer | Imports | Applies to |
| --- | --- | --- |
| `about-app.js` | `data/content.js` (about, pick) | About |
| `contact-app.js` | `data/content.js` (channels) | Contact |
| `projects-app.js` | `data/content.js`, `routing/content-routes.js`, `wireframe-preview.js` | Projects |
| `writing-app.js` | `data/content.js`, `routing/content-routes.js` | Writing |
| `settings-app.js` | none (pure renderer; receives context from `main.js`) | Settings |
| `photos-app.js` | `media/catalog.js`, `data/content.js`, `pixel-art.js` | Photos |
| `albums-app.js` | `media/catalog.js`, `data/content.js`, `pixel-art.js`, `environment/music-deck.js` | Albums |
| `desktop-folders.js` | `media/catalog.js`, `data/content.js`, `pixel-art.js` | Desktop folders |

## Known unknowns and validation gaps

- **Runtime topology** is not evidenced beyond the browser: no CI/CD config, deployment workflow, or analytics are present in the repo. The GitHub Pages assumption comes from `README.md` only.
- **`settings-app.js`** has no imports and receives all context through `main.js`; its internal preference wiring is evidenced at `main.js:68-74` and `main.js:77-84`.
- **Wireframe rendering** depends on three.js at runtime; the vendored file exists, but the dynamic import path and failure behavior were not executed in this pass (static evidence only).
- **Content page generation output** was verified against `content-pages.manifest.json` (9 writing + 5 projects = 14 pages) and `npm run check:pages`-compatible code paths, but no fresh generation run was performed during modeling.

## Artifacts produced

| Artifact | Purpose |
| --- | --- |
| `architecture-model.json` | Canonical node/edge/evidence model (25 nodes, 36 edges) |
| `system-context.structurizr.dsl` | C4 system-context + container views (open in Qoder DSL canvas viewer) |
| `module-dependencies.dot` | Dense module dependency graph (open in Qoder DOT canvas viewer) |
| `module-dependencies.svg` | Derived SVG export of the DOT graph (regenerate via any Graphviz renderer) |
| `system-model.summary.md` | Human-readable architecture explanation and reading order |

## Skill transparency

- Scenario skill: `system-modeler`
- Foundation skills: `c4model` (DSL), `graphviz` (DOT)
- Router: `explore` (not needed here; scenario was explicit)
