# Portfolio OS — Current-State Architecture Summary

**Scope**: repository root of `portfolio-blogs` (package `two-am-portfolio-os`).
**Question answered**: what is this system and what are its main parts, boundaries, and relationships today?
**Evidence**: all claims trace to files listed in [`system-model.evidence.md`](system-model.evidence.md); canonical model in [`architecture-model.json`](architecture-model.json).

## System boundary

Portfolio OS is a **framework-free, build-free static web application**: plain HTML + ES modules + CSS, with one Node script that pre-renders shareable content pages. It has no server, no bundler, no package runtime dependency beyond Playwright for tests. The entire "operating system" runs in the browser tab; GitHub Pages hosts the repository root.

Two runtime surfaces exist side by side:

1. **Desktop simulation** — `index.html` + `scripts/main.js` composition root, presenting a two A.M. themed, blue-and-white 1-bit desktop with windows, boot sequence, environment terrain, and music deck.
2. **Generated content pages** — pre-rendered `writing/<slug>/index.html` and `projects/<slug>/index.html` (14 pages), produced by the Node static generator, sharing the desktop's i18n, routing, preferences, and content data.

## Key components (L2 container level)

| Container | Responsibility | Evidence |
| --- | --- | --- |
| App Shell | Entry, CSS token layers, icon templates | `index.html`, `styles/*` (10 files) |
| Desktop Kernel | Composition root, boot, desktop surface, window manager, registry | `scripts/main.js`, `boot.js`, `desktop.js`, `window-manager.js`, `apps/app-registry.js` |
| App Modules | 9 app renderers + interactive container shell + shared helpers | `modules/*` |
| Environment Renderer | Canvas 2D ASCII terrain, music deck, jacket map | `scripts/environment/*` |
| Content Pages | Standalone article/project readers | `scripts/pages/*` |
| Static Generator | Pre-renders pages + manifest + `--check` | `scripts/generate-content-pages.mjs` |
| Content Data / Media Catalog | Localized content and media metadata | `scripts/data/content.js`, `media/catalog.js` |
| i18n / Routing / Preferences / Audio | Cross-cutting services | `scripts/i18n`, `routing`, `state/preferences.js`, `audio.js` |
| three.js (vendored) | Dynamic 3D wireframe previews | `vendor/three.module.min.js` |

## Important relationships (evidence-backed)

- **Single composition root**: everything funnels through `main.js` — it constructs i18n, preferences, audio, boot, desktop, environment, and window manager, then wires the 7 renderers (evidence: 17 imports in `main.js`).
- **One-way module fan-in to data**: app renderers, environment, content pages, and the static generator all consume `data/content.js` + `media/catalog.js`; nothing writes back at runtime (data is frozen `Object.freeze`).
- **Window lifecycle is pure**: `window-manager.js` delegates all geometry/state transitions to `state/window-state.js` helpers, keeping the manager thin.
- **Static generation shares browser code**: the Node generator reuses `routing/content-routes.js` and `data/content.js` from the browser bundle — the only Node-browser shared seam.
- **Content pages are first-class routes**: `contentPath(kind, slug)` owns the `writing|projects/<slug>/` layout; `desktopPath` provides `?open=` back links; `readDesktopTarget` handles deep links into the desktop.

## Layering and boundaries

```
External:    GitHub Pages ──▶ App Shell (HTTP)
                     │
Browser:     App Shell ──▶ main.js ──▶ boot / desktop / window-manager / apps / environment
                     │              └──▶ i18n / routing / preferences / audio
                     │
Data:        content.js + media/catalog.js ──▶ apps / environment / pages / generator
                     │
Build-time:  generate-content-pages.mjs ──▶ writing|projects/*/index.html ──▶ routing (back links)
```

## Evidence strength

- **All modeled modules are high confidence**: every node and edge cites a concrete file; the import graph was extracted directly from `import` statements.
- **No runtime observation** was used; behavioral claims (e.g., window transitions, boot timing, audio synthesis) are structural evidence from code paths, not live traces.

## Unknowns and validation tasks

1. Runtime/deployment topology beyond GitHub Pages — no CI/CD or hosting config in repo.
2. three.js wireframe failure behavior — dynamic import path not executed during modeling.
3. Fresh generation run of `npm run generate:pages` not performed; manifest contents assumed current.

## Reading order

1. [`system-context.structurizr.dsl`](system-context.structurizr.dsl) — open in the Qoder **DSL canvas viewer** for the system-context and container views.
2. [`module-dependencies.dot`](module-dependencies.dot) — open in the Qoder **DOT canvas viewer** for the full module dependency graph (top-to-bottom layout); [`module-dependencies.svg`](module-dependencies.svg) is the rendered export.
3. [`system-model.evidence.md`](system-model.evidence.md) — if you want to audit any node or edge back to its source files.
4. [`architecture-model.json`](architecture-model.json) — canonical machine-readable model for diffs and living-architecture checks.

## Maintenance note

When the module graph changes (new app, moved imports, new generator behavior), regenerate the model by re-extracting imports and updating `architecture-model.json` + this summary; the DSL/DOT files are derived views, not the source of truth.
