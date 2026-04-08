# PRD: Pheromone Drop + Attracted Moths — Antennae Page

**Project:** `exoskeleton` — A Digital Monograph on Insect Morphology
**Feature:** Click-to-drop pheromone attractant with moth moths on the Antennae page
**Status:** Draft — ready for review
**Date:** 2026-04-05

---

## Problem Statement

The Antennae page currently has a passive pheromone trail that follows the cursor — a reactive effect that responds to movement but has no attractant mechanic. The page's content is about chemoreception and how moths follow invisible pheromone gradients through the night. There's an opportunity to make this experiential: the reader becomes the female moth, placing pheromone drops that summon male moths from the page edges, completing the narrative loop between what the text describes and what the reader does.

---

## Solution

Add two features to the existing `PheromoneCanvas` on the Antennae page:

1. **Pheromone Drop** — Click/tap anywhere on the page to place a glowing pheromone drop (dot) at that location. One drop at a time. It pulses gently, then fades after ~8 seconds. Clicking again moves the drop to the new location.

2. **Attracted Moths** — When a drop is placed, 3–4 moths (drawn as `) • (` on canvas) spawn from random page edges and zig-zag toward the drop. Their paths straighten as they approach (simulating gradient-following). On arrival, moths cluster on the drop for 2–3 seconds (pulsing gently), then slowly fly away, fading as they exit.

All rendering stays on the existing canvas — no new DOM elements.

---

## User Stories

### Pheromone Drop

1. As a reader, I want to click/tap anywhere on the Antennae page and see a small glowing dot appear at that location, so that I am placing a pheromone attractant.
2. As a reader, I want the drop to pulse gently (brightness oscillation), so that it feels alive and attractive, not static.
3. As a reader, I want only one drop to exist at a time, so that placing a new one moves the attractant location.
4. As a reader, I want the drop to fade away after ~8 seconds if I don't interact again, so the page returns to its calm, passive state.
5. As a reader, I want the drop to be visually distinct from the cursor trail (brighter, more saturated), so I understand it is a deliberate placement, not a trail artifact.
6. As a mobile reader, I want tapping the page to place a drop equivalently to clicking on desktop.

---

### Attracted Moths

7. As a reader, I want 3–4 moths to appear from random page edges immediately after I place a drop, so I can see the pheromone taking effect.
8. As a reader, I want each moth to follow a zig-zag/flutter path toward the drop when far away, so it simulates a moth navigating a pheromone gradient (not a homing missile).
9. As a reader, I want the moth's path to straighten as it gets closer to the drop, so the gradient-following behavior feels realistic.
10. As a reader, I want each moth to be drawn as `) • (` (two parenthesis arcs as wings with a dot at the center) on the canvas, so the moth is recognizable and matches the book's visual style.
11. As a reader, I want the moth's wings to flap slightly (oscillating parenthesis arc angle) as it flies, so it feels alive.
12. As a reader, I want moths to stay on the drop for 2–3 seconds after arriving, pulsing gently (wing flap slows, wings close slightly), so the clustering behavior feels like a real moth response.
13. As a reader, I want moths to slowly fly away from the drop after resting, fading as they exit off-screen, so the departure feels natural and gradual.
14. As a reader, I want moths to spawn from different page edges (left, right, top, bottom) at random, so they arrive from multiple directions.
15. As a reader, I want moths to not overlap the body text in a way that makes it unreadable, so reading is never obstructed.
16. As a reader on mobile, I want the moth behavior to trigger on tap equivalently to desktop click.

---

## Implementation Decisions

### Canvas Rendering (All on Existing PheromoneCanvas)

