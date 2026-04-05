# Butterfly Feature — Implementation Plan

> **3 issues to fix, in execution order.**
> Do not stop until all 3 are running and verified.

---

## Issue Diagnosis First — Why Each Thing Is Broken

### Issue A — RTL (right-to-left) flight collides with text

**Root cause: the slot-picker always takes the widest slot.**

In `spread-layout.ts` line 94–98:
```ts
let slot = slots[0]!
for (let i = 1; i < slots.length; i++) {
  const c = slots[i]!
  if (c.right - c.left > slot.right - slot.left) slot = c   // widest wins
}
```

When the butterfly flies **left-to-right**, it sits near the LEFT edge of a line.
The obstacle blocks the left end of the line. The right slot is wider → it is
picked → text correctly moves to the right of the butterfly. ✅

When the butterfly flies **right-to-left**, it sits near the RIGHT edge of a line.
The obstacle now blocks the right end of the line. The left slot (from the left
margin to the butterfly's left edge) is wider → it IS picked, BUT the text
starts at `slot.left` which is the left margin, and the line grows rightward —
RIGHT INTO the butterfly, because the butterfly's rect is on the right and the
text fills the wide left slot which ENDS at the butterfly's left edge.

Wait — that should actually be fine... Let me re-examine:

**The real root cause** is more subtle:

On backward (RTL) flight, `getEndPos()` returns:
```ts
{ x: a.lastWord.x - BUTTERFLY_SIZE, y: a.lastWord.y - 8 }
```
The butterfly is positioned at `left: position.x`. The obstacle rect is:
```ts
rect: { x: pos.x, y: pos.y, width: BUTTERFLY_SIZE, height: BUTTERFLY_SIZE }
```

This is correct geometry. But the flight path during backward flight targets
`1 - progress` through the waypoints which were generated with `start` →
`end` as forward direction. The waypoints swing perpendicular to the
forward axis. When reversed, the butterfly traces the same spatial path
but its `pos.x` / `pos.y` at any given moment is a reflected position along
the same curve. **The obstacle rect is still 56×56 anchored at `pos.x, pos.y`.
This is correctly positioned.**

The actual collision during backward flight:
- The butterfly is moving from right → left
- As it passes a line's BAND, it is partially overlapping the START of that
  line (left side)
- `BandObstacle` fires `onObstacleChange` with the current rect
- `PageSpread` runs `layoutText` with that rect as an obstacle
- The obstacle's `rect.x` is the butterfly's current LEFT edge
- `getRectIntervalsForBand` produces:
  ```
  { left: obs.rect.x - hPad, right: obs.rect.x + BUTTERFLY_SIZE + hPad }
  ```
- `carveTextLineSlots` carves out the full 56px + padding band from the line
- HOWEVER — `getEndPos()` sets butterfly end position as
  `a.lastWord.x - BUTTERFLY_SIZE` which places the WIDTH of the butterfly to
  the LEFT of the last word's right edge. During reverse flight the butterfly
  moves its LEFT edge from near `lastWord.x - BUTTERFLY_SIZE` back toward
  `firstWord.x`.
- **The actual bug:** During reverse flight, the butterfly SVG is rendered at
  `left: pos.x` but the VISUAL bounds of the wing shapes extend LEFT of `pos.x`
  because the wing `wingsOpen.lf` path starts from x=10 in a 60-wide viewBox,
  so the visual left edge of the SVG = `pos.x` and visual right edge =
  `pos.x + 56`. This is consistent.
- **The REAL problem:** `flightPath()` returns `{ x: raw.x - BUTTERFLY_SIZE/2, y: raw.y - BUTTERFLY_SIZE/2 }` — centering the 56px box on the spline point. But `getStartPos` and `getEndPos` do NOT center — they use the raw anchor coordinates with fixed offsets. So during flight the obstacle rect is a CENTERED box on the spline, but at rest it is an OFFSET box. On forward flight this doesn't matter much. On backward flight, as the butterfly approaches the start anchor (left margin), the centered spline rect is in a different place than the settled rect, creating a momentary misalignment where text hasn't yet cleared the space where the butterfly is.
- **Even more specifically:** The waypoints during flight swing the butterfly above and below the text lines. When swinging ABOVE a line, the obstacle rect (y = spline_y - 28) may be above the current text band, causing zero blocking, so text fills the full width, then the butterfly sweeps DOWN into the rendered text. This is the visual "collapse": text hasn't routed because the butterfly was above the band when the obstacle was reported.

**The fix:** Vertically expand the obstacle rect by the swing amplitude to guarantee the band check fires a frame BEFORE the butterfly enters the band.

---

### Issue B — Padding around butterfly (too much horizontal/vertical clearance)

**Root cause:** `makeObstacle` uses a fixed `rect` of `BUTTERFLY_SIZE × BUTTERFLY_SIZE` (56×56) with `horizontalPadding: 16` (mid-flight) or `16` (settled). The actual butterfly wing shapes in the SVG viewbox do NOT fill the full 56×56 bounding box. The forewing tip is at x≈10 and x≈50, body center at x=30. The wing shapes are much narrower at top/bottom and wider in the middle. A 56×56 rect with 16px extra padding = 88px total blocked width, which is far too wide for a 56px SVG where the actual opaque pixels are narrower.

**The fix:** Replace the axis-aligned rect obstacle with a POLYGON obstacle using `getPolygonIntervalForBand` (already in `wrap-geometry.ts`). The polygon hull is computed from the butterfly's actual SVG wing paths projected to world space.

---

### Issue C — Butterfly starts at first word, not at drop cap

**Root cause:** The drop cap is a separate DOM element in the editorial-engine demo. In the project's `PageSpread.tsx`, there is NO drop cap at all — the first body line starts at `first.x, first.y` and the butterfly snaps to `firstWord: { x: first.x, y: first.y }`. This puts the butterfly at the leftmost pixel of the first body line (the "T" of the text), not at a drop capital.

Additionally the Wings page body text first word is "To" — a regular body line. No drop cap obstruction exists in the layout, so `first.x` is simply the left gutter.

**The fix:** Two parts:
1. Add a visual drop capital (the "T" of "To") rendered like `editorial-engine.ts` — positioned absolutely, large, same Playfair Display font, colored with ochre.
2. Register the drop cap as a rect obstacle so body text routes around it (first 3 body lines indent past it — same pattern as the editorial demo).
3. Set `firstWord` anchor to `{ x: dropCapRight, y: dropCapTop }` — i.e. the RIGHT edge of the drop cap rect, so the butterfly rests to the right of the drop cap at the body text start position.

---

## The 3 Tasks — Execution Sequence

```
Task 1: Fix RTL collision bug                 (no new APIs needed)
Task 2: Drop cap — add, obstacle, fix anchor  (pure layout work)
Task 3: SVG-exact polygon obstacle            (new function in spread-layout)
```

Do them in this order. Each is independently verifiable.

---

## Task 1 — Fix RTL (backward flight) text collision

### Why it fails (precise)

1. `flightPath(progress, 'reverse')` computes `t = 1 - progress`, runs through
   spline, then centers the 56px box: `{ x: raw.x - 28, y: raw.y - 28 }`.
2. The butterfly's swing waypoints can place the spline point 100+ px above a
   text line band. When `pos.y - 28 < bandTop`, the obstacle fires with a rect
   that is ABOVE the band → zero interval computed → text fills full width.
3. One frame later the butterfly drops into the band → collision.
4. The `transition: left 150ms, top 150ms` on `.butterfly-text-line` means text
   takes 150ms to visually relocate — during which the butterfly is already
   overlapping.
5. On FORWARD flight this is less visible because text pushes rightward as
   the butterfly moves right, but on BACKWARD flight text pushes leftward as
   the butterfly moves left, so the collision is more pronounced.

### Fix

**In `Butterfly.tsx` — expand the obstacle rect vertically when flying.**

Replace the single `makeObstacle` call in the animation loop with a version that
expands the rect upward by the line height (32px) to ensure the band check fires
a line early:

```ts
// Current (line 133):
onObstacleChangeRef.current?.(makeObstacle(pos, Math.round(16 * edgeFactor)))

// Fix — expand vertical reach by BODY_LINE_HEIGHT / 2 so the obstacle fires
// before the butterfly enters the band from above:
const VERTICAL_LOOKAHEAD = 16   // half a body line height
const obs: BandObstacle = {
  rect: {
    x: pos.x,
    y: pos.y - VERTICAL_LOOKAHEAD,          // start checking one half-line earlier
    width: BUTTERFLY_SIZE,
    height: BUTTERFLY_SIZE + VERTICAL_LOOKAHEAD * 2,  // symmetric expansion
  },
  horizontalPadding: Math.round(16 * edgeFactor),
  verticalPadding: 0,  // already expanded the rect, no extra vPad needed
}
onObstacleChangeRef.current?.(obs)
```

**In `spread-layout.ts` — on backward flight, prefer the LEFT slot when two
slots have similar widths (within 20px).**

Why: on backward (LTR → RTL) pass, the butterfly is on the right side of the
line. The LEFT slot is the correct text placement. But the current heuristic
picks the WIDEST slot, which may be the right slot when the butterfly is near
the middle.

Change the slot selection logic from:

```ts
// Current: always pick widest
let slot = slots[0]!
for (let i = 1; i < slots.length; i++) {
  const c = slots[i]!
  if (c.right - c.left > slot.right - slot.left) slot = c
}
```

To a context-aware picker. `spread-layout.ts` needs to know whether a
"butterfly hint" prefers left or right. The cleanest API addition:

```ts
// Add to spread-layout.ts layoutText signature:
export function layoutText(
  text: string,
  font: string,
  lineHeight: number,
  region: Rect,
  obstacles: BandObstacle[],
  slotPreference?: 'left' | 'right' | 'widest',   // NEW, default 'widest'
): LayoutResult
```

Then in `WingsPage.tsx`, pass the current flight direction:
```ts
// WingsPage.tsx — track direction:
const [flightDir, setFlightDir] = useState<'ltr' | 'rtl'>('ltr')
// Update in onObstacleChange or a new callback from Butterfly

// Pass to PageSpread:
<PageSpread
  ...
  butterflySlotPreference={phase === 'flying-backward' ? 'left' : 'right'}
/>
```

Actually simpler: use the butterfly's X position relative to the page center as
a proxy. If butterfly.x < pageCenter → butterfly is moving left → text should
prefer left slot. This keeps `PageSpread` stateless w.r.t. direction.

**Simplest correct fix without API changes:**

Replace widest-slot with: *prefer the slot that does NOT contain the butterfly's
horizontal center.* Compute butterfly center from the obstacle rect:

```ts
// In spread-layout.ts layoutText, after computing slots:
const butterflyCenterX = butterflyObstacle
  ? butterflyObstacle.rect.x + butterflyObstacle.rect.width / 2
  : null

let slot = slots[0]!
for (let i = 1; i < slots.length; i++) {
  const c = slots[i]!
  const cW = c.right - c.left
  const bestW = slot.right - slot.left
  if (butterflyCenterX !== null && slots.length === 2) {
    // Pick the slot that does NOT contain the butterfly center
    const slotContainsButterfly = c.left <= butterflyCenterX && butterflyCenterX <= c.right
    const bestContainsButterfly = slot.left <= butterflyCenterX && butterflyCenterX <= slot.right
    if (!slotContainsButterfly && bestContainsButterfly) { slot = c; continue }
    if (!bestContainsButterfly && slotContainsButterfly) { continue }
  }
  if (cW > bestW) slot = c
}
```

This ensures text always goes to the side that doesn't contain the butterfly
center — which is correct for both directions.

### Files changed
- `src/components/Butterfly.tsx` — expand obstacle rect vertically
- `src/components/spread-layout.ts` — butterfly-aware slot selection

---

## Task 2 — Drop capital + correct butterfly start anchor

### What the editorial demo does (editorial-engine.ts lines 283-299, 827-832, 864)

```ts
// 1. Measure the drop cap letter
const DROP_CAP_SIZE = BODY_LINE_HEIGHT * DROP_CAP_LINES - 4  // 86px
const DROP_CAP_FONT = `700 ${DROP_CAP_SIZE}px ${HEADLINE_FONT_FAMILY}`
const DROP_CAP_TEXT = BODY_TEXT[0]!   // just the first character "T"
walkLineRanges(preparedDropCap, 9999, line => { dropCapWidth = line.width })
const DROP_CAP_TOTAL_W = Math.ceil(dropCapWidth) + 10
// → ~58px for "T" at 86px

// 2. Position as absolute DOM element
dropCapEl.style.left = `${column0X}px`
dropCapEl.style.top = `${bodyTop}px`

// 3. Register as rect obstacle so body text routes around it
const dropCapRect: RectObstacle = {
  x: column0X - 2,
  y: bodyTop - 2,
  w: DROP_CAP_TOTAL_W,
  h: DROP_CAP_LINES * BODY_LINE_HEIGHT + 2,  // 3 lines × 30px = 90px
}
// cursor starts at graphemeIndex: 1 (skip the first char — the drop cap)
let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 1 }
```

### Adaptation for PageSpread + WingsPage

`PageSpread.tsx` doesn't do drop caps. The cleanest integration: add an optional
`dropCap` config field in `SpreadConfig`, handle it inside `PageSpread.tsx`.

```ts
// In PageSpread.tsx — add to SpreadConfig:
export interface SpreadConfig {
  // ...existing fields...
  dropCap?: boolean   // If true, render first character as drop cap (3 lines tall)
}
```

Inside `computeLayout` in `PageSpread.tsx`:
1. If `config.dropCap === true`, extract `BODY_TEXT[0]` (first char).
2. Measure it at `DROP_CAP_LINES × BODY_LINE_HEIGHT` tall using the title font.
3. Add it as a rect obstacle in `figureObstacles` (not the butterfly list).
4. Start the body text cursor at `{ segmentIndex: 0, graphemeIndex: 1 }`.
5. Return the drop cap geometry via a new `onAnchorPositions` field or as part
   of the layout state.

The `onAnchorPositions` callback needs to emit the drop cap's right edge as the
`firstWord` anchor:

```ts
// Instead of:
firstWord: { x: first.x, y: first.y }

// With drop cap:
firstWord: {
  x: dropCapRect.x + dropCapRect.width,   // right edge of drop cap
  y: dropCapRect.y,                        // top of drop cap = top of body
}
```

This places the butterfly to the right of the drop cap, at the exact point
where the first body line text begins on line 1.

### Rendering the drop cap

Add a positioned `<div>` or `<span>` inside the `spread-lines` container:

```tsx
{/* Drop cap */}
{layout?.dropCap && (
  <span
    className="spread-drop-cap"
    style={{
      position: 'absolute',
      left: `${layout.dropCap.x}px`,
      top: `${layout.dropCap.y}px`,
      font: layout.dropCap.font,
      lineHeight: `${layout.dropCap.size}px`,
      color: 'var(--ochre)',
      fontWeight: 700,
    }}
  >
    {layout.dropCap.char}
  </span>
)}
```

### Files changed
- `src/components/PageSpread.tsx` — add `dropCap` config option, render drop cap, register as obstacle, adjust cursor, adjust `firstWord` anchor
- `src/components/pages/WingsPage.tsx` — set `config.dropCap = true`
- `src/styles/book.css` — add `.spread-drop-cap` rule

---

## Task 3 — SVG-exact polygon obstacle (no bounding-box padding)

### Current approach (wrong)
`makeObstacle` returns a full 56×56 RECT for the butterfly. The actual opaque
wing pixels in the SVG viewbox span roughly:
- Upper left wing: x 7–30, y 10–30
- Upper right wing: x 30–53, y 10–30
- Lower left wing: x 12–30, y 30–55
- Lower right wing: x 30–48, y 30–55
- Body: x 27–33, y 20–40

The widest horizontal cross-section (wings fully open) is ~x=7 to x=53 ≈ 46px
wide not 56px, and near the top the wings are narrower (≈20px total). The rect
obstacle is thus 10-30px wider than the actual butterfly at most scan lines.

### The pretext approach (wrap-geometry.ts)

`getPolygonIntervalForBand(points, bandTop, bandBottom, hPad, vPad)` in
`wrap-geometry.ts` does exactly what we need:
- Takes a polygon in world coordinates (array of `{x, y}` points)
- For a given text band (bandTop…bandBottom), finds the leftmost and rightmost
  x coordinates that the polygon occupies in that band
- Returns `{ left: minX - hPad, right: maxX + hPad }`

This is already imported and used in the project's own `wrap-geometry.ts`
(the file is identical to the pretext demo's version — it's a copy).

### Static butterfly polygon

The butterfly SVG paths in the `wingsOpen` state are fixed cubic beziers.
We need to convert them to a polygon hull (list of {x,y} points in viewBox
coordinates = 0–60 range, then scale to world coordinates at render time).

**Pre-computed hull from SVG paths** (at `wingsOpen` state, 60×60 viewBox):

Forewing left: `M30 30 C25 18 13 10 10 20 C7 30 18 35 30 30Z`
Forewing right: `M30 30 C35 18 47 10 50 20 C53 30 42 35 30 30Z`
Hindwing left: `M30 30 C22 35 10 40 12 48 C15 55 25 42 30 35Z`
Hindwing right: `M30 30 C38 35 50 40 48 48 C45 55 35 42 30 35Z`
Body: ellipse cx=30, ry=10 → x=27..33, y=20..40

We trace these paths by sampling at ~2px intervals using the browser's
`SVGPathElement.getPointAtLength()` API (one-time cost, runs once on mount).
The hull is a minimal convex envelope in viewBox-normalized coordinates (0..1).

**The `getWrapHull` approach from pretext** works for image alpha channels.
We need an SVG-native equivalent that samples path points.

**Implementation plan — two options:**

**Option A (simplest, no new API):** Hard-code the polygon hull analytically
from the SVG path control points. Sample ~30 points around the wing outlines
manually, normalise to 0..1, store as a constant array in `Butterfly.tsx`.
This is a one-time manual calculation, very fast at runtime.

**Option B (correct, slightly more work):** On mount, render the SVG off-screen,
call `getPointAtLength` on each `<path>` element at regular intervals, collect
all points, compute convex hull (using `makeConvexHull` already in
`wrap-geometry.ts`), normalise to 0..1. Cache as a module-level constant
after first mount.

Use **Option A** for initial implementation (simpler, no async), migrate to B
later.

### Integrating polygon obstacle into BandObstacle type

`BandObstacle` in `spread-layout.ts` currently only has `rect`:
```ts
export type BandObstacle = {
  rect: Rect
  horizontalPadding: number
  verticalPadding: number
}
```

We need to add an optional `polygon` field:
```ts
export type BandObstacle = {
  rect: Rect                  // bounding box (used for fast broad-phase cull)
  polygon?: Point[]           // refined polygon, world coordinates
  horizontalPadding: number
  verticalPadding: number
}
```

In `spread-layout.ts` `layoutText`, change obstacle interval computation:
```ts
// Current:
const intervals = getRectIntervalsForBand(
  [obs.rect], bandTop, bandBottom,
  obs.horizontalPadding, obs.verticalPadding)

// New:
let interval: Interval | null
if (obs.polygon && obs.polygon.length > 0) {
  interval = getPolygonIntervalForBand(
    obs.polygon, bandTop, bandBottom,
    obs.horizontalPadding, obs.verticalPadding)
} else {
  const rects = getRectIntervalsForBand(
    [obs.rect], bandTop, bandBottom,
    obs.horizontalPadding, obs.verticalPadding)
  interval = rects[0] ?? null
}
if (interval) blocked.push(interval)
```

### Butterfly polygon in world coordinates

`Butterfly.tsx` needs to transform the normalised hull to world coordinates
every frame:
```ts
// normalHull: Point[] in 0..1 range (pre-computed from SVG viewbox)
// pos: current { x, y } in page pixels
// BUTTERFLY_SIZE = 56

function getWorldPolygon(normalHull: Point[], pos: Point): Point[] {
  return normalHull.map(p => ({
    x: pos.x + p.x * BUTTERFLY_SIZE,
    y: pos.y + p.y * BUTTERFLY_SIZE,
  }))
}

// In makeObstacle / obstacle emission:
const worldPoly = getWorldPolygon(BUTTERFLY_NORMAL_HULL, pos)
const obs: BandObstacle = {
  rect: { x: pos.x, y: pos.y, width: BUTTERFLY_SIZE, height: BUTTERFLY_SIZE },
  polygon: worldPoly,
  horizontalPadding: 2,   // minimal — the polygon already traces the wing edge
  verticalPadding: 0,
}
```

### Pre-computed normalised hull (Option A — hardcoded)

Sample 32 points from the four wing beziers at `wingsOpen`, compute convex hull,
normalise to 0..1 range. Approximate result (will be refined at implementation):

```ts
// Approximate convex hull of the butterfly SVG wings (0..1 normalised, 60×60 viewbox)
const BUTTERFLY_NORMAL_HULL: Point[] = [
  { x: 0.167, y: 0.167 },  // left forewing tip
  { x: 0.333, y: 0.167 },  // top-center
  { x: 0.500, y: 0.167 },  // top-center-right
  { x: 0.833, y: 0.333 },  // right forewing tip
  { x: 0.883, y: 0.500 },  // right mid
  { x: 0.800, y: 0.800 },  // right hindwing outer
  { x: 0.500, y: 0.917 },  // bottom
  { x: 0.200, y: 0.800 },  // left hindwing outer
  { x: 0.167, y: 0.500 },  // left mid
]
```

These will be precisely computed by sampling the SVG paths at implementation time.

### Size adjustment

With the polygon obstacle replacing the rect + padding, the effective clearance
is much tighter — essentially 2px around the actual wing edge. The butterfly
SVG can be upsized if desired (eg. `BUTTERFLY_SIZE = 72` for more visual impact)
without over-blocking text, since text routes around the TRUE wing shape.

The `BUTTERFLY_SIZE` constant controls both the SVG `width`/`height` attribute
AND the scale of the world polygon. Adjust it to whatever looks good visually.

### Files changed
- `src/components/spread-layout.ts` — add polygon field to `BandObstacle`, use `getPolygonIntervalForBand` when polygon present
- `src/layout-engine/wrap-geometry.ts` — already has `getPolygonIntervalForBand` ✅ (no changes needed)
- `src/components/Butterfly.tsx` — add `BUTTERFLY_NORMAL_HULL`, compute world polygon, emit polygon in obstacle, remove artificial hPad (set to 2), adjust `BUTTERFLY_SIZE` if needed
- `src/components/PageSpread.tsx` — no changes needed (BandObstacle type update handles it)

---

## Individual Animated Words — Research Finding

From `03-api-reference/inline-flow-api.md` and the pretext source:

The **inline-flow** module (`@chenglou/pretext/inline-flow`) supports per-word/per-fragment positioning via `walkInlineFlowLines()`. Each call to `onLine` gives you an `InlineFlowLine` with `fragments[]`, each fragment having:
- `itemIndex` — which text run it came from
- `text` — the slice of text
- `occupiedWidth` — its pixel width
- `start` / `end` cursors

This enables **individual word elements** — one `<span>` per word — for hover animations, word-level animations, etc.

For the butterfly feature, word-level spans could enable:
- Each word to animate independently as the butterfly passes through
- A "scattering" effect where words drift apart and reform
- Word-level color transitions

**This is NOT needed for the 3 current tasks.** Document for future use.

Pattern to use when implementing:
```ts
// Replace current body line pool (one span per line) with one span per word

import { prepareInlineFlow, walkInlineFlowLines } from '@chenglou/pretext/inline-flow'

// Treat every word as its own InlineFlowItem:
const wordItems = bodyText.split(' ').map(word => ({
  text: word + ' ',
  font: BODY_FONT,
}))
const prepared = prepareInlineFlow(wordItems)

walkInlineFlowLines(prepared, slotWidth, line => {
  for (const frag of line.fragments) {
    // render one span per fragment (≈ one word)
    const span = document.createElement('span')
    span.className = 'body-word'
    span.textContent = frag.text
    span.style.left = `${xOffset + frag.gapBefore}px`
    span.style.top = `${lineY}px`
    stage.appendChild(span)
    xOffset += frag.occupiedWidth + frag.gapBefore
  }
})
```

**Caveat:** The current project uses `layoutNextLine` via `prepareWithSegments`,
not `prepareInlineFlow`. Switching to per-word spans would require:
1. Using `inline-flow` or manually splitting by word boundaries from the
   prepared segment data.
2. Managing a pool of word-level DOM elements instead of line-level spans.
3. Reconsidering the `spread-layout.ts` abstraction (currently returns
   `PositionedLine`, not positioned words).

This is a larger refactor — flag as future work.

---

## Execution Checklist

```
[ ] Task 1 — RTL fix
    [ ] 1a. Expand obstacle rect vertically (VERTICAL_LOOKAHEAD = 16)
    [ ] 1b. Implement butterfly-center-aware slot picker in spread-layout.ts
    [ ] 1c. Forward flight still works (verify manually)
    [ ] 1d. Backward flight no longer clips text (verify manually)

[ ] Task 2 — Drop cap
    [ ] 2a. Add dropCap?: boolean to SpreadConfig
    [ ] 2b. Measure drop cap letter with walkLineRanges in computeLayout
    [ ] 2c. Register drop cap as rect obstacle in figureObstacles
    [ ] 2d. Start body cursor at graphemeIndex: 1
    [ ] 2e. Render drop cap <span> with ochre color
    [ ] 2f. Emit drop cap right edge as firstWord anchor
    [ ] 2g. Enable dropCap: true in WingsPage.tsx config
    [ ] 2h. Butterfly now rests to the right of the drop cap ✓

[ ] Task 3 — Polygon obstacle
    [ ] 3a. Add polygon?: Point[] to BandObstacle in spread-layout.ts
    [ ] 3b. Add getPolygonIntervalForBand branch in layoutText obstacle loop
    [ ] 3c. Sample SVG paths to derive normalised hull points (or compute precisely)
    [ ] 3d. Add BUTTERFLY_NORMAL_HULL constant in Butterfly.tsx
    [ ] 3e. Add getWorldPolygon() function
    [ ] 3f. Emit polygon: worldPoly in obstacle, set horizontalPadding: 2
    [ ] 3g. Verify text hugs wing shape on both sides
    [ ] 3h. Adjust BUTTERFLY_SIZE if needed for visual clarity
```

---

## File Map

| File | Task | Change |
|---|---|---|
| `src/components/Butterfly.tsx` | 1, 3 | Vertical expand obstacle; add polygon hull; adjust size |
| `src/components/spread-layout.ts` | 1, 3 | Butterfly-center slot picker; polygon interval branch |
| `src/components/PageSpread.tsx` | 2 | Drop cap obstacle, render, firstWord anchor update |
| `src/components/pages/WingsPage.tsx` | 2 | `dropCap: true` in config |
| `src/styles/book.css` | 2 | `.spread-drop-cap` style rule |
| `src/layout-engine/wrap-geometry.ts` | — | No changes (already has getPolygonIntervalForBand) |
