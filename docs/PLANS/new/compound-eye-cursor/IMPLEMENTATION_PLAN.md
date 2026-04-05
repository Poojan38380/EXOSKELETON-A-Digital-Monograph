# Implementation Plan: Compound Eye Cursor

## Architecture Overview

The compound eye cursor is built as a three-layer system:

```
┌─────────────────────────────────────────────────┐
│  CompoundEyeCursor (orchestrator component)      │
│  - Mouse tracking, page lifecycle, fade in/out   │
│  - Aggregates layout data from PageSpread ref     │
│  - Computes facet positions from mouse coords     │
├─────────────────────────────────────────────────┤
│  HexFacetRenderer (SVG overlay per frame)        │
│  - 19 hexagonal clip-paths                        │
│  - Per-facet text extraction + magnified render   │
│  - SVG filters (barrel distortion + chromatic)    │
├─────────────────────────────────────────────────┤
│  LayoutQueryEngine (pure functions, testable)     │
│  - facetBounds(): compute 19 hexagon BBoxes       │
│  - findTextInFacet(): overlap check per line      │
│  - generateHexClipPath(): SVG clipPath d-string   │
└─────────────────────────────────────────────────┘
```

The cursor component wraps the `PageSpread` via a ref, gaining access to the layout state (title lines, body lines, pull quote position, figure rect). On each `mousemove`, it queries the layout to find text fragments inside each hexagonal facet, then renders those fragments as SVG `<text>` elements clipped and filtered.

---

## Step-by-Step Tasks

### Phase 1: Pure Math — Hexagonal Grid & Overlap Detection

**File: `src/utils/hex-facet-grid.ts`** (NEW)

This is a deep, testable module with zero dependencies on React or the DOM. It contains pure functions for:

1. **`generateFacetCenters(cursorX: number, cursorY: number, radius: number): Point[]`**
   - Returns 19 facet centers in a hexagonal ring pattern (center + ring 1 (6) + ring 2 (12))
   - Radius parameter controls the spacing between facets (recommend ~18px)
   - Overall cursor diameter ~72px

2. **`hexagonPath(cx: number, cy: number, radius: number): string`**
   - Returns an SVG `d` path string for a flat-topped hexagon centered at (cx, cy)
   - Used for `<clipPath>` rendering

3. **`hexagonBBox(cx: number, cy: number, radius: number): Rect`**
   - Returns the axis-aligned bounding box of a hexagon (for fast overlap culling)

4. **`findTextInFacet(lines: LayoutLine[], facetBBox: Rect, facetCx: number, facetCy: number, facetRadius: number): FacetTextData`**
   - Given pretext layout lines and a facet's bounds, returns which text fragments fall within the facet
   - Uses simple AABB overlap check first, then point-in-hexagon for characters near edges
   - Returns `{ text: string, relativeX: number, relativeY: number }[]` — text positioned relative to facet center

5. **`pointInHexagon(px: number, py: number, cx: number, cy: number, radius: number): boolean`**
   - Point-in-flat-topped-hexagon test (pure arithmetic)

**Tests: `src/utils/__tests__/hex-facet-grid.test.ts`** (NEW)
- Test `generateFacetCenters` returns exactly 19 points at correct distances
- Test `hexagonBBox` returns correct bounds
- Test `pointInHexagon` with known points inside/outside
- Test `findTextInFacet` with mock line data

**Why this module first?** It has no React/DOM dependencies. You can develop and test it in isolation. The entire cursor depends on this being correct.

---

### Phase 2: SVG Filter Definitions

**File: `src/components/CompoundEyeCursor.tsx`** (NEW — partial)

The SVG filter for barrel distortion + chromatic aberration is defined once, statically, inside the component:

```tsx
const SVG_FILTERS = (
  <defs>
    {/* Barrel distortion — radial displacement map */}
    <filter id="compound-eye-barrel" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="1" seed="0" result="noise" />
      <feColorMatrix type="saturate" values="0" in="noise" result="grayNoise" />
      <feComponentTransfer in="grayNoise" result="scaledNoise">
        <feFuncR type="linear" slope="0.03" />
        <feFuncG type="linear" slope="0.03" />
        <feFuncB type="linear" slope="0.03" />
      </feComponentTransfer>
      <feDisplacementMap in="SourceGraphic" in2="scaledNoise" scale="4" xChannelSelector="R" yChannelSelector="G" />
    </filter>

    {/* Chromatic aberration — red channel shifted */}
    <filter id="chromatic-red" x="-20%" y="-20%" width="140%" height="140%">
      <feOffset dx="-1.5" dy="0" result="shifted" />
      <feColorMatrix type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.6 0" />
    </filter>

    {/* Chromatic aberration — blue channel shifted */}
    <filter id="chromatic-blue" x="-20%" y="-20%" width="140%" height="140%">
      <feOffset dx="1.5" dy="0" result="shifted" />
      <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 0.6 0" />
    </filter>
  </defs>
)
```

