# Kaomoji Desktop BOT Design

Date: 2026-08-11  
Status: Superseded by `2026-08-12-penguin-desktop-bot-design.md`. Kept for record only.

## 1. Purpose

Replace the lower-right `BOT` standby square with the user-supplied four-line kaomoji cat. The cat should feel native to the portfolio operating system: blue and white, monospace, sharp-edged, quiet, and readable as a desktop resident rather than a pasted image.

This specification covers the BOT's visual form and current standby interaction only. It does not add chat, AI integration, portfolio recommendations, visitor-memory logic, or a complete personality state machine.

## 2. Approved Reference

The supplied reference is preserved at [assets/2026-08-11-kaomoji-bot-reference.png](assets/2026-08-11-kaomoji-bot-reference.png).

The reference depicts one cat assembled from four lines of text, with `MEOW` shown as a separate response. It is not a set of separate character poses.

The production UI must reconstruct the cat as semantic HTML text. It must not embed the reference PNG because the screenshot contains a white background, resampling blur, and color fringing that conflict with the site's 1-bit rendering.

Use this text structure as the production sprite:

```text
／|、
(ﾟ､ ｡ 7
|、 ~ヽ
じしf_, )ノ
```

During implementation, preserve these code points and line breaks exactly. Do not replace the character with emoji, an SVG illustration, or a raster trace.

## 3. Visual Treatment

### Color and Type

- Render the cat in `var(--blue)` on the transparent desktop background.
- Use `var(--mono)` and `white-space: pre`.
- Use zero letter spacing and a fixed line height so the four lines remain aligned.
- Apply the existing aliased-edge preference to the cat along with the rest of the desktop.
- Do not add gradients, antialiasing effects, outlines around individual glyphs, rounded containers, or soft shadows.

### Size

- Desktop visual width: approximately `84px`; height: approximately `88px`.
- Narrow-screen visual width: approximately `68px`; height: approximately `72px`.
- The button's interactive target must remain at least `76px` square on touch layouts, even when the visible glyphs are smaller.
- The text sprite must use stable dimensions; `MEOW`, status changes, and focus must not resize or reposition it.

### Container

- Remove the always-visible bordered `BOT` tile and the persistent standby label.
- Let the cat sit directly on the desktop grid as an unframed resident.
- Keep the button background transparent and borderless in its default state.
- Use the existing `2px` blue focus outline with `2px` offset for keyboard focus.
- A small `3px` hard shadow may appear on hover to separate the glyphs from dense grid settings, but it must not turn the cat into a framed card.

## 4. Placement

- Keep the existing `[data-bot-mount]` ownership and safe-area rules.
- Windows mode: place the cat above the taskbar at the lower-right edge.
- macOS mode: place the cat above and to the right of the Dock.
- Narrow screens: keep it below the top chrome when a window is open and above bottom chrome when the desktop is visible.
- The cat must never cover application icons, window title bars, window controls, the Dock, or the taskbar.
- The mount may move only when layout constraints require it; the character does not wander across the desktop in this scope.

## 5. Interaction And Motion

### Default

- The cat remains still and silent.
- It is a semantic `button` with a localized accessible name using the existing `bot.standby` key.
- It does not continuously follow the pointer, blink, float, or emit sound.

### Hover And Focus

- Fine-pointer hover may move the entire sprite upward by `2px` using the existing short UI duration.
- Focus uses the standard visible focus ring and no movement.
- Hover must not reveal instructional text.

### Activation

- Clicking or pressing Enter briefly shows the literal protocol token `MEOW` above the cat for approximately `1200ms`.
- The existing localized `BOT SERVICE: STANDBY` status remains available to assistive technology through the polite live region.
- Repeated activation restarts the same short response; it does not stack multiple labels or create a window.
- Audio remains governed by the existing opt-in audio preference. This change adds no new sound.

### Reduced Motion

- Under `prefers-reduced-motion: reduce`, remove the hover translation.
- `MEOW` may still appear and disappear without animation because it communicates the activation result.

## 6. Component Boundaries

Keep the current desktop controller API and BOT mount point. The visual change should remain isolated to three responsibilities:

- `scripts/desktop.js`: render the text sprite and transient `MEOW` response inside the existing BOT button and status mount.
- `styles/windows-mode.css` and `styles/macos-mode.css`: shared sprite appearance plus mode-specific placement.
- `styles/responsive.css`: narrow-screen sizing and collision rules.

If the transient response requires timer cleanup, keep one timer owned by the desktop controller. Re-rendering, changing locale, or destroying the controller must not leave a delayed DOM update targeting a stale mount.

Do not add a new general animation framework or BOT service abstraction for this visual replacement.

## 7. Accessibility And Localization

- Keep the BOT implemented as a real `button`.
- Keep the visible cat `aria-hidden="true"`; screen readers use the localized button name instead of reading punctuation character by character.
- Keep the status output as `role="status"` with `aria-live="polite"`.
- Treat `MEOW` as an intentional unlocalized protocol token, like `[OK]` or `TCP/IP`.
- Verify that changing among English, Simplified Chinese, and Japanese preserves the accessible label and does not recreate duplicate timers or responses.

## 8. Verification

Add or update focused browser checks for:

1. The four-line cat is present and the old visible `BOT` tile text is absent.
2. The button retains the localized accessible name in all three locales.
3. Click and keyboard activation show one `MEOW` response and retain the localized polite status.
4. The response clears without changing the mount's dimensions.
5. The cat clears system chrome and application icons in Windows, macOS, `390 × 844`, and `667 × 375` layouts.
6. Keyboard focus is visible.
7. Reduced motion removes translation while preserving the activation result.
8. Existing desktop, rapid-flow, and collision tests continue to pass.

Capture fresh desktop and narrow-screen screenshots. Confirm that the glyphs remain aligned, the sprite is legible against the configurable grid, and no antialiasing or colored fringe from the reference image appears.

## 9. Explicit Non-Goals

- No raster image in the runtime bundle.
- No roaming, cursor chasing, autonomous speech, or idle loop.
- No chat window, model call, knowledge base, or recommendation engine.
- No new BOT settings or persisted relationship state.
- No attempt to combine the cat with the discarded terminal, hexagon, or Babel Cat concepts.
