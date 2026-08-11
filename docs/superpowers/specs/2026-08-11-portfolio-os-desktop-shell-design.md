# Portfolio OS Desktop Shell Design

Date: 2026-08-11
Status: Approved design, pending implementation plan

## 1. Purpose

Transform the existing blue-and-white system settings composition into the first application inside a simulated portfolio operating system. The grid becomes the computer desktop, the current panel becomes the Settings application, and five desktop application icons establish the future portfolio structure.

The first release focuses on the operating-system shell. It does not design the final Projects, Writing, About, Contact, mobile-system, or AI-assistant experiences.

## 2. Product Theme

The website title is localized in full rather than treated as a fixed brand name:

- English: `Two A.M., A Frequency That Does Not Exist`
- Chinese: `凌晨两点，不存在的频率`
- Japanese: `午前二時、存在しない周波数`

English is the default language for every first-time visitor. Browser language does not override this default.

## 3. First-Release Scope

### Included

- A first-visit boot sequence lasting approximately five seconds.
- A persistent record that the visitor has completed or skipped the boot sequence.
- A blue-and-white grid desktop.
- Automatic Windows-style or macOS-style desktop selection based on the visitor's operating system.
- Manual desktop-layout selection that overrides automatic detection.
- Five 1-bit desktop application icons: Projects, Writing, About, Contact, and Settings.
- A modular application registry.
- Lightweight multi-window behavior: open, focus, drag, minimize, restore, and close.
- A shared window visual language across desktop modes.
- A localized `COMING SOON` placeholder window for unfinished applications.
- The existing system-settings panel as the Settings application.
- English, Chinese, and Japanese system copy.
- Optional system audio that is disabled by default.
- A non-functional desktop BOT placeholder in the lower-right corner.
- A usable narrow-screen fallback until the independent mobile-system project begins.

### Excluded

- Final Projects, Writing, About, or Contact content and application layouts.
- Real portfolio content beyond optional representative data used in later application work.
- BOT personality, knowledge base, prompt design, AI integration, or final chat UI.
- The iOS-style and Android-style mobile shells.
- The mobile Dynamic Island BOT states beyond a future design requirement.
- Window resizing and maximization.
- Restoring open windows and positions across page reloads.
- Back-end services, authentication, analytics, or content management.

## 4. Experience Flow

### First Visit

1. Load the English boot screen.
2. Display the localized site title and `PORTFOLIO OS` build information.
3. Mount Projects, Writing, About, Contact, Settings, and BOT services in sequence.
4. Change status markers from `[··]` to `[OK]`.
5. Advance a discrete, character-like progress indicator.
6. Allow the visitor to skip the sequence.
7. Enter a clean desktop with no application window open.
8. Save the completed/skipped boot state locally.

### Returning Visit

1. Read saved preferences.
2. Skip boot when its completed state is present.
3. Restore language, desktop layout preference, and audio preference.
4. Enter a clean desktop; do not restore prior windows.

### Desktop Use

1. Select an icon with one click.
2. On fine-pointer devices, double-click to open it.
3. On touch devices, single-tap to open it.
4. Open unfinished applications in a shared localized placeholder window.
5. Open Settings in the existing control-panel interface.
6. Focus, drag, minimize, restore, or close windows.
7. Switch desktop layout or language without losing current session windows.

## 5. Desktop Modes

### Automatic Selection

- Detect Windows and select the Windows-style icon-grid desktop.
- Detect macOS and select the macOS-style Dock desktop.
- Use the Windows-style desktop when detection is missing or ambiguous.
- Treat automatic detection as an initial default only.
- Once a visitor manually selects a layout, persist it and do not override it with later detection.

### Windows-Style Mode

- Arrange 1-bit application icons from the upper-left corner.
- Use a bottom taskbar for the launcher, running applications, language switch, audio state, and system status.
- Show minimized and running applications in the taskbar.
- Keep the grid wallpaper visible in the central work area.

### macOS-Style Mode

- Use a top menu bar for the title, language switch, audio state, and system status.
- Center the application Dock at the bottom.
- Indicate running and minimized applications in the Dock.
- Use the same 1-bit icons and window design as Windows-style mode.

### Switching Modes

- Change the desktop icon placement and operating-system chrome.
- Preserve each open application's focused, normal, or minimized state.
- Preserve window positions within the current session.
- Re-clamp windows if the new system chrome changes the available desktop bounds.
- Do not remount application content or create duplicate windows.

## 6. Application Model

The desktop is driven by an application registry. Each application definition contains:

- Stable application ID.
- Localized display-name key.
- 1-bit icon identifier.
- Window title key.
- Default window size.
- Default launch behavior.
- Application render function.

Initial applications:

| ID | English | Chinese | Japanese | First-release behavior |
| --- | --- | --- | --- | --- |
| `projects` | Projects | 项目 | プロジェクト | Localized placeholder |
| `writing` | Writing | 文章 | 文章 | Localized placeholder |
| `about` | About | 关于 | プロフィール | Localized placeholder |
| `contact` | Contact | 联系 | 連絡 | Localized placeholder |
| `settings` | Settings | 设置 | 設定 | Existing control panel |

