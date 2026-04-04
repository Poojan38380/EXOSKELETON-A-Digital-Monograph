# Butterfly Effect — Current Feature Status

> **Page:** II — "The Architecture of Wings" (`WingsPage.tsx`)
> **Last updated:** 2026-04-04
> **Docs warning:** The old plan docs (`docs/old-plans/plan0/`) are out of date —
> treat the **source files as ground truth**.

---

## What is this feature?

An interactive SVG butterfly lives on page 2 (Wings). It rests at the first
word of the body text. When you **click it**, it flies along a randomised
Catmull-Rom spline path to the last word, then rests there. Click again and it
flies back. While in flight, the butterfly is a live **layout obstacle** — the
Pretext text-layout engine reroutes body lines around it in real time, so text
literally parts as the butterfly passes through.

---

## Architecture — how the pieces fit together

```
WingsPage.tsx
 ├── PageSpread           (layout engine host)
 │    ├── onAnchorPositions ──────────────────▶ WingsPage state
 │    └── butterflyObstacle ◀──────────────── WingsPage state
 └── Butterfly            (animation + SVG)
      ├── anchorPositions  ◀──────────────── WingsPage state
      └── onObstacleChange ──────────────────▶ WingsPage state
```

### Key data flows

| Signal | Direction | Purpose |
|---|---|---|
| `anchorPositions` | `PageSpread → Butterfly` | Pixel coords of first/last body-text word (clean layout, no butterfly) |
| `butterflyObstacle` | `Butterfly → PageSpread` | Butterfly's current bounding rect + padding, used as a layout obstacle |

**The clean/live split in `PageSpread.tsx` (lines 192–216) is the most important
design decision:** anchor positions are computed from a layout pass that never
includes the butterfly obstacle. This prevents the feedback loop where the
butterfly displaces its anchor word, which moves the butterfly, which displaces
the word again, infinitely.

---

## File inventory (butterfly-specific)

| File | Role |
|---|---|
| `src/components/Butterfly.tsx` | The entire butterfly — state machine, flight math, SVG render |
| `src/components/WingsPage.tsx` | Wires `PageSpread` ↔ `Butterfly` via shared state |
| `src/components/PageSpread.tsx` | Hosts the layout engine; accepts `butterflyObstacle`; emits `onAnchorPositions` |
| `src/components/spread-layout.ts` | Re-exports `BandObstacle` type; runs `layoutText` with obstacle list |
| `src/styles/book.css` (lines 348–395) | All butterfly CSS: text-line transitions, settle/rest animations, mobile hide |

---

## What is working ✅

### 1. Anchor tracking
`PageSpread` fires `onAnchorPositions` after every layout pass. It always uses
the **clean** result (no butterfly in the obstacle list), so the first/last body
word coordinates are stable regardless of the butterfly's position.

- **Start anchor:** left edge of the first body line (`first.x`, `first.y`)
- **End anchor:** right edge of the last body line (`last.x + last.width`, `last.y`)

### 2. Phase state machine
Four phases drive all behaviour:

```
at-start ──click──▶ flying-forward ──done──▶ at-end
at-end   ──click──▶ flying-backward ──done──▶ at-start
```

Phase transitions are clean — in-flight clicks are ignored.

### 3. Randomised Catmull-Rom flight path
Each click generates a fresh seeded random path via:
- `makePrng(seed)` — deterministic PRNG (splitmix32)
- `generateWaypoints(seed, start, end)` — 5 intermediate waypoints with
  perpendicular swing `(baseAmp = 10% of distance, extraAmp = 12%)`
- `splineAt(pts, t)` — Catmull-Rom evaluation
- `flutterT(t, seed)` — sine-envelope micro-flutter on top of `t`, giving an
  organic irregular feel rather than constant-speed interpolation

Flight duration: **13 000 ms** (13 s).

### 4. Live text displacement
While flying, `Butterfly` fires `onObstacleChange` at ~30 fps (throttled: only
when `timestamp - lastObstacleFrame > 33ms`). The obstacle is a 56×56 px rect
with **edge-ramped horizontal padding**:

```ts
edgeFactor = clamp(raw * 10, 0, 1) * clamp((1-raw) * 10, 0, 1)
horizontalPadding = round(16 * edgeFactor)   // 0 at edges, 16px mid-flight
```

This means text barely shifts when the butterfly is near its resting points,
and parts smoothly in the middle of the flight. `PageSpread` re-runs
`layoutText` with the butterfly added to the obstacle list, and all body lines
get `transition: left 150ms, top 150ms` (`.butterfly-text-line` rule) so the
reflow looks fluid instead of jumpy.

### 5. SVG wing animation
The butterfly is a 60×60 viewBox inline SVG with four wing paths (upper left/right,
lower left/right). Wings are drawn in two keyframe shapes:
- `wingsOpen` — full spread
- `wingsMid` — partially closed

