# Writing Review Mode Design

Date: 2026-08-12
Status: Approved design, pending implementation plan

## 1. Purpose

Add a local-only `/writing` route for reviewing and editing every user-facing text value in the portfolio. Chinese is the only manually authored source language. English and Japanese are derived through an LLM translation endpoint.

The route must preserve the normal site's interaction model. Editing controls live outside an isolated preview, so window controls, desktop icons, dragging, keyboard navigation, language switching, media controls, and application-specific interactions continue to work normally.

## 2. Product Boundary

### Included

- A static-route-compatible `/writing/` entry point.
- A local content review workspace with content navigation, Chinese editing, translation status, and a real site preview.
- Coverage of all user-facing text, grouped into everyday content and advanced UI copy.
- Automatic local draft persistence.
- LLM-generated English and Japanese translations.
- A durable failed-translation task queue.
- JSON import, validation, export, and an unresolved-translation report.
- A runtime content store shared by the normal site and review preview.
- Safe fallback to bundled defaults when published JSON is missing or invalid.

### Excluded

- Authentication or remote multi-user editing.
- A hosted CMS or database.
- Direct browser writes into the Git working tree.
- Choosing or deploying the eventual LLM backend.
- Editing non-copy runtime values such as clocks, playback positions, generated counters, icons, and protocol glyphs.
- Editing link destinations, asset paths, visual settings, or application behavior.

## 3. Route And Isolation

The implementation adds `writing/index.html`, allowing basic static servers to resolve `/writing` through their normal directory redirect to `/writing/`. This page boots a separate review application rather than adding an editing mode to the normal desktop.

The review workspace uses three regions on wide screens:

1. A left navigation column for content groups, advanced UI groups, and translation status filters.
2. A central Chinese editor with field-level status and validation.
3. A right preview containing the real portfolio inside an iframe.

On narrow screens, editing and preview become two tabs. The tab surfaces have stable dimensions and preserve their own scroll positions.

The preview iframe loads the normal site with review-preview and boot-skip query parameters. Draft updates cross the iframe boundary through a named `BroadcastChannel`. Pointer and keyboard events remain inside the iframe and are never interpreted by the editor. The normal site does not open the channel unless review-preview mode is explicitly requested.

## 4. Content Model

Published copy uses a versioned JSON document:

```json
{
  "schemaVersion": 1,
  "publishedAt": "2026-08-12T00:00:00.000Z",
  "fields": {
    "site.title": {
      "kind": "shortText",
      "group": "advanced.ui",
      "values": {
        "zh-CN": "凌晨两点，不存在的频率",
        "en": "Two A.M., A Frequency That Does Not Exist",
        "ja": "午前二時、存在しない周波数"
      }
    }
  }
}
```

Every editable field has a stable ID. Representative forms are:

- `articles.<slug>.title`
- `articles.<slug>.body.<block-id>.text`
- `projects.<slug>.description`
- `about.timeline.<entry-id>.event`
- `contact.<channel-id>.label`
- `media.photos.<slug>.title`
- `media.tracks.<slug>.title`
- `ui.windows.close`
- `a11y.photos.next`

Field metadata declares its editor type, navigation group, ordering, and any interpolation tokens that must be preserved. Article links remain structured blocks: their visible labels are editable, while their destinations are not. Stable block IDs prevent an insertion or deletion from renumbering unrelated translation jobs.

The first migration creates `/content/content.json` from the current i18n dictionaries and structured content modules. Bundled JavaScript defaults remain available as an emergency fallback until a valid JSON document loads.

## 5. Content Store

One content-store API owns content loading, lookup, validation, and change notification.

Normal-site startup follows this order:

1. Start with bundled defaults.
2. Fetch `/content/content.json`.
3. Validate its schema and required locale values.
4. Merge valid published fields over defaults.
5. Start the desktop with the resolved snapshot.

Missing, malformed, or partially invalid published content cannot prevent the desktop from booting. Invalid fields use bundled defaults and produce a console warning that includes the field ID but not the full user content.

Application renderers receive content through their existing render context rather than importing editable datasets directly. The i18n service reads the same store. Store subscriptions allow review-preview updates and locale changes to refresh open surfaces without a full page reload.

## 6. Editing Workflow

Chinese is the only directly editable locale. English and Japanese appear as read-only generated translations with timestamps and status.

Editor behavior:

- Save each Chinese edit to IndexedDB immediately after local validation.
- Debounce translation creation until 800 milliseconds after the latest input.
- Update the Chinese preview without waiting for translation.
- Preserve the existing English and Japanese text until a newer translation succeeds.
- Show field-level states: saved, translating, waiting to retry, translated, or invalid.
- Use a white input background, dark text, visible border, and a blue focus ring regardless of preview theme.

The default navigation exposes articles, projects, About, Contact, and media copy. An Advanced section contains system labels, button text, window titles, status copy, and accessibility labels. This covers all human-facing copy without crowding the everyday review workflow.

