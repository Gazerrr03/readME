# Task 3 Report: Application Registry and 1-Bit Icon System

## RED

Added `tests/unit/app-registry.test.js` before the registry module existed.

Command:

```sh
node --test tests/unit/app-registry.test.js
```

Result: failed with `ERR_MODULE_NOT_FOUND` for `scripts/apps/app-registry.js`, as expected.

## GREEN

Implemented the immutable application registry, CSS-only icon primitives, and linked `styles/icons.css` from the document head.

Commands:

```sh
node --test tests/unit/app-registry.test.js
npm run test:e2e -- --grep "loads the portfolio OS shell"
```

Result: both passed. The focused unit test ran 2 passing tests; the shell E2E ran 1 passing test.

## Files

- Created `scripts/apps/app-registry.js`
- Created `styles/icons.css`
- Created `tests/unit/app-registry.test.js`
- Modified `index.html`

## Self-Review

- The registry preserves the required five-app desktop ordering and app metadata.
- The registry array, every definition, and nested `defaultSize` objects are frozen; `getApps()` exposes a copied array.
- Icons use only CSS borders, pseudo-elements, text, and the existing blue/white design tokens. No image assets or rounded-corner rules are present.
- Icon DOM is intentionally deferred to the desktop-controller task, which owns the shared icon list and desktop-mode chrome.

## Concerns

None. The selected-icon artwork treatment will be finalized with the icon DOM and interaction state in the desktop-controller task.

## Fix Round 1

Addressed the review findings by making glyph artwork inherit the icon `currentColor` and by adding a reusable `data-app-icon-template` with the five first-release button, glyph, and label structures. The template is inert until the desktop controller clones it, so it does not compete with that renderer.

Added focused shell coverage that verifies the template glyph values and clones a selected Writing icon to assert a blue frame plus white computed glyph color, border, and document-line artwork.

Commands and output:

```sh
node --test tests/unit/app-registry.test.js
# 2 passing, 0 failing

npm run test:e2e -- tests/e2e/shell.spec.js
# 2 passing, 0 failing
```

No concerns remain for this fix round.

## Fix Round 2

Replaced the unsupported `aria-selected` state on native icon buttons with valid toggle-button semantics: `aria-pressed="false"` plus the styling hook `data-selected="false"`. Selected-state CSS now consistently uses `data-selected="true"`.

The focused E2E was updated first and failed with the old template values (`aria-pressed: null`, `data-selected: undefined`, and `aria-selected` present). It then passed after the markup and CSS update, including the selected white-artwork checks.

Commands and output:

```sh
node --test tests/unit/app-registry.test.js
# tests 2; pass 2; fail 0

npm run test:e2e -- tests/e2e/shell.spec.js
# 2 passed (538ms)
```

No concerns remain for this fix round.
