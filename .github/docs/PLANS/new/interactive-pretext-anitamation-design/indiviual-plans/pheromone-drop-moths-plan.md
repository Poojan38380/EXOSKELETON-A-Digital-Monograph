# Plan: Pheromone Drop + Attracted Moths — Antennae Page

> Source PRD: `docs/PLANS/new/interactive-pretext-anitamation-design/indiviual-plans/pheromone-drop-moths-prd.md`

## Architectural decisions

Durable decisions that apply across all phases:

- **Single canvas**: All rendering (trail, drop, moths) stays on the existing `PheromoneCanvas`. No new DOM elements, no additional canvases. The existing rAF loop extends to draw drop + moths each frame.
- **No Pretext coupling**: Moths do NOT act as obstacles for body text routing. They fly freely over text.
- **One drop at a time**: Clicking replaces the old drop. Clicking while moths are active causes existing approaching moths to recalculate waypoints; resting/departing moths are unaffected.
- **Moth state machine**: `spawned → approaching → resting → departing → gone` — each moth runs independently.
- **Moth shape**: `) • (` drawn via Canvas 2D `ctx.stroke()` arcs for wings + `ctx.arc()` fill for body dot. ~16×12px logical size.
- **Moth spawn**: 3–4 moths from random page edges, staggered by 50–100ms.
- **Approach path**: Catmull-Rom splines with perpendicular offset that decreases (80px → 5px) as moth nears drop. Waypoints regenerated every ~1 second.
- **Drop lifecycle**: Spawn → pulse (alpha oscillation 0.4–0.55) for ~6s → linear fade over 2s → gone. Total ~8s.
- **Colour palette**: Moth wings `#c4963a` (ochre), body dot `#2c2418` (ink), drop `#c4963a` with glow halo `#e6c466`.
- **Click vs. move detection**: Track `mousedown` position. If `mouseup` occurs at same position (within 5px tolerance) without significant movement, treat as click → place drop. On mobile: `touchstart` without preceding `touchmove` = tap.
- **No new dependencies**: Zero npm packages. Vanilla Canvas 2D API + existing `requestAnimationFrame` loop.
- **File conventions**: Existing `PheromoneCanvas.tsx` modified. No new component files needed. Pure utility `moth.ts` may be extracted if logic grows complex.

---

## Phase 1: Drop Placement + Lifecycle

**User stories**: 1, 2, 3, 4, 5, 6

### What to build

