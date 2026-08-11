# macOS ASCII Environment Desktop Design

Date: 2026-08-11
Status: Approved

## 1. Purpose

Enrich the empty state of the Portfolio OS macOS desktop without turning it into a dashboard or a conventional photographic wallpaper. The new desktop environment combines a low-density animated ASCII coastline with a compact upper-left instrument cluster.

The environment must remain subordinate to application windows. When the visitor starts working inside an application, the desktop changes from an ambient display state to a quiet focus state.

## 2. Confirmed Direction

- Balanced composition: ambient landscape and useful widgets share the desktop.
- The environment widget is the primary widget.
- Visual theme: open coastal horizon with horizontal wind and wave motion.
- Rendering theme: blue field with white ASCII characters.
- Landscape source: Sean Oulashin's open-horizon seashore photograph on Unsplash,
  `https://unsplash.com/photos/KMn4VEeEPR8`.
- Rendering method: pre-generated ASCII terrain data plus procedural Canvas effects.
- Pointer behavior: subtle influence on wind direction, wave offset, and character density.
- Widget layout: one tall environment instrument with two compact signals to its right.
- Window behavior: visible windows activate a quiet focus mode.
- Narrow-screen behavior: static simplified environment.
- Motion preference: follow `prefers-reduced-motion`; do not add a new setting.

## 3. Scope

### Included

- A macOS-only environment layer mounted inside the existing desktop root.
- A full-desktop Canvas renderer beneath desktop widgets and windows.
- Pre-generated ASCII coastline data derived from one open-horizon Unsplash image.
- Procedural wind lines, wave bands, stepped scan noise, and subtle pointer response.
- An upper-left HTML instrument cluster.
- Real local time and date in the environment instrument.
- Localized placeholder values for location, weather, wind, and tide.
- `NOW / --` and `LATEST / --` compact widgets.
- Projects and Writing launch behavior from the compact widgets.
- Environment-instrument cycling between time, weather placeholder, and tide/wind readings.
- Focus mode when any non-minimized application window is visible.
- Static reduced-motion and tablet fallbacks, plus a background-only phone fallback.
- English, Simplified Chinese, and Japanese labels.
- Automated tests for mode gating, focus behavior, widget activation, and fallbacks.

### Excluded

- Live weather, geolocation, tide, or wind APIs.
- A new Environment application window.
- Dragging or rearranging widgets.
- Windows-mode background changes.
- Mobile OS redesign.
- User-selectable motion levels.
- Persisting the environment instrument's current view.
- Using the Unsplash photograph directly as the final wallpaper.

## 4. Architecture

The feature is split into three bounded units.

### 4.1 Environment Renderer

The renderer owns one Canvas element and no interactive HTML. It receives:

- Canvas dimensions and device pixel ratio.
- A normalized pointer position.
- Motion state: `running`, `focused`, or `static`.
- A pre-generated terrain character map.
- Static exclusion zones for the widget cluster and Dock.

It exposes lifecycle methods equivalent to:

- Mount and allocate the Canvas.
- Resize and reflow the terrain map.
- Update pointer input.
- Set motion state.
- Destroy listeners and animation resources.

The renderer does not query window DOM, preferences, localization, or application data.

### 4.2 Desktop Instrument Cluster

The instrument cluster is semantic HTML rendered only in macOS mode. It contains:

- One tall environment button.
- One `NOW` button that opens Projects.
- One `LATEST` button that opens Writing.

The environment button cycles locally through three views:

1. Local time and date.
2. Localized weather and location placeholders.
3. Localized tide and wind placeholders.

The compact widgets preserve their labels and display `--` until real content is connected. They do not invent project or article titles.

### 4.3 Desktop Environment Controller

The controller connects existing shell state to the renderer and widgets. It is responsible for:

- Mounting only when the active layout is macOS.
- Detecting whether the full or static experience is appropriate.
- Forwarding application launch events from widgets.
- Observing whether any application window is visible and not minimized.
- Translating visible-window state into renderer focus state.
- Re-rendering localized widget labels after locale changes.
- Cleaning up when switching to Windows mode or destroying the desktop.