## 7. Translation Contract

The editor calls a replaceable same-origin endpoint:

```json
POST /api/translate
{
  "sourceLocale": "zh-CN",
  "targetLocales": ["en", "ja"],
  "items": [
    {
      "id": "site.title",
      "text": "凌晨两点，不存在的频率",
      "kind": "shortText",
      "preserveTokens": []
    }
  ]
}
```

Successful responses use:

```json
{
  "translations": [
    {
      "id": "site.title",
      "values": {
        "en": "Two A.M., A Frequency That Does Not Exist",
        "ja": "午前二時、存在しない周波数"
      }
    }
  ]
}
```

The adapter treats non-2xx responses, timeouts, malformed payloads, missing locales, changed interpolation tokens, and empty translations as failures. No API secret is stored in the browser or exported content. The future backend owns provider credentials, prompt construction, model choice, and rate limiting.

## 8. Durable Translation Queue

IndexedDB stores drafts and translation jobs separately. Each job includes the field ID, source text hash, source revision, creation time, attempt state, and last non-sensitive error category.

Queue rules:

- A newer source revision supersedes every unfinished older job for the same field.
- A late response is applied only when its source hash still matches the latest Chinese value.
- The editor may batch compatible jobs, but each response is committed at field granularity.
- Opening `/writing` triggers one automatic retry for eligible failed jobs.
- A browser `online` event triggers one automatic retry for jobs not already retried during the current recovery cycle.
- A second failure waits for explicit manual retry, preventing repeated API traffic.
- Manual retry is always available for one job or all failed jobs.
- Closing or refreshing the route does not lose queued work.

API failure never blocks Chinese editing, preview updates, draft persistence, import, or export.

## 9. Import And Export

Import validates the complete document before replacing the current local draft. A rejected import leaves the existing draft untouched and reports structural errors by field ID.

Export produces:

- A schema-valid three-locale content JSON document.
- A separate report listing unresolved field IDs, their Chinese revision time, and failure category.

When a field has an unfinished translation job, export uses its last successful English and Japanese values. If no successful translation exists, it uses the bundled default values. The export dialog clearly states the unresolved count, but it does not block export.

Drafts and translation queue metadata are never included in the published content JSON. After downloading the file, the author replaces `/content/content.json` in the project so the normal site adopts it on its next load.

## 10. Error Handling And Data Safety

- IndexedDB failure falls back to an in-memory session and displays a persistent warning that local persistence is unavailable.
- Preview communication failure leaves the editor operational and offers a preview reconnect action.
- Published JSON fetch or validation failure falls back to bundled defaults.
- Translation errors keep prior translations and record only a normalized error category.
- Import is atomic from the user's perspective: either the whole validated document becomes the draft or nothing changes.
- Resetting local review data requires confirmation and does not modify published JSON.
- Export sanitizes filenames and serializes with deterministic field ordering for reviewable diffs.

## 11. Accessibility And Responsive Behavior

- All editor fields have persistent labels independent of placeholder text.
- Status changes use a polite live region and are also visible without color.
- Translation status filters and editor/preview tabs support keyboard navigation.
- Focus never moves automatically when translation state changes.
- Inputs meet readable text contrast in default, hover, focus, invalid, and disabled states.
- Long Chinese, English, and Japanese values wrap without overlapping controls.
- The preview iframe has an accessible title and an explicit reload action.

## 12. Verification

### Unit Tests

- Default-to-published content merging and field-level fallback.
- Schema validation, stable field IDs, and deterministic export order.
- i18n lookup through the content store.
- Draft persistence and import atomicity.
- Queue deduplication and source-revision supersession.
- Protection against stale successful responses.
- One automatic recovery retry per cycle.
- Interpolation-token validation and old-translation preservation.

### End-To-End Tests

- `/writing` resolves under the project's static development server.
- Editing Chinese updates the isolated preview without changing its active interaction state.
- Window controls, dragging, keyboard navigation, locale switching, and representative app interactions work inside the preview.
- Successful translations update English and Japanese preview content.
- Failed requests create durable tasks and retry once after route reopen or connectivity recovery.
- Export remains available with unresolved tasks and contains prior valid translations.
- Invalid imports do not replace the current draft.
- Normal `/` loads published content and does not expose editor controls or listen for review messages.

### Visual Checks

- Verify desktop and mobile review layouts with Playwright screenshots.
- Check input contrast, focus indication, long-text wrapping, and absence of overlap.
- Confirm the preview is nonblank and correctly framed at representative desktop and mobile viewports.

## 13. Success Criteria

The feature is complete when the author can open `/writing`, find any user-facing text, edit its Chinese source, continue using the live preview normally, recover failed translation work without data loss, and export a valid content JSON document whose unresolved translations safely retain their last known values.
