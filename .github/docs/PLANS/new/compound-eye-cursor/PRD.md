## Problem Statement

The Compound Vision page (page 3) currently reads about how insects see through thousands of independent optical units (ommatidia), but the reading experience is purely conventional — standard cursor, standard text rendering. There is no embodiment of the concept being described. The page needs a compound-eye cursor: a hexagonal faceted cursor that activates when viewing this page, magnifying and fragmenting the text underneath it the way a dragonfly or horsefly sees — each facet showing a distorted, chromatically aberrated fragment of the text beneath. The effect should feel immersive and visceral, turning the act of reading about compound vision into actually seeing through a compound eye.

## Solution

Replace the default cursor with a hexagonal compound-eye cursor when the user navigates to the "Compound Vision" page. The cursor consists of ~19 hexagonal facets arranged in a circular grid. Each facet uses pretext's existing layout data to determine which text characters fall within its bounds, then re-renders those characters at a magnified scale with SVG-based barrel distortion and chromatic aberration. Thin dark borders separate facets (mimicking pigment cells). The cursor fades in on page enter and fades out on page leave. The effect deactivates automatically when navigating to any other page.

## User Stories

1. As a reader navigating to the Compound Vision page, I want my cursor to transform into a compound eye so that I experience what the page is describing.
2. As a reader hovering the compound eye over body text, I want each hexagonal facet to show a magnified, slightly distorted fragment of the text beneath me so that I feel like I'm seeing through insect ommatidia.
3. As a reader, I want the facets to have thin dark borders between them so the compound eye structure is visually clear.
4. As a reader, I want the distortion to include subtle chromatic aberration (like real ommatidia with varying spectral sensitivity) so the effect feels authentically insect-like.
5. As a reader, I want the cursor to smoothly fade in when I enter the page and fade out when I leave so the transition feels immersive rather than jarring.
6. As a reader, I want the compound eye cursor to work over body text, pull quotes, and captions uniformly so the effect is consistent across the page.
7. As a reader, I want the compound eye cursor to be disabled over the figure image (the horsefly eye photo) so I don't get a compound-eye view of a compound eye.
8. As a reader with `prefers-reduced-motion` enabled, I want the cursor to appear without the entrance/exit animation so the experience remains comfortable.
9. As a reader, I want the cursor to track smoothly with my mouse (no lag or stuttering) so the interaction feels responsive.
10. As a reader, I want my normal cursor back on all other pages so the effect is special to this page only.

## Implementation Decisions

### New Components

1. **`CompoundEyeCursor`** — The main cursor component. Renders an SVG overlay positioned at the mouse coordinates, containing 19 hexagonal `<clipPath>` facets. Each facet is a `<foreignObject>` that re-renders the text fragments found within that facet's bounds. Listens to `mousemove` on window, updates position. Manages fade-in/out via CSS transition.

2. **`HexFacetRenderer`** — A sub-component (can be inline) that takes a facet's center position, clip path, and the list of text fragments belonging to it, then renders an SVG `<g>` with the magnified text, SVG barrel distortion filter, and chromatic aberration.

### Integration with Existing Systems

- The cursor component uses **pretext's existing layout data** from `PageSpread`. Since `PageSpread` already calls `layoutText()` which uses pretext's `layout` function, every text line has a known absolute position and character offsets. The cursor queries this layout state per-frame.
- **Per-frame text resolution**: On each `mousemove`, compute the 19 facet bounding hexagons from the current cursor position. For each facet, determine which pretext-layouted text fragments overlap its bounds. This is O(facets × lines) — with 19 facets and ~100 text lines, well under 2000 checks per frame, trivially fast.
- **Magnification**: Text within each facet is rendered at ~1.5x scale, centered on the facet. The facet acts as a clipping window via SVG `<clipPath>`.
- **Barrel distortion**: Applied via SVG `<filter>` with `<feTurbulence>` + `<feDisplacementMap>` — a radial displacement that creates the curved lens effect per facet.
- **Chromatic aberration**: Achieved by rendering the text three times per facet (red, green, blue channels) with slight positional offsets (~1-2px), mimicking how real ommatidia have slightly different spectral sensitivities.
- **Facet borders**: Thin dark stroke (`~1px`, parchment-dark color) on each hexagonal path.
- **Figure exclusion**: The horsefly eye figure has a known bounding box from `PageSpread`'s layout. Cursor checks if the mouse is within the figure bounds — if so, hides the compound eye effect (falls back to normal cursor).