The existing window manager remains the source of truth for window visibility. The renderer must not become a second window-state owner.

## 5. Visual Composition

### 5.1 Layer Order

From back to front:

1. Solid blue desktop field.
2. ASCII Canvas environment.
3. Upper-left instrument cluster.
4. Application window layer.
5. BOT mount.
6. macOS menu bar and Dock.

The Canvas and instrument cluster never cover window controls, the menu bar, or Dock interactions.

### 5.2 ASCII Landscape

The landscape uses a broad horizontal composition:

- Large open sky with sparse characters.
- One clear horizon line below the vertical midpoint.
- Low terrain density and shallow wave bands.
- Wind lines move primarily left to right.
- Scan noise changes in stepped intervals rather than smooth opacity drift.

The source photograph supplies luminance and silhouette information only. Its colors and pixels are not displayed in the final desktop.

### 5.3 Quiet Zones

Character density is attenuated around:

- The upper-left instrument cluster.
- The Dock and the immediate area above it.

Attenuation uses a gradual density falloff. It must not appear as a blurred panel, rectangular cutout, or glass mask.

### 5.4 Instrument Cluster

The cluster follows the existing design language:

- White text and border on a blue field.
- One-pixel borders.
- White hard-offset shadows.
- Square corners.
- Serif numerals for the primary time value.
- Monospace labels and status text.
- Stable dimensions that do not change when readings cycle.

The main instrument is tall. Two compact square signals sit to its right. The complete cluster begins below the menu bar and aligns to the desktop grid.

## 6. Motion and Pointer Behavior

### 6.1 Ambient State

When no application window is visible:

- The coastline base remains stable.
- Wind lines advance horizontally in discrete steps.
- Wave bands shift at a slower rate than wind lines.
- Scan noise changes intermittently.
- Pointer movement introduces a small, damped change to wind direction, wave offset, and local character density.

Pointer response must be bounded and return to neutral after the pointer stops. The background must not create a cursor-following spotlight, particle trail, or parallax camera.

### 6.2 Focus State

When at least one non-minimized application window is visible:

- Stop procedural animation on its current coherent frame.
- Remove pointer response.
- Reduce Canvas output opacity to approximately 28%.
- Reduce the instrument cluster's hard shadow while keeping primary text and borders white.
- Lower only secondary instrument labels to approximately 70% opacity.
- Keep all widget buttons keyboard-accessible.

When every application is closed or minimized, restore the ambient state without restarting from the first animation frame.

### 6.3 Reduced Motion

When `prefers-reduced-motion: reduce` is active:

- Render one static coastline frame.
- Disable wind, wave, noise, and pointer-driven updates.
- Preserve the instrument cluster and all click, focus, and keyboard behavior.

No new Settings control is added.

## 7. Responsive Rules

The feature follows the active desktop layout, not the physical operating system alone.

- macOS layout at `1024px` or wider with a fine pointer: full animated experience and instrument cluster.
- macOS layout from `761px` through `1023px`, on coarse-pointer devices, or under reduced motion: static simplified ASCII frame and instrument cluster.
- macOS layout at `760px` or narrower: static background-only ASCII frame; hide the instrument cluster so it cannot conflict with the existing responsive application icons.
- Windows layout: do not mount the environment layer or instrument cluster.
- Switching from macOS to Windows destroys renderer resources.
- Switching back to macOS restores the appropriate full or static experience.

All static fallbacks preserve the blue field, open horizon, and Dock quiet zone. The tablet fallback also preserves the widget quiet zone and instrument cluster. The phone fallback omits both. Static fallbacks remove continuous Canvas updates and pointer listeners.

## 8. Data and Localization

### Real Data

- Current local time from the browser.
- Current local date from the browser.

### Placeholder Data

- Location.
- Weather condition.
- Wind value.
- Tide value.
- Current project.
- Latest writing entry.