**Note:** These filter parameters will likely need tuning during visual testing. Start with small displacement values and increase until the effect looks right.

---

### Phase 3: CompoundEyeCursor Component

**File: `src/components/CompoundEyeCursor.tsx`** (NEW — full)

#### Props
```ts
interface CompoundEyeCursorProps {
  /** Ref to the PageSpread's container div — needed to read layout state */
  spreadRef: React.RefObject<HTMLDivElement | null>
  /** Bounding box of the figure to exclude (from PageSpread layout) */
  figureRect?: { x: number; y: number; width: number; height: number } | null
  /** Whether to show the cursor (controlled by parent for fade-out) */
  visible: boolean
}
```

#### Internal structure

```
CompoundEyeCursor
├── invisible container div (absolute, inset 0, pointer-events: none)
│   └── <svg> overlay (fixed position, full viewport size)
│       ├── <defs> (SVG filters — static)
│       └── <g transform="translate(mouseX, mouseY)"> (moves with cursor)
│           ├── 19x <g> (one per facet)
│           │   ├── <clipPath> (hexagonal)
│           │   ├── <g clip-path="..."> (clipped group)
│           │   │   ├── <text> (blue channel, with chromatic-blue filter)
│           │   │   ├── <text> (red channel, with chromatic-red filter)
│           │   │   └── <text> (normal — green channel)
│           │   └── <path> (hexagonal border stroke)
│           └── center dot / decorative element
```

#### Behavior

1. **Mouse tracking**: `window.addEventListener('mousemove', ...)` — stores `(x, y)` in a ref
2. **Layout query**: On each mousemove, read the PageSpread's layout data from the ref. The spread component stores its layout in state, so we access it via `useImperativeHandle` or a shared context.
3. **Facet computation**: Call `generateFacetCenters(mouseX, mouseY, RADIUS)` to get 19 centers
4. **Per-facet text extraction**: For each facet, call `findTextInFacet(allTextLines, facetBBox, facetCx, facetCy, radius)`
5. **SVG render**: Each facet gets a `<g>` with clipPath, magnified text elements (3x for chromatic), and border stroke
6. **Figure exclusion**: If `figureRect` is provided and mouse is within it (with 20px padding), set `visible` internally to false

#### Key implementation details

- **Text rendering in SVG**: SVG `<text>` elements positioned at the correct coordinates, with the text content from each facet. Font matches the body font (`EB Garamond, 20px`) scaled by `1.5x` for magnification.
- **Magnification**: Apply `transform="scale(1.5)"` on the text group within each facet, with a compensating `translate` to center the magnification on the facet center.
- **Performance**: Use `useRef` for all mutable state. Only trigger re-render via `requestAnimationFrame` loop, not on every mousemove. This keeps the render loop decoupled from mouse event frequency.
- **Fade in/out**: CSS `opacity` transition on the root SVG element, controlled by the `visible` prop.

---

### Phase 4: PageSpread Ref Exposure

**File: `src/components/PageSpread.tsx`** (MODIFY)

The `PageSpread` component already uses `React.forwardRef` but the ref is typed as `HTMLDivElement`. We need to expose the internal layout state to the cursor.

**Approach**: Create an interface that the ref resolves to:

```ts
export interface PageSpreadHandle {
  getLayout: () => {
    bodyLines: PositionedLine[]
    titleLines: PositionedLine[]
    pullQuoteBlock: { x: number; y: number; width: number; height: number } | null
    figureRect: Rect | null
  } | null
}
```

Changes:
1. Add `useImperativeHandle` to expose `getLayout()` method
2. Change ref type from `HTMLDivElement` to `PageSpreadHandle | HTMLDivElement` (or use a separate ref for layout access)
3. The container ref stays as-is; add a second `useImperativeHandle` ref for layout access

**Alternative (simpler)**: Use a shared context. Create `LayoutDataContext` that `PageSpread` provides and `CompoundEyeCursor` consumes. This avoids ref gymnastics.

**Recommendation**: Go with the **shared context** approach. It's cleaner, more React-idiomatic, and doesn't fight the forwardRef pattern.

---

### Phase 5: Shared Layout Context

**File: `src/context/LayoutDataContext.tsx`** (NEW)

```ts
interface LayoutData {
  bodyLines: PositionedLine[]
  titleLines: PositionedLine[]
  pullQuoteBlock: { x: number; y: number; width: number; height: number } | null
  figureRect: Rect | null
}

interface LayoutDataContextType {
  layout: LayoutData | null
  setLayout: (layout: LayoutData | null) => void
}
```

- `PageSpread` calls `setLayout(result)` after computing layout
- `CompoundEyeCursor` reads `layout` from context
- No re-renders of the page when cursor moves (cursor uses refs + rAF, not React state)