An application has at most one window instance. Launching an already open application focuses it; launching a minimized application restores and focuses it.

## 7. Icon System

- Use recognizable 1-bit object silhouettes rather than modern rounded application tiles.
- Use one-pixel blue borders, white fills, and a hard blue offset shadow.
- Use uppercase monospace labels in English and appropriate localized labels in Chinese and Japanese.
- Projects uses a folder form.
- Writing uses a text-document form.
- About uses an identity/profile form.
- Contact uses a signal or `@` form.
- Settings uses a control/configuration form.
- Selected icons invert to blue fill with white artwork and label treatment.
- Activation produces a short stepped visual response rather than a smooth bounce.

## 8. Window Manager

### Instance Rules

- Maintain one window per application ID.
- Give new windows a cascading initial offset.
- Bring the active window to the highest layer.
- Re-index layers when needed to prevent unbounded z-index growth.

### Dragging

- Start dragging only from the title bar, excluding controls.
- Use pointer events so mouse, pen, and touch share one implementation.
- Keep a reachable portion of every title bar inside the available desktop area.
- Re-clamp all windows after viewport or desktop-mode changes.
- Disable desktop-window dragging in the narrow-screen fallback.

### Controls

- Close removes the application window from session state.
- Minimize hides the window and marks its taskbar or Dock entry as minimized.
- Restore returns it to its last session position and focuses it.
- No maximize or resize control appears in the first release.
- Controls use the portfolio system's blue-and-white symbols, not native Windows or macOS traffic-light styling.

### Input

- Fine pointer: single-click selects; double-click opens.
- Touch/coarse pointer: single-tap opens.
- Keyboard: arrow keys move through icons; Enter opens; Tab reaches window controls and Settings controls.
- Focus indicators use the existing blue system style.

## 9. Settings Application

The existing panel becomes Settings and preserves its Display, Mouse, and Network demonstrations.

Add these functional preferences:

- `Desktop Layout`: Auto, Windows, macOS.
- `Language`: English, 中文, 日本語.
- `System Audio`: On or Off; default Off.
- `Replay Boot Sequence`: immediately replay in the current language.

The layout and language controls also appear in desktop chrome where specified. Both locations update the same preference store.

## 10. Internationalization

### Rules

- Store every user-facing string in locale dictionaries.
- Do not embed English labels directly in application or shell components.
- Default to `en` when no saved preference exists.
- Support `en`, `zh-CN`, and `ja`.
- Switch all visible strings immediately without reloading.
- Update open window titles and contents during language changes.
- Update the document title and accessibility labels.
- Keep protocol-like tokens unchanged: numeric indices, `[OK]`, `[··]`, `BUILD 882.A`, and file-like IDs.
- Replay boot using the current language; the first automatic boot remains English.
- Display language choices in their native form: `EN`, `中文`, `日本語`.

### Typography

- English titles: Times-style serif.
- English system text: platform monospace.
- Chinese titles: system Chinese serif fallback.
- Japanese titles: system Japanese serif fallback.
- Chinese and Japanese system labels: matching system monospace or gothic fallback.
- Use zero letter spacing for CJK copy.
- Size controls and window titles using the longest supported localized string.

## 11. BOT Placeholder

Desktop scope includes only a non-functional BOT placeholder:

- Position it in the lower-right corner.
- Keep it clear of the Windows taskbar and macOS Dock.
- Give it an idle visual state consistent with 1-bit ASCII graphics.
- Clicking shows a localized `BOT SERVICE: STANDBY` system message and does not open a chat window or imply real AI functionality.

Deferred BOT requirements recorded for later design:

- A professional but characterful portfolio assistant.
- A hybrid of curated responses and future live AI answers.
- A mobile Dynamic Island representation.
- Mobile states for idle, greeting, listening, thinking, response, and error.

## 12. Boot Motion and System Audio

### Motion

- Use approximately five seconds for the first complete boot sequence.
- Print status lines in stepped intervals.
- Advance the progress indicator discretely.
- End with a brief grid or dither transition into the desktop.
- Use 120-180 ms stepped transitions for opening, minimizing, and restoring windows.
- Use a short selected-icon inversion or jitter on activation.
- Avoid glass, blur, soft shadows, gradients, and spring animations.

### Reduced Motion

- Respect `prefers-reduced-motion`.
- Replace sequential printing with the final boot state.
- Remove icon jitter and stepped window travel.
- Keep necessary focus, selected, open, and minimized state changes visible.

### Audio

- Default system audio to Off.
- Initialize audio only after a visitor explicitly enables it.
- Provide short boot, click, window, and notification cues.
- Continue silently if audio initialization or playback fails.

## 13. State Model

### Persistent Preferences

- Schema version.
- Boot completed/skipped flag.
- Desktop layout preference: `auto`, `windows`, or `macos`.
- Language: `en`, `zh-CN`, or `ja`.
- System audio enabled flag.

### Session State

