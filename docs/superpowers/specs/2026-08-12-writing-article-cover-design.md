# Writing Article Cover Design

Date: 2026-08-12
Status: Approved design, pending implementation plan

## 1. Purpose

Turn the writing reader's first viewport into an editorial cover rather than the beginning of the article. Opening an article should first establish a visual mood through large typography and a generated blue-and-white composition. The prose begins only after the reader scrolls beyond that cover.

The design borrows the reference page's hierarchy, not its travel imagery: atmospheric background first, title as the dominant object, and supporting information anchored at the lower right.

## 2. Product Boundary

### Included

- A full-viewport cover for every article in the writing reader.
- Oversized, responsive article titles in English, Simplified Chinese, and Japanese.
- Generated cover variation using the existing blue-and-white portfolio OS palette.
- Cover metadata containing date, tag, reading time, and archive position.
- A restrained scroll cue.
- A visually separate editorial body beginning after the cover.
- Responsive behavior, reduced-motion behavior, and focused automated visual checks.

### Excluded

- Photography, image generation, or externally hosted cover assets.
- A redesign of the writing archive list.
- New article authoring fields or a content-management workflow.
- A unique manually designed cover for each article.
- Scroll hijacking, parallax, canvas rendering, or a new animation dependency.

## 3. Experience Sequence

Opening an archive entry still maximizes the writing window and resets its scroll position. The first viewport contains only the cover composition. The article body must not be visible at initial load on desktop or mobile.

The cover has three information zones:

1. The upper edge contains the back command on the left and the article position on the right.
2. The title occupies the lower-left and central field as the primary visual object.
3. The lower-right contains date, tag, estimated reading time, and the article position in a compact metadata block.

A small scroll cue sits along the lower edge without competing with the title. Normal vertical scrolling moves directly into the article body. There is no snap point and no intercepted wheel or touch behavior.

## 4. Cover Composition

The cover uses `min-height: 100dvh` so browser chrome changes do not destabilize the mobile layout. Its internal layout is an asymmetric grid rather than a centered hero.

The title is left aligned and positioned in the lower portion of the cover. It may span most of the cover width, but the metadata block reserves a protected lower-right region. Title sizing is selected from explicit length tiers derived from the localized title rather than from viewport-width font scaling. Long unbroken words may wrap, and CJK titles use natural line-breaking rules.

The back button remains keyboard accessible and recognizable, but loses the heavy offset shadow used in the current masthead so it reads as navigation rather than the focal object. The archive position remains available at the top for orientation and is repeated in the metadata block as part of the poster composition.

The cover has no card, panel, or floating text container. All information is placed directly in the composition.

## 5. Generated Visual System

Each article receives a deterministic cover variant based on its archive index and slug. The renderer exposes a variant value on the cover element; CSS owns the visual treatment.

The variation combines a small fixed vocabulary:

- orthogonal grid or ruled-line density;
- one large index numeral or cropped typographic mark;
- geometric contour paths or stepped blocks made with CSS gradients and pseudo-elements;
- inversion between blue-dominant and white-dominant regions;
- a restrained 1-bit or scan texture consistent with the desktop environment.

Variants remain inside the existing `--blue` and `--white` color system, with color mixing used only for intermediate contrast. No random values are generated at runtime, so a given article has a stable identity across visits and screenshots.

Decorative layers are non-interactive, do not introduce semantic noise, and are rendered with pseudo-elements where practical. Texture layers remain fixed to the cover rather than the entire scrolling reader to avoid continuous repaint cost.

## 6. Reader Structure

The reader changes from a single constrained column into two stacked regions:

- `cover`: full-width, full-viewport editorial composition;
- `article`: constrained reading column containing the reading band, article body, closing band, and previous/next navigation.

The existing body renderer remains responsible for paragraphs, section headings, links, and the lead paragraph. Reading-time estimation and localized content selection remain unchanged.

The article region uses the existing serif reading language and approximately `68ch` measure. It begins with intentional top spacing and a lightweight article marker so the transition from poster to prose feels deliberate. The current masthead title and duplicate metadata are removed from the body region.

Previous and next navigation remains at the end of the article. Choosing another article re-renders the reader and returns the writing window to the top, revealing the new cover first.

## 7. Data And Rendering

No new authored content fields are required. Cover information is derived from the existing article model:

- `title` supplies the localized display title;
- `date` and `tag` supply metadata;
- `body` supplies the reading-time estimate;
- archive index supplies position and the deterministic visual variant;
- localized title length supplies the title-size tier.

The writing renderer creates semantic cover and article-region elements with stable `data-writing-*` hooks. Decorative text is marked `aria-hidden`; the actual article title remains an accessible heading. The existing click delegation continues to handle back and article pagination commands.

## 8. Motion

Motion is deliberately limited. On article open, the cover title and metadata may enter through a short opacity and vertical-transform transition. The scroll cue may use a low-amplitude transform animation. No animation changes element dimensions or controls scrolling.

With `prefers-reduced-motion: reduce`, entry transitions and the repeating scroll cue become effectively static. The cover remains fully legible without motion.

## 9. Responsive Behavior

At wide sizes, the title owns the lower-left field while the metadata block is aligned to the lower-right. Stable grid tracks and minimum gaps prevent overlap.

Below the existing mobile breakpoint, the cover becomes a strict single-column poster:

- navigation stays on the upper edge;
- the title occupies the lower half and uses the appropriate length tier;
- metadata flows below the title in a compact wrapping row;
- the cover keeps at least `100dvh`, so prose remains outside the first viewport;
- padding accounts for small screens and safe-area insets;
- no horizontal scrolling is allowed.

English, Chinese, and Japanese titles are checked independently because their wrapping patterns differ. The longest current title must fit without clipping or covering metadata.

## 10. Accessibility

- The cover contains one semantic article heading.
- Back and pagination controls retain visible focus states and adequate target sizes.
- Background patterns maintain sufficient text contrast in every variant.
- Decorative numbers and textures are hidden from assistive technology.
- The scroll cue is supplementary and does not contain required instructions.
- Reading order follows visual order: navigation, title, metadata, then article body.
- The design remains usable with reduced motion and at 200 percent zoom.

## 11. Verification

### Unit And Structural Tests

- Existing article localization and body-shape tests continue to pass.
- The renderer creates a cover and a separate article body region.
- The cover exposes a stable variant and title-length tier.
- Reading-time, position, back navigation, and previous/next behavior remain correct.

### End-To-End Tests

- Opening an article maximizes the writing window and places the cover at scroll position zero.
- The body begins at or below the first viewport boundary.
- Navigating to another article returns to its cover.
- Returning to the archive restores the non-fullscreen window state.
- Locale changes update the cover title and preserve valid layout.

### Visual Checks

- Capture desktop covers in English and Chinese.
- Capture a narrow mobile cover using the longest current localized title.
- Capture the cover-to-body transition after scrolling.
- Assert that title, metadata, navigation, and scroll cue do not overlap.
- Assert that the page has no horizontal overflow.
- Verify computed contrast-bearing colors and reduced-motion behavior.

## 12. Success Criteria

The feature is complete when opening any writing entry shows a distinctive full-viewport blue-and-white cover with a dominant localized title and lower-right metadata, no prose is visible before scrolling, the article remains comfortable to read after the transition, and all current navigation and locale behavior still works across desktop and mobile layouts.