When `isFlying`, `<animate>` elements cycle between them at **0.5 s / `calcMode="spline"`**,
giving an organic flapping feel. When resting, the `<animate>` elements are not
rendered at all — wings are completely still.

CSS layered on top of the SVG:
- `.butterfly-anim.at-start` / `.at-end` — `butterfly-settle` (1.8 s, fade-in
  + mild scale bounce) then `butterfly-rest` (4 s infinite mild breathing pulse)
- `filter: drop-shadow(...)` for depth

### 6. Settled obstacle
When resting (`at-start` or `at-end`), the butterfly still registers as an
obstacle (`horizontalPadding: 16`) so the nearest body text stays clear of it.
This updates whenever `anchorPositions` changes (e.g. window resize).

### 7. Snap-on-mount
When `anchorPositions` arrives for the first time (after the first layout pass),
and `position` is still `null`, the butterfly snaps to `getStartPos()`. This
prevents a flash of the butterfly at 0,0.

### 8. Mobile hiding
The butterfly is `display: none` at `max-width: 768px` (book.css line 391–394).
The layout still runs a clean pass for anchor positions, but the
`butterflyObstacle` is never set because the butterfly component doesn't render —
so mobile text layout is unaffected.

### 9. Overflow clamp
`WingsPage` wraps everything in `overflow: hidden`. Spline waypoints can wander
outside the content area (swing amplitude is up to 22% of the flight diagonal),
so without this the butterfly could cause a horizontal scrollbar.

---

## What is NOT working / known gaps ❌

### 1. No resize re-anchor during flight
If the window is resized **while the butterfly is flying**, the waypoints in
`waypointsRef` are stale (computed from the pre-resize anchor positions). The
butterfly will continue on its old path, then snap to the new end position when
the animation finishes. The text, however, immediately re-layouts around the
misaligned obstacle rect.

**Symptom:** a brief visible mis-alignment between the butterfly and the gap in
the text during/after resize while flying.
**Not fixed.** A resize during flight should cancel the flight and reset to
`at-start` with fresh anchors.

### 2. No p5.js generative art (planned, never built)
The old plan (`IMPLEMENTATION_STATUS.md` Phase 5) describes a Wing Venation
generative art piece (`flow-field vein tracing, 350×450`) for this page. It was
never implemented. This was listed as `⏳ PENDING` in the old plan and remains
absent from the codebase.

### 3. Pull quote Y-position is fragile on WingsPage
The pull quote is placed at `figureRect.y + figureRect.height + 24`. On the
Wings page the figure is floated right at 45% width, so the pull quote and body
text occupy the same left-side column. If the body text is long enough to reach
below the figure, the pull quote can be partially obscured by the displaced text.
This is a layout engine issue, not strictly a butterfly issue, but it affects
the same page.

### 4. Butterfly start/end positions use raw first/last *line* anchors
The butterfly's start is the left edge of **line 0** of the body text, and the
end is the right edge of **the last line**. If the last line is very short
(e.g. one word), the butterfly end can be close to the left margin rather than
the right side of the page. The effect still works but the diagonal of the
flight path may be very shallow.

No fix planned — this is an accepted quirk.

### 5. Wing shapes are a minimal geometric approximation
The four wing paths (`wingsOpen` / `wingsMid`) are simple quadratic-like cubic
bezier shapes hard-coded in the component. They don't resemble a real butterfly
in detail. There is no pattern, no vein detail, no colour gradient.

No fix planned in the current scope, but flagged here as a visual quality gap.

### 6. `spread-layout.ts` always picks the *widest* slot, not the leftmost
When the butterfly obstacle cuts a line, `layoutText` carves the line into slots
and picks the widest slot (line 93–98 in `spread-layout.ts`). For most lines
this is the slot to the left of the butterfly. But when the butterfly is near
the left margin, the right slot may be wider, causing text to hop to the right
side. This can look unnatural.

Not a regression, but a known limitation of the current slot-picking heuristic.

---

## Non-issues (things that look broken but aren't)

| Symptom | Reason |
|---|---|
| Body text shifts with tiny CSS transitions during flight | Intentional — `.butterfly-text-line` has `transition: left 150ms, top 150ms` |
| Butterfly is invisible on mobile | Intentional — `display: none` at ≤768px |
| Butterfly appears slightly transparent at rest | Intentional — `opacity: 0.70` in `butterfly-rest` keyframe |
| Different flight path every click | Intentional — `pathSeed` is re-randomised on each click |
| Docs say "6 pages" — there are 11 | Old plan. The current app has 11 pages (I–XI). Docs are stale. |

---

## Possible next steps (not prioritised)

- Cancel flight and re-snap to `at-start` on window resize
- Improve wing SVG paths with real Lepidoptera silhouettes
- Add wing venation p5.js generative art (was in Phase 5 of old plan)
- Prefer left slot over right slot in obstacle text carving when widths are
  close (within 10%)