- Open application windows.
- Window position.
- Window layer order.
- Focused window.
- Normal or minimized window state.
- Selected desktop icon.

### Recovery

- Validate persistent data before use.
- Ignore unknown fields.
- Reset the complete preference object when JSON is corrupt or the schema is incompatible; replace only individual invalid values with their defaults when the remaining object is valid.
- Never prevent the desktop from starting because preferences cannot be read or written.

## 14. Narrow-Screen Fallback

The independent mobile operating system is a separate project and follows the desktop shell.

Until then:

- Keep the site usable on narrow screens.
- Render a single-column application grid.
- Open one application at a time in a full-screen or near-full-screen surface.
- Disable free window dragging and multi-window layering.
- Retain language switching and Settings access.
- Keep system title, palette, typography, and 1-bit icons consistent.

Future mobile design direction:

- Detect iOS or Android and render a corresponding mobile shell.
- Share application registry and localized content with the desktop shell.
- Represent the BOT as a top Dynamic Island component.

## 15. Visual System

- Primary blue: `#26159A`.
- Background: white.
- Desktop grid: 32 by 32 pixels with one-pixel blue lines.
- Serif display typography for site and window titles.
- Monospace typography for system metadata and controls.
- Square corners and one-pixel strokes.
- Hard blue offset shadows.
- Dither, moire, scanline, and repeating-line motifs.
- No decorative blobs, glass effects, soft drop shadows, or multicolor gradients.

The localized site title appears during boot and in desktop chrome. The first release does not add a desktop watermark.

## 16. Module Boundaries

Use browser-native ES modules without introducing a framework for this release.

- `index.html`: document shell and mounting targets.
- `styles/tokens.css`: palette, typography, spacing, stroke, and motion tokens.
- `styles/boot.css`: boot composition and sequence states.
- `styles/desktop.css`: shared grid desktop and icon system.
- `styles/windows-mode.css`: Windows-style taskbar and icon layout.
- `styles/macos-mode.css`: macOS-style menu bar and Dock layout.
- `styles/windows.css`: application window surfaces and controls.
- `styles/apps.css`: Settings and placeholder application content.
- `styles/responsive.css`: narrow-screen fallback.
- `scripts/i18n.js`: dictionaries, locale selection, and subscriptions.
- `scripts/preferences.js`: validated persistent preferences.
- `scripts/app-registry.js`: application definitions and launch metadata.
- `scripts/window-manager.js`: session window lifecycle and geometry.
- `scripts/boot.js`: boot state machine and replay.
- `scripts/audio.js`: opt-in sound lifecycle.
- `scripts/desktop.js`: icon interaction and desktop-mode rendering.
- `scripts/main.js`: environment detection and module assembly.

Modules communicate through explicit state updates and events. Application renderers do not manipulate window geometry, and the window manager does not own localized application strings.

## 17. Failure Handling

- Invalid preferences: reset only the invalid preference set and start normally.
- Storage unavailable: run with in-memory defaults for the session.
- Audio unavailable: remain silent and leave all visual interactions functional.
- Unsupported operating-system detection: use Windows-style mode.
- Viewport becomes too small: clamp windows or enter the narrow-screen fallback.
- Missing application renderer: open a localized placeholder rather than failing silently.
- Missing translation key: fall back to English and expose the missing key in development diagnostics.

## 18. Verification and Acceptance

### Boot

- First visit shows the English boot sequence.
- Skip enters the desktop and persists completion.
- Returning visit skips boot.
- Replay uses the current locale.
- Reduced-motion mode avoids sequential animation.

### Desktop Modes

- Windows and macOS detection choose the expected automatic default.
- Unknown detection chooses Windows-style mode.
- Manual selection persists and overrides later detection.
- Switching mode preserves open and minimized windows.

### Applications and Windows

- All five icons support keyboard selection.
- Fine-pointer double-click and coarse-pointer single-tap open applications.
- Unfinished applications show localized placeholders.
- Settings opens the functional control panel.
- Reopening an application focuses or restores its existing window.
- Dragging cannot make the title bar unreachable.
- Minimize, restore, focus, and close work from both desktop modes.
- No duplicate windows appear for one application.

### Localization

- English is the initial locale.
- English, Chinese, and Japanese switches update the complete visible shell.
- Open window titles and placeholders update without reload.
- The localized title and document title update correctly.
- Long localized strings do not overlap icons, controls, or system chrome.
- Locale preference persists.

### Resilience and Quality

- Corrupt saved preferences do not block startup.
- Audio failure does not block interaction.
- The desktop remains operable at 1280 by 720.
- Narrow screens have no horizontal overflow and retain Settings and language access.
- Browser console contains no application errors during the primary flows.
- Focus indicators and control labels remain available to keyboard and assistive-technology users.

## 19. Follow-Up Projects

After the desktop shell is stable, design and implement these as separate scoped projects:

1. iOS-style and Android-style mobile shells sharing the application registry.
2. Projects application and representative project content.
3. Writing application and article content model.
4. About and Contact applications.
5. BOT personality, knowledge, chat interface, curated responses, and live AI integration.