### Module Architecture

```
src/
  components/
    CompoundEyeCursor.tsx       # New — main cursor component
  layout-engine/
    layout.ts                   # Existing — pretext layout data (already has positions)
  context/
    PageThemeContext.tsx        # Existing — used to theme cursor colors
```

### Data Flow

1. `PageSpread` renders text via pretext, which produces line positions (x, y, width) for every text line.
2. `CompoundEyeCursor` accesses this layout data via a shared ref or context from `PageSpread`.
3. On `mousemove`, cursor computes 19 facet hexagons centered at mouse position.
4. For each facet, cursor finds overlapping text fragments from the layout data.
5. Each facet renders its fragments as SVG text, clipped, magnified, and filtered.
6. On page change (away from Compound Vision), cursor fades out and unmounts.

### CSS / Styling

- Cursor uses `pointer-events: none` (like `PheromoneCanvas`) so it doesn't block interaction.
- Body cursor set to `none` when component is active.
- Fade in/out via CSS `opacity` transition (~400ms ease).
- New styles in `src/styles/pages/vision.css` (the existing vision page CSS file).
- Respects `prefers-reduced-motion` by skipping the fade animation.

### Performance Considerations

- Pretext layout data is computed once per page render — cursor reads are pure reads, no recomputation.
- Per-frame work: 19 facet bounding computations + text overlap checks + SVG render. Should stay well under 16ms at 60fps.
- SVG filters (displacement map) can be expensive — will use small filter resolution (`filterUnits="userSpaceOnUse"`, small `x/y` bounds per facet).
- If performance is insufficient, fallback to rendering simplified text (fewer fragments, lower resolution chromatic offsets) per facet.

## Testing Decisions

Given the highly visual, interactive nature of this feature, automated tests have limited value. The primary testing approach will be:

- **Manual visual testing**: Verify the cursor renders correctly on the Compound Vision page, facets show magnified text, distortion is visible, and transitions are smooth.
- **Performance testing**: Use browser dev tools to confirm the cursor renders at 60fps without causing layout thrashing (since pretext data is read-only, no reflow should occur).
- **Accessibility testing**: Verify `prefers-reduced-motion` disables animations, and that the cursor doesn't block any interactive elements.
- **Unit test for hex grid math**: The hexagonal facet positioning calculation (centers and clip paths) can be tested in isolation — given a center point and radius, produce the correct 19 facet centers. This is pure arithmetic and easily testable.
- **Unit test for text-fragment overlap**: Given facet bounding boxes and pretext line positions, the overlap detection function can be tested with known inputs and expected outputs.

## Out of Scope

- A global compound eye cursor mode that works across all pages (this feature is page-specific).
- Interactive clicking/tapping effects within the compound eye cursor (the cursor is purely visual — no click reactions).
- Dynamic facet count based on zoom level or text density.
- Compound eye effects over images/figures (specifically excluded for the horsefly eye figure).
- Mobile/touch support (compound eye cursor is a mouse-pointer effect; mobile users will see the normal page without the cursor overlay).
- Changing the existing PageSpread layout or text content — the cursor is an overlay that doesn't alter the page layout itself.

## Further Notes

- The existing `PheromoneCanvas` component serves as a good reference pattern for a global overlay that tracks mouse position and renders on demand.
- The `Butterfly` component already demonstrates how pretext layout data can be used for real-time positioning queries (it acts as a layout obstacle).
- This feature leans heavily on pretext's core value proposition — knowing text positions without DOM measurement — which validates the library choice in this project.
- If the SVG filter approach proves too expensive, an alternative is to use CSS `transform` with `perspective` for a simpler barrel distortion approximation.
- The 19-facet count (center + 2 hexagonal rings) was chosen as a balance between visual authenticity (real flies have thousands, but 19 is enough to read as compound) and rendering cost.