---

### Phase 6: CompoundEyePage Integration

**File: `src/components/pages/CompoundEyePage.tsx`** (MODIFY)

Current structure:
```tsx
export function CompoundEyePage() {
  return <PageSpread config={config} />
}
```

New structure (following `AntennaePage` pattern):
```tsx
export function CompoundEyePage() {
  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      <PageSpread config={config} />
      <CompoundEyeCursor />
    </div>
  )
}
```

The `CompoundEyeCursor` reads layout from the shared context, manages its own mouse tracking and rAF loop, and fades in/out based on page lifecycle.

---

### Phase 7: App.tsx Integration

**File: `src/App.tsx`** (MODIFY)

Wrap the page rendering with `LayoutDataProvider`:

```tsx
<LayoutDataProvider>
  <PageThemeProvider ...>
    <PageReveal>
      <PageComponent />
    </PageReveal>
  </PageThemeProvider>
</LayoutDataProvider>
```

This ensures the context is available to both `PageSpread` (writer) and `CompoundEyeCursor` (reader) on every page. On pages without the cursor, the context simply goes unused.

---

### Phase 8: CSS Styling

**File: `src/styles/pages/vision.css`** (MODIFY)

Add:
1. `.compound-eye-cursor` — base styles for the SVG overlay
2. `.compound-eye-cursor svg` — full viewport coverage, pointer-events: none
3. `.compound-eye-facet-border` — stroke styles for hexagon borders
4. `.compound-eye-cursor.fade-in` / `.fade-out` — transition classes
5. `body:has(.compound-eye-cursor.visible)` — `cursor: none` to hide default cursor
6. `@media (prefers-reduced-motion)` — skip transitions

---

### Phase 9: Performance Optimization

After the basic implementation works:

1. **Debounced layout reads**: The layout data only changes on resize, not on mousemove. Cache it in a ref and only update when `layout` context changes.
2. **rAF loop discipline**: The render loop should only run when the cursor is visible and the mouse has moved since last frame. Cancel rAF when idle.
3. **SVG filter resolution**: Set `filterUnits="userSpaceOnUse"` with tight bounds per facet. Avoid `objectBoundingBox` which can cause filter region clipping.
4. **Fallback path**: If SVG filters cause performance issues on lower-end machines, add a simplified path that uses CSS `transform: perspective()` with slight rotation per facet for a fake distortion effect.

---

## File Change Summary

| File | Action | Description |
|------|--------|-------------|
| `src/utils/hex-facet-grid.ts` | **NEW** | Pure math: hex grid generation, overlap detection, clip path generation |
| `src/utils/__tests__/hex-facet-grid.test.ts` | **NEW** | Unit tests for hex facet grid math |
| `src/context/LayoutDataContext.tsx` | **NEW** | Shared context for PageSpread → CompoundEyeCursor layout data |
| `src/components/CompoundEyeCursor.tsx` | **NEW** | Main cursor component (mouse tracking, SVG rendering, filters) |
| `src/components/PageSpread.tsx` | **MODIFY** | Publish layout state to LayoutDataContext after each layout pass |
| `src/components/pages/CompoundEyePage.tsx` | **MODIFY** | Wrap in relative container, add CompoundEyeCursor |
| `src/App.tsx` | **MODIFY** | Add LayoutDataProvider wrapper |
| `src/styles/pages/vision.css` | **MODIFY** | Add cursor styles, fade transitions, reduced-motion support |

---

## Execution Order

```
1. hex-facet-grid.ts + tests          ← pure math, no dependencies
2. LayoutDataContext.tsx              ← plumbing, trivial
3. PageSpread.tsx modification        ← publish layout to context
4. CompoundEyeCursor.tsx (basic)      ← SVG rendering without filters
5. CompoundEyeCursor.tsx (filters)    ← add barrel distortion + chromatic
6. CompoundEyePage.tsx integration    ← wire it up
7. App.tsx integration                ← add provider
8. vision.css                         ← styling, transitions
9. Performance tuning                  ← rAF optimization, filter tuning
10. Manual visual testing             ← cross-browser, reduced-motion
```

Steps 1-2 can be done in parallel with no other changes. Steps 3-8 are sequential. Step 9 is iterative after 8 works. Step 10 is ongoing throughout.

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| SVG filters too slow on some GPUs | High | Fallback to CSS transform-based distortion; reduce filter resolution |
| Text rendering in SVG doesn't match DOM font exactly | Medium | Use same font-family string; accept minor differences as aesthetic |
| Chromatic aberration creates visual noise | Medium | Make channel offset tunable; start small (1px) and increase |
| Context re-renders cause page layout thrashing | Low | Cursor uses refs + rAF, not context reads in render path |
| Figure exclusion edge cases | Low | Add 20px padding to figure rect check; test thoroughly |
