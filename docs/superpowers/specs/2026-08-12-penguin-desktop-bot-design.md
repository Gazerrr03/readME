# Penguin Desktop BOT Design

Date: 2026-08-12
Status: Approved by author. Supersedes `2026-08-11-kaomoji-desktop-bot-design.md`.

## 1. Purpose

Replace the lower-right `BOT` standby square with an original standing penguin, rendered in the portfolio's 1-bit blue/white system language. The penguin keeps the structure, proportions, and natural standing pose of a realistic penguin, but is redrawn as a blue-and-white dithered print — not a photograph, not a pasted image.

The penguin is an easter egg. Its behavioral references nod to famous "resident penguin" desktop culture (bathing, reading, quietly living in someone's apartment) without copying any existing character's design, name, or official artwork. Fans may recognize the memory; everyone else sees a quiet desktop resident.

This specification covers the BOT's visual form, standby interaction, and the three easter-egg layers only. It does not add chat, AI integration, portfolio recommendations, visitor-memory logic, or a complete personality state machine.

## 2. Reference And Predecessor

The author's preferred form reference is a realistic penguin: black back, white belly and face band, orange beak and feet, feather texture, natural upright stance. That reference defines silhouette and pose only. Production art must not embed any raster penguin image; the reference photograph carries full color, soft shading, and photographic texture that conflict with the site's 1-bit rendering.

The kaomoji cat specification (`2026-08-11-kaomoji-desktop-bot-design.md`) is superseded by this document. Its placement, accessibility, timer-ownership, and non-goal rules are carried over below with penguin-specific adjustments.

## 3. Visual Form

### Silhouette And Pose

- One penguin, standing naturally, weight even, head very slightly tilted — a calm resident, not a mascot waving.
- The running desktop surface is solid `var(--blue)` (see `styles/environment.css`), so the ink roles are inverted relative to the reference photograph: `var(--white)` is the drawn ink, and the blue desktop reads through as the negative space.
- Classic penguin color blocking, translated into that inversion:
  - Back, head cap, flippers, beak, and feet: solid `var(--white)` silhouette.
  - Belly and face patch: transparent cutouts (even-odd paths); the blue desktop shows through. The sprite never paints its own backdrop.
- The eye is a single small white point inside the transparent face patch, with no outline ring.
- No orange anywhere. The penguin must read as native to the blue/white system.
- Proportions follow the realistic reference (roughly 3:4 width to height), not the squashed proportions of pixel-art mascots.

### Rendering Technique

- Production sprite is an original inline SVG generated in `scripts/desktop.js`, white ink on transparent background.
- Feather shading is simulated with dithering only: small square blue dots set into the white regions, density varying by area, like a 1-bit silkscreen print. No gradients, no opacity fades, no filters, no rounded glow.
- Contour edges are hard. The existing aliased-edge preference applies to the sprite along with the rest of the desktop.
- The SVG uses fixed intrinsic dimensions; stroke-free fills only, so glyph alignment never drifts between browsers.
- Do not reuse, trace, or rework any official penguin character artwork from any franchise. The drawing is made for this site.

### Size

- Desktop visual size: approximately `68px` wide × `92px` tall.
- Narrow-screen visual size: approximately `54px` wide × `74px` tall.
- The button's interactive target must remain at least `76px` square on touch layouts, even when the visible sprite is smaller.
- The sprite must use stable dimensions; activation responses, scene changes, and focus must not resize or reposition it.

### Container

- Remove the always-visible bordered `BOT` tile and the persistent standby label, same as the superseded spec.
- The penguin stands directly on the desktop grid, unframed, background transparent, no border in its default state.
- Use a `2px` white focus outline with `2px` offset for keyboard focus; the desktop surface is blue, so a blue ring would be invisible.
- A small `3px` hard white drop shadow may appear on hover to separate the sprite from dense grid settings; it must not turn the penguin into a framed card.

## 4. Easter Egg Layers

Three quiet layers. None of them animate continuously, none of them speak without being addressed, and none of them require the visitor to know the source to operate the site.

### Layer 1 — Hot Spring Hour

- When the visitor's local time is between `01:00` and `02:59` (the site's 2 AM theme window), two small `~` steam glyphs in `var(--mono)` appear above the penguin's head.
- The steam is static text, `aria-hidden="true"`. It appears and disappears without animation.
- The time check runs on render and on locale change; it must not start a polling loop.

### Layer 2 — Reading Companion

- While the Writing application window is open, a small blue rectangle (roughly `18px × 14px`) containing three white horizontal bars appears beside the penguin, like a folded paper.
- The paper is positioned by the mount layout; it must never overlap the penguin sprite or any system chrome.
- When the Writing window closes, the paper disappears without animation.

### Layer 3 — Protocol Token On Activation