- **No new DOM elements**: Moths, the drop, and the pheromone trail all render on the same canvas via the existing `PheromoneCanvas` rAF loop.
- **Drop rendering**: Radial gradient circle at click position, brighter than trail (peak alpha ~0.5 vs. trail's 0.12). Pulses via oscillating alpha in rAF: `alpha = 0.4 + 0.15 * sin(t * 2)`.
- **Drop lifecycle**: Spawn at full brightness → pulse for ~6 seconds → fade linearly to 0 over 2 seconds → gone. Total lifetime: ~8 seconds.
- **Drop reposition**: Clicking again cancels the old drop (immediate fade) and spawns a new one at the new position. This also triggers new moths.

### Moth Rendering

- **Shape**: Drawn with Canvas 2D `ctx.stroke()` for parenthesis arcs + `ctx.arc()` for center dot.
  - Left wing: arc curving outward `)`, stroke colour ochre `#c4963a`, lineWidth ~1.5px
  - Right wing: arc curving outward `(`, mirror of left
  - Center dot: small filled circle `•`, colour `#2c2418` (ink), radius ~1.5px
  - Size: ~16px wide × 12px tall at rest
- **Wing flap animation**: Oscillate the sweep angle of each parenthesis arc in rAF. At rest: ~60° arc. Flapping: 50°–70° arc at ~3Hz while flying. While resting on drop: slows to ~1Hz, arc narrows to ~45° (wings closing).
- **Moth size on canvas**: ~16×12px logical. HiDPI-scaled automatically (canvas already handles DPR).

### Moth State Machine

Each moth runs a simple state machine:

```
spawned → approaching → resting → departing → gone
```

- **spawned**: Moth appears at random page edge (fade in over 200ms). Position interpolated from off-screen edge point to ~40px inside the page.
- **approaching**: Moth flies toward drop via perturbed Catmull-Rom spline. Zig-zag amplitude decreases as distance to drop decreases. Speed: ~60px/s. Waypoints regenerated every ~1 second.
- **resting**: Moth reaches drop (within 5px). Sits on drop for 2–3 seconds (random per moth). Wings flap slowly, alpha at full.
- **departing**: Moth flies away from drop toward nearest page edge. Speed increases slightly. Alpha fades linearly from 1 → 0 over ~2 seconds. Wings flap normally.
- **gone**: Moth removed from active list.

### Moth Spawn Logic

- **Count**: 3–4 moths (random on each drop placement).
- **Edges**: Each moth picks a random edge (left, right, top, bottom) and a random position along that edge. Spawn point is ~20px off-screen, interpolated on-screen over 200ms.
- **Timing**: All moths spawn within ~300ms of each other (staggered by 50–100ms for organic feel).

### Approach Path: Zig-Zag → Straight

- Moth generates waypoints via Catmull-Rom spline from spawn position to drop position.
- 3–5 intermediate waypoints with random perpendicular offset.
- Offset magnitude: starts at ~80px when far from drop, decreases linearly to ~5px as moth approaches.
- Waypoints regenerated every ~1 second (or when current waypoint sequence is exhausted).
- Result: erratic flutter when distant, increasingly direct flight as the moth closes in.

### Drop–Moth Interaction

- When a new drop is placed while moths are still active:
  - Existing moths in `approaching` state: recalculate waypoints toward new drop position.
  - Existing moths in `resting` state: finish resting, then depart toward old drop (or recalculate if still on it).
  - Existing moths in `departing` or `gone` state: unaffected.
  - New batch of 3–4 moths spawns toward the new drop.

### Integration with Existing PheromoneCanvas

- **rAF loop extension**: The existing draw loop (trail buffer → age → draw radial gradients) now also draws the drop and active moths each frame.
- **Event handling**: `mousemove`/`touchmove` continue to add trail points. `click`/`touchstart` (separate from move) places the pheromone drop.
  - Distinguish click from move: track `mousedown` position. If `mouseup` occurs at same position (within 5px tolerance) without significant movement, treat as click.
  - On mobile: `touchstart` at a position without preceding `touchmove` = tap/drop placement.
- **State**: Add `pheromoneDrop: { x, y, spawnTime, lifetime } | null` and `moths: Moth[]` to the component's refs.

### No Pretext Coupling

- Moths do NOT act as obstacles for body text routing. They fly over text freely (like the caterpillar on the Metamorphosis page).
- Moths are small enough (~16px) that they don't meaningfully obstruct reading.

### Colour Palette

- Moth wings (stroke): `#c4963a` (ochre)
- Moth body dot: `#2c2418` (ink)
- Pheromone drop: `#c4963a` with alpha 0.4–0.55 (brighter than trail's 0.12)
- Drop glow: `#e6c466` (ochre-bright) at lower alpha for halo effect

---

## Testing Decisions

### What to test

- **Drop placement**: Clicking places a drop at the correct coordinates (verify via canvas state, not visual output).
- **Drop lifecycle**: Drop fades after ~8 seconds (test the timestamp math, not the visual).
- **Moth spawning**: Placing a drop spawns 3–4 moths from random edges.
- **Moth state transitions**: Each moth progresses through spawned → approaching → resting → departing → gone.
- **Approach path straightening**: Moth waypoint offset magnitude decreases as distance to drop decreases.

### What NOT to test

- Canvas draw calls (untestable without visual regression tools)
- The rAF animation loop (timing-dependent)
- The pheromone trail rendering (already covered by Phase 2)

---

## Out of Scope

- **Moth–moth collision**: Moths don't interact with each other. They can overlap visually.
- **Moth as Pretext obstacle**: Moths do NOT route body text around them.
- **Sound effects**: No audio.
- **Moth species variety**: All moths use the same `) • (` design and colour.
- **Multiple simultaneous drops**: Only one drop at a time.
- **Drop persistence across navigation**: Drop is lost when user navigates away and returns.
- **Moth reproduction or population growth**: Moths only spawn from drop placement.
- **Moth interaction with pheromone trail**: Moths are attracted to the drop, not the cursor trail. The trail and the drop are separate systems on the same canvas.
- **Accessibility**: Moths and drops are decorative. Screen reader users experience the standard text content.

---

## Further Notes

### Why `) • (` instead of a detailed moth?

The parenthesis shape is abstract, geometric, and instantly readable at small sizes. A detailed moth SVG at 16×12px would read as a smudge. The `) • (` shape communicates "wings + body" without literal illustration — matching the book's design philosophy of suggestion over representation.

### Why keep everything on one canvas?

The existing `PheromoneCanvas` already runs an rAF loop for the trail. Adding the drop and moths to the same loop avoids compositing multiple canvases, keeps z-ordering trivial, and ensures HiDPI scaling is handled once. The alternative (separate canvas for moths) would add sync complexity and potential flicker.

### Moth wing flap math

Each wing is drawn as a circular arc:
- Left wing: `ctx.arc(centerX - 4, centerY, 6, startAngle, endAngle)` where startAngle/endAngle oscillate around a resting position.
- Right wing: mirror image.
- Flap frequency: 3Hz while flying, 1Hz while resting.
- Arc sweep: 50°–70° while flying (wings opening/closing), 35°–50° while resting (wings folding).

### Performance budget

- Trail points: ~40 max, each drawn as radial gradient
- Moths: 4 max active, each drawn as 2 arcs + 1 dot per frame
- Drop: 1, drawn as radial gradient
- Total draw calls per frame: ~40 gradients + 4 × (2 arcs + 1 dot) + 1 gradient = ~55 draw operations. Well within 60fps budget on modern devices.

### Edge case: drop placed near page edge

If a moth spawns from the same edge as the drop, its approach path is very short. The moth should still go through the full state sequence (spawn → approach → rest → depart) but the approach phase may be only 1–2 waypoints. This is fine — it simulates a moth that was already nearby.

---

*End of PRD. This document is the source of truth for the pheromone drop + attracted moths feature on the Antennae page.*
