# Shareable Content Routes Design

**Date:** 2026-08-12

## Summary

Portfolio OS currently renders article and project details as local state inside desktop app windows. Opening an article sets an in-memory `openSlug` and maximizes the Writing window; opening a project similarly replaces the Projects ring with an in-window detail view. The browser URL remains the homepage, so a detail cannot be shared, restored after a refresh, indexed as its own document, or represented in browser history.

This change gives every article and project a real, language-neutral static URL while keeping the desktop as the site's primary index:

- `/writing/<slug>/`
- `/projects/<slug>/`

Detail URLs render independent content pages without the desktop shell. They are committed as physical `index.html` files so GitHub Pages can serve direct visits and refreshes without an SPA rewrite.

## Goals

- Give every article and project detail a stable, copyable URL.
- Support direct visits, refreshes, browser history, and GitHub Pages hosting.
- Make article and project pages independent documents rather than maximized desktop windows.
- Preserve the existing Portfolio OS visual language without showing desktop chrome on content pages.
- Keep URLs independent of locale while retaining all three existing languages.
- Return visitors to the corresponding desktop app from an independent detail page.
- Establish a reusable content-page foundation for future routed content types.

## Non-Goals

- Migrating the project to Astro, Vite, or another site generator.
- Adding `/writing/` or `/projects/` as independent archive pages.
- Routing Photos, Albums, About, Contact, or Settings in this iteration.
- Encoding locale in the URL.
- Preserving arbitrary desktop window geometry across a cold page load.
- Using a GitHub Pages `404.html` redirect as an SPA fallback.

## Route Model

The route table has two content kinds:

| Content kind | Detail route | Desktop return route |
| --- | --- | --- |
| Article | `writing/<slug>/` | `?open=writing` |
| Project | `projects/<slug>/` | `?open=projects` |

The paths above are site-relative concepts, not origin-root absolute paths. Generated pages and links must remain valid when the repository is hosted at either `/` locally or a GitHub Pages project base such as `/readME/`.

A shared content-route module owns the route vocabulary. Its interface accepts a content kind and slug, validates both, and returns either the detail path or the desktop return path. Callers must not concatenate content URLs themselves.

Valid slugs use lowercase ASCII letters, digits, and single hyphen separators. Unknown kinds and malformed slugs are rejected rather than converted into partial URLs.

## Static Page Generation

A Node script reads `articles` and `projects` from the existing content catalog and generates one physical entry page for every item:

```text
writing/
  <article-slug>/
    index.html
projects/
  <project-slug>/
    index.html
```

Each generated document contains:

- a relative site base that works under both local hosting and a GitHub Pages project path;
- the content kind and slug needed by the shared runtime renderer;
- an English static `<title>`;
- an English static meta description;
- Open Graph type, title, and description metadata;
- links to the shared content-page stylesheet and module.

Article descriptions use a safely escaped, whitespace-normalized excerpt of the first English prose paragraph. Project descriptions use the existing English project description. Static titles follow `<content title> - QIZHI`.

The generator validates unique slugs, supported kinds, required English metadata, and one output page per catalog item. It records the directories it owns so a later generation can remove stale generated entries without deleting unrelated hand-written files.

Generated entry pages are committed to the repository. GitHub Pages therefore returns a successful document response for a direct URL instead of relying on JavaScript to recover from a 404.

## Runtime Modules

### Content Routes

The content-route module is the sole seam for constructing content paths. It hides deployment-relative path rules and content-kind mapping behind a small interface shared by desktop apps, generated pages, and tests.

### Content Page

A shared content-page module reads the generated page's content kind and slug, resolves the matching catalog item, selects a localized presentation, and renders the independent page. It owns:

- page header and Portfolio OS identity;
- desktop return link;
- locale control;
- article or project presentation selection;
- article previous/next navigation;
- document title and `lang` synchronization after a locale change;
- the runtime unavailable state.

Article and project presentations may use private helpers, but callers interact only with the shared content-page interface. The desktop app renderers do not import or invoke detail-page rendering.

### Desktop Entry Handling

The homepage reads the `open` query parameter after initialization. Supported values are `writing` and `projects`. A supported value opens the corresponding app window; an unsupported value is ignored. The query remains in the URL so a refresh restores the same desktop entry point.

The normal boot preference remains authoritative. Returning users who have completed boot reach the requested app directly through the existing boot completion flow; first-time visitors still receive the intended boot experience before the app opens.

## Navigation Behavior

Writing archive entries become real same-tab links. Activating one navigates from the desktop to its article URL; the Writing renderer no longer stores `openSlug`, renders a reader, or maximizes its host window.

The Projects ring remains interactive. Activating the front project navigates to its real detail URL; the Projects renderer no longer switches to an in-window detail mode. Selecting a side card continues to rotate it to the front before navigation is possible.