- Clicking or pressing Enter shows the literal unlocalized token `SPLASH` above the penguin for approximately `1200ms`, in the same position the steam occupies (steam and token never show simultaneously; the token wins).
- During the Hot Spring Hour, the token is `HOT SPRING: OPEN` instead of `SPLASH`.
- The existing localized `bot.standby` status remains available to assistive technology through the polite live region on every activation.
- Repeated activation restarts the same short response; it does not stack labels or create a window.
- Audio remains governed by the existing opt-in audio preference. No new sound is added.

## 5. Placement

- Keep the existing `[data-bot-mount]` ownership and safe-area rules.
- Windows mode: place the penguin above the taskbar at the lower-right edge.
- macOS mode: place the penguin above and to the right of the Dock.
- Narrow screens: keep it below the top chrome when a window is open and above bottom chrome when the desktop is visible.
- The penguin must never cover application icons, window title bars, window controls, the Dock, or the taskbar.
- The mount may move only when layout constraints require it; the penguin does not wander across the desktop in this scope.

## 6. Interaction And Motion

### Default

- The penguin remains still and silent.
- It is a semantic `button` with a localized accessible name using the existing `bot.standby` key.
- It does not continuously follow the pointer, blink, float, waddle, or emit sound.

### Hover And Focus

- Fine-pointer hover may move the entire sprite upward by `2px` using the existing short UI duration.
- Focus uses the standard visible focus ring and no movement.
- Hover must not reveal instructional text.

### Reduced Motion

- Under `prefers-reduced-motion: reduce`, remove the hover translation.
- `SPLASH`, steam, and paper may still appear and disappear without animation because they communicate state.

## 7. Component Boundaries

Keep the current desktop controller API and BOT mount point. The change is isolated to:

- `scripts/desktop.js`: generate the SVG sprite, render the transient token and steam inside the existing BOT button and status mount; own the single activation timer.
- `styles/windows-mode.css` and `styles/macos-mode.css`: shared sprite appearance plus mode-specific placement. The reading-companion paper is shown by a CSS `:has()` rule keyed on the visible Writing window, so no cross-module scene attribute or `scripts/main.js` change is needed.
- `styles/responsive.css`: narrow-screen sizing and collision rules.

Re-rendering, changing locale, or destroying the controller must not leave a delayed DOM update targeting a stale mount.

Do not add a new general animation framework, BOT service abstraction, or time-polling service for this change.

## 8. Accessibility And Localization

- Keep the BOT implemented as a real `button`.
- The visible penguin sprite, steam, and paper are `aria-hidden="true"`; screen readers use the localized button name.
- Keep the status output as `role="status"` with `aria-live="polite"`.
- `SPLASH` and `HOT SPRING: OPEN` are intentional unlocalized protocol tokens, like `[OK]` or `TCP/IP`.
- Verify that changing among English, Simplified Chinese, and Japanese preserves the accessible label and does not recreate duplicate timers or responses.

## 9. IP Boundary

- No reuse of any existing franchise penguin: no official silhouette, face, name, catchphrase, or artwork, in any language.
- Borrowed only at the behavior-memory level: bathing association, reading association, quiet cohabitation. These are general ideas, not protected expression.
- No text anywhere in the UI, code comments, or accessible names may reference the source franchise or its character names. Recognition must come from the visitor, never from the site.

## 10. Verification

Add or update focused browser checks for:

1. The penguin sprite is present, single-color blue, and the old visible `BOT` tile text is absent.
2. The button retains the localized accessible name in all three locales.
3. Click and keyboard activation show one token response and retain the localized polite status.
4. During the hot-spring time window the token switches to `HOT SPRING: OPEN` and steam glyphs are present; outside the window they are absent.
5. Opening the Writing app shows the paper element; closing it removes the element.
6. The response and scenes clear without changing the mount's dimensions.
7. The penguin clears system chrome and application icons in Windows, macOS, `390 × 844`, and `667 × 375` layouts.
8. Keyboard focus is visible.
9. Reduced motion removes translation while preserving activation and scene results.
10. Existing desktop, rapid-flow, and collision tests continue to pass.

Capture fresh desktop and narrow-screen screenshots. Confirm the dither reads as feather texture at production size, the silhouette is clearly a penguin, and no photographic shading or colored fringe appears.

## 11. Explicit Non-Goals

- No raster image of any penguin in the runtime bundle.
- No roaming, waddling, cursor chasing, autonomous speech, or idle loop.
- No chat window, model call, knowledge base, or recommendation engine.
- No new BOT settings or persisted relationship state.
- No orange pixels, gradients, or antialiased soft shading. On the solid blue desktop the sprite is drawn in white ink with blue negative space; do not "correct" it back to a blue body.
- No attempt to combine the penguin with the discarded kaomoji cat, terminal, hexagon, or Babel Cat concepts.