All visible natural-language labels are added to the existing English, Simplified Chinese, and Japanese dictionaries. Protocol-like values such as `--` remain unchanged.

Time updates once per minute. Date formatting uses the active locale. The component does not request location permission or call an external weather service.

## 9. Asset Pipeline

1. Use Sean Oulashin's seashore photograph from `https://unsplash.com/photos/KMn4VEeEPR8` and preserve the attribution in project documentation.
2. Crop the image to a wide desktop composition with the horizon below the vertical midpoint.
3. Convert its luminance into a normalized character-density map during development.
4. Store the resulting terrain map as a local lightweight data asset.
5. Use the local map at runtime; do not depend on the Unsplash network request.

The final runtime must continue working offline after project assets are installed.

## 10. Accessibility

- Canvas is decorative and marked hidden from assistive technology.
- Widget controls use semantic buttons with localized accessible names.
- The environment button exposes its current reading through text, not Canvas.
- `NOW` and `LATEST` have clear focus rings and launch the same applications as existing icons.
- Blue/white contrast remains readable in ambient and focus states.
- Focus mode never lowers widget text below accessible contrast.
- Keyboard interaction does not depend on pointer animation.
- At 200% zoom, the cluster remains below the menu bar and does not overlap the Dock.

## 11. Failure Handling

- If the terrain map fails to load, render a procedural horizon and waves without terrain detail.
- If Canvas initialization fails, retain the solid blue field and the HTML instrument cluster.
- If device pixel ratio or resize values are invalid, fall back to CSS pixel dimensions with a ratio of 1.
- If Projects or Writing cannot be opened, preserve the selected widget state and rely on the existing application-launch error behavior.
- Locale or placeholder failures fall back through the existing i18n mechanism.

No failure may prevent the desktop, Dock, menu bar, BOT, or windows from operating.

## 12. Performance Constraints

- Use one Canvas and one animation loop.
- Cap device pixel ratio for the environment Canvas to avoid excessive Retina allocation.
- Target 10 stepped visual updates per second rather than 60 continuously different frames.
- Update wave bands every second visual frame and scan noise no more than once per second.
- Avoid per-frame DOM writes.
- Recompute terrain layout only on resize or mode change.
- Stop the animation loop in focus, static, reduced-motion, and hidden-page states.
- Remove pointer, resize, visibility, and media-query listeners on teardown.

## 13. Test Strategy

### Unit Tests

- Full environment eligibility by mode, width, pointer, and reduced-motion state.
- Renderer state transitions between ambient, focused, and static.
- Environment reading cycle order.
- Localized time/date formatting.
- Quiet-zone density falloff calculations.

### End-to-End Tests

- macOS full desktop renders Canvas and instrument cluster at a desktop viewport.
- Windows mode renders neither environment element.
- Manual switch to macOS mounts the environment.
- `NOW` opens Projects and `LATEST` opens Writing.
- Opening a window activates focus state.
- Minimizing or closing all windows restores ambient state.
- Reduced-motion mode renders a static frame.
- Narrow macOS viewport renders the static fallback without overlap.
- English, Chinese, and Japanese widget labels fit their stable dimensions.

### Visual Checks

- Desktop views at 1440 x 900, 1728 x 1117, and 2560 x 1440.
- Static tablet fallback with the instrument cluster at 834 x 1194.
- Static phone fallback without the instrument cluster at 390 x 844.
- Active window over the environment layer.
- Main environment reading in all three cycle states.
- Longest Chinese and Japanese labels at 200% zoom.

## 14. Acceptance Criteria

- The idle macOS desktop no longer reads as empty.
- The ASCII coastline feels environmental rather than like a hero image or video filter.
- The upper-left cluster is clearly useful but does not become a dense dashboard.
- The desktop remains strictly blue and white with square corners and hard shadows.
- Application windows immediately become the dominant visual layer when opened.
- Windows mode behavior and appearance are unchanged.
- Reduced-motion and narrow-screen users receive a complete static experience.
- The implementation introduces no live weather, geolocation, or runtime Unsplash dependency.