Extend `PheromoneCanvas.tsx` to detect clicks/taps (distinguished from movement events) and place a pheromone drop at the click position. The drop is drawn as a radial gradient circle on the canvas with oscillating alpha (pulse effect). It lives for ~8 seconds: 6 seconds of pulsing, then 2 seconds of linear fade. Clicking again cancels the old drop and spawns a new one. The drop is visually brighter than the trail (peak alpha ~0.5 vs. trail's 0.12).

### Acceptance criteria

- [ ] Click/tap anywhere on Antennae page places a glowing dot at cursor position
- [ ] Drop pulses gently (alpha oscillation 0.4–0.55 at ~2Hz)
- [ ] Only one drop exists at a time; clicking again moves it
- [ ] Drop fades away after ~8 seconds automatically
- [ ] Drop is visually distinct from trail (brighter, more saturated)
- [ ] Mobile tap places drop equivalently to desktop click
- [ ] Click/move distinction works: dragging does NOT place a drop, only click does
- [ ] Drop position tracked in component state/ref, not DOM

---

## Phase 2: Moth Shape Rendering + Wing Flap Animation

**User stories**: 10, 11

### What to build

Add moth rendering to the canvas rAF loop. Each moth is drawn as `) • (` — two parenthesis arcs (ochre stroke, ~1.5px lineWidth) flanking a center dot (ink fill, ~1.5px radius). Wing flap is animated by oscillating the arc sweep angle in rAF: 50°–70° at ~3Hz while flying. Size: ~16×12px logical. HiDPI-scaled automatically by existing canvas setup.

### Acceptance criteria

- [ ] Moth renders as `) • (` shape on canvas (two arcs + center dot)
- [ ] Wing flap animates: arc sweep oscillates at ~3Hz while flying
- [ ] Moth is ~16×12px logical size
- [ ] Wing stroke colour is `#c4963a` (ochre), body dot is `#2c2418` (ink)
- [ ] Moth renders correctly at HiDPI (sharp arcs, no pixelation)
- [ ] Multiple moths can render simultaneously without visual artifacts

---

## Phase 3: Moth State Machine + Spawn Logic

**User stories**: 7, 14, 15

### What to build

Implement the moth state machine: `spawned → approaching → resting → departing → gone`. When a drop is placed, 3–4 moths spawn from random page edges within ~300ms (staggered 50–100ms). Each moth picks a random edge (left/right/top/bottom) and random position along it, starting ~20px off-screen, fading in over 200ms. Each moth tracks its own state, position, alpha, and timing independently.

### Acceptance criteria

- [ ] Placing a drop spawns 3–4 moths (random count)
- [ ] Moths spawn from random page edges (left/right/top/bottom)
- [ ] Moths fade in over ~200ms from off-screen to on-screen
- [ ] Spawn is staggered by 50–100ms per moth (organic stagger, not simultaneous)
- [ ] Each moth runs independent state machine
- [ ] State transitions are verifiable (log or inspect)
- [ ] Moths do not obstruct body text readability (small size, fly over text)

---

## Phase 4: Moth Approach Path (Zig-Zag → Straight)

**User stories**: 8, 9

### What to build

Implement Catmull-Rom spline approach paths for moths in the `approaching` state. Each moth generates 3–5 waypoints from its spawn position to the drop position, with random perpendicular offsets. Offset magnitude starts at ~80px (far from drop) and decreases linearly to ~5px (near drop). Waypoints regenerate every ~1 second or when the current sequence is exhausted. The moth interpolates along waypoints at ~60px/s.

### Acceptance criteria

- [ ] Moths follow zig-zag/flutter paths when far from drop
- [ ] Paths straighten as moths approach the drop
- [ ] Waypoint regeneration happens every ~1 second
- [ ] Moth speed is ~60px/s during approach
- [ ] Path interpolation uses Catmull-Rom splines (smooth curves, not jagged lines)
- [ ] Moth always reaches within 5px of drop position to trigger resting state

---

## Phase 5: Moth Resting + Departure

**User stories**: 12, 13

### What to build

When a moth reaches the drop (within 5px), it enters `resting` state for 2–3 seconds (random per moth). During rest: wing flap slows to ~1Hz, arc narrows to 35°–50° (wings folding), moth alpha stays at full. After resting, moth enters `departing` state: flies toward nearest page edge, speed increases slightly, alpha fades linearly from 1 → 0 over ~2 seconds, wings flap at normal rate. On reaching edge, moth transitions to `gone` and is removed from active list.

### Acceptance criteria

- [ ] Moth rests on drop for 2–3 seconds (random duration per moth)
- [ ] Wing flap slows to ~1Hz during rest
- [ ] Wing arc narrows during rest (wings closing: 35°–50° sweep)
- [ ] Moth departs after resting, flying toward nearest page edge
- [ ] Moth alpha fades from 1 → 0 over ~2 seconds during departure
- [ ] Moth is removed from active list when it reaches page edge + full fade
- [ ] Departure feels gradual and natural, not abrupt

---

## Phase 6: Drop–Moth Interaction + Edge Cases

**User stories**: (implicit — system coherence)

### What to build

Handle the interaction between drop replacement and active moths:
- If a new drop is placed while moths are `approaching`: recalculate waypoints toward new drop position.
- If a new drop is placed while moths are `resting`: finish resting, then depart (no re-targeting).
- If a new drop is placed while moths are `departing` or `gone`: unaffected.
- If drop expires (8s timeout) while moths are `approaching`: moths complete approach to last known drop position, then rest, then depart normally.
- If drop expires while moths are `resting`: they finish resting, then depart.

Also handle: drop placed near page edge (short approach path is fine), all moths gone but drop still pulsing (drop continues its lifecycle), page navigation (all state resets via component unmount).

### Acceptance criteria

- [ ] Clicking to place new drop redirects approaching moths to new position
- [ ] Resting moths complete rest and depart even if drop is moved
- [ ] Departing/gone moths are unaffected by drop reposition
- [ ] Drop expiration does not crash or freeze moth state machines
- [ ] Page navigation resets all state (drop + moths) cleanly
- [ ] No memory leaks (moth objects removed from active list when `gone`)

---

## Implementation order rationale

Phases are ordered from foundational → behavioral:

1. **Drop Placement** — The core interaction. Nothing else works without it. Simplest addition to existing canvas.
2. **Moth Rendering** — Visual representation. Can be tested by placing a static moth at a fixed position (no state machine needed yet).
3. **Moth State Machine + Spawn** — Lifecycle management. Moths spawn, transition through states, but don't move yet (can verify state transitions independently).
4. **Moth Approach Path** — Movement logic. Requires state machine + rendering to be visible. Most complex pure algorithm.
5. **Moth Resting + Departure** — Completion of state machine. Requires approach path to work first.
6. **Drop–Moth Interaction + Edge Cases** — System coherence. Requires all individual behaviors to work first.

**Practical parallelism**: Phase 2 (moth rendering) can begin immediately after Phase 1 starts, since moth rendering is independent of the state machine. Phase 4 (approach path) requires only the Catmull-Rom spline math (already used in Butterfly component — can copy/adapt). The critical path is: Phase 1 → Phase 3 → Phase 4 → Phase 5 → Phase 6, with Phase 2 parallel to Phase 3.

---

## File Changes

| File | Change | Description |
|------|--------|-------------|
| `src/components/PheromoneCanvas.tsx` | **Modified** | Add drop state, moth state machine, click detection, moth rendering to existing rAF loop |
| `src/layout-engine/moth-path.ts` | **New (optional)** | Extract Catmull-Rom waypoint generation for moth approach paths (pure function, testable) |

**Design decision**: If moth path logic stays simple (<80 lines), keep it inline in `PheromoneCanvas.tsx`. If it grows complex (waypoint generation, distance-based offset calculation, spline interpolation), extract to `moth-path.ts` as a pure utility module. Given that the Butterfly component already has Catmull-Rom spline code, we may copy the relevant functions into `moth-path.ts` or import them if already accessible.