On independent pages:

- the explicit return control links to the homepage with `?open=writing` or `?open=projects`;
- article previous and next controls link to physical sibling article pages;
- internal navigation uses the current tab;
- external project and source links continue to use a new tab;
- initial scroll and focus start at the page heading;
- browser Back naturally returns to the prior history entry and may restore the exact desktop state through the browser's page cache.

The explicit return link is the reliable fallback when a visitor arrived directly or the browser did not retain the previous desktop document.

## Independent Page Presentation

Content pages are documents, not simulated windows. They do not render the desktop, Dock, taskbar, app window title bar, or draggable controls.

They retain the Portfolio OS identity through the existing grid, typography, square geometry, restrained palette, and compact status language. The common shell contains:

- a compact header with QIZHI identity, content kind, return link, and locale control;
- one semantic `main` region;
- a single page `h1`;
- a restrained footer or navigation region appropriate to the content kind.

Article pages reuse the readable parts of the current reader: masthead metadata, section hierarchy, prose, references, reading bands, and previous/next navigation. Project pages reuse the project metadata, wireframe preview, description, and external actions, adapted to a standalone document layout.

Responsive behavior belongs to the content-page stylesheet. The information hierarchy remains the same at all widths; narrow layouts stack controls and content without reintroducing the desktop shell.

## Locale Behavior

URLs do not include locale. Page locale selection follows this order:

1. the saved Portfolio OS locale, when valid;
2. a supported browser language match;
3. English.

The page exposes an accessible language selector for English, Simplified Chinese, and Japanese. Changing it updates the existing saved preference, rerenders the current document, synchronizes `<html lang>` and the runtime document title, and leaves the URL unchanged.

Because social crawlers frequently do not execute page JavaScript, generated metadata always uses English. This is the intentional canonical preview language for the first iteration.

## Error Handling

Only known catalog entries receive generated directories. A request for an unknown slug therefore reaches GitHub Pages' real 404 response.

If a generated document and runtime catalog become inconsistent, the shared renderer displays a compact `Content unavailable` state with a link to the corresponding desktop app. It must not render an empty page or throw an uncaught error.

Malformed `open` query values on the homepage are ignored. A content route failure must not open an arbitrary desktop app or accept a slug as HTML.

## Accessibility

- Each independent page uses semantic `header`, `main`, `article` or project section, navigation, and footer landmarks where appropriate.
- Each document has one `h1`; article subsections retain a logical heading order.
- The return control and previous/next destinations are real anchors.
- The locale control has an explicit accessible label.
- Initial focus targets the page heading without producing an unexpected scroll jump.
- Wireframe previews keep their existing reduced-motion and accessible-image behavior.
- Text and controls remain usable at 200% zoom and narrow mobile widths.

## Verification

### Unit And Generation Tests

- The content-route interface generates correct writing, project, and desktop return paths.
- Unsupported kinds, malformed slugs, and path traversal attempts are rejected.
- Catalog slugs are unique and URL-safe.
- The generator produces exactly one physical page per article and project.
- Generated pages contain the expected English title, description, kind, slug, and deployment-relative resource paths.
- A freshness check fails when committed generated pages do not match catalog output.
- Locale resolution follows saved preference, browser language, then English.

### Browser Tests

- Clicking a Writing archive entry reaches the expected `/writing/<slug>/` URL.
- Clicking the front Projects card reaches the expected `/projects/<slug>/` URL.
- Direct navigation and reload render each content type without the desktop shell.
- Article previous and next controls change both content and URL.
- Browser Back returns to the prior desktop state when retained by the browser.
- Explicit return links load the homepage and open the correct app.
- `?open=writing` and `?open=projects` survive refresh and restore their windows.
- All three locales rerender the page without changing its URL.
- Independent pages have one `h1`, correct landmarks, visible keyboard focus, and no page errors.
- Tests run with a GitHub Pages-style base path to prove `/readME/` compatibility.

## Delivery Sequence

1. Introduce and test the content-route module.
2. Add the generator and committed static entry pages with freshness checks.
3. Extract shared article and project detail presentations into the independent content-page module.
4. Convert desktop article and project detail actions into real links and remove their local detail state.
5. Add homepage `?open=` restoration.
6. Add independent-page styling, locale behavior, and unavailable state.
7. Complete direct-load, navigation, refresh, accessibility, and GitHub Pages base-path browser coverage.

## Success Criteria

- A copied article or project URL opens the intended content in a fresh browser session.
- Refreshing a content URL succeeds on GitHub Pages without a redirect workaround.
- The desktop no longer simulates article or project details as local window state.
- Returning from a detail page reliably opens the corresponding desktop app.
- Language changes do not alter the shareable URL.
- Adding a future routed content kind requires extending the route/catalog mapping and supplying a presentation, not rebuilding navigation logic in each desktop app.
