# Butterfly on "The Architecture of Wings" — Phasewise Implementation Plan

**Goal:** A butterfly that starts at the first word of the body text ("To"), travels to the last word ("alive."), and when clicked toggles direction — all while physically displacing the text it passes through, using Pretext's obstacle-routing engine.

---

## Architecture Overview

```
WingsPage
├── PageSpread (Pretext layout, accepts butterflyObstacle prop)
│   └── body lines rendered as .butterfly-text-line spans (CSS-transitioned)
└── Butterfly (rAF animation loop, drives position via ref + direct DOM)
    └── on each frame → writes butterfly obstacle → triggers text reflow
```

The key insight enabling smooth displacement without 60fps React re-renders:
- **Butterfly image** position: direct `style.left / style.top` mutation on its own DOM node (no React state)
- **Text lines** positions: Pretext `layoutText()` called each rAF tick (~0.0002ms), then direct `style.left / style.top` mutation on span DOM nodes via a ref array
- **CSS transitions** on `.butterfly-text-line` (`transition: left 150ms, top 150ms`) absorb discrete layout updates into smooth visual motion — no 60fps DOM writes needed on the text side

---

## Phase 1 — Anchor Body Lines to Word Positions

**Goal:** Let `Butterfly` know the pixel positions of the first and last body-text words on screen so it can start and end exactly there.

### Changes to `PageSpread.tsx`

1. Add optional prop:
   ```ts
   onAnchorPositions?: (anchors: { firstWord: { x: number; y: number }; lastWord: { x: number; y: number } }) => void
   ```

2. After `computeLayout` resolves `bodyLines`, extract:
   ```ts
   const firstLine = bodyLines[0]
   const lastLine  = bodyLines[bodyLines.length - 1]
   ```
   Call `onAnchorPositions({ firstWord: { x: firstLine.x, y: firstLine.y }, lastWord: { x: lastLine.x, y: lastLine.y } })` if provided.

3. Store the callback in a stable `useRef` so it does not re-trigger layout.

### Changes to `WingsPage.tsx`

1. Add `anchorPositions` state: `{ firstWord, lastWord } | null`.
2. Pass `onAnchorPositions={setAnchorPositions}` to `<PageSpread />`.
3. Pass `anchorPositions` down to `<Butterfly />`.

**Outcome:** Butterfly always knows exactly where the first and last body words are, even after resize/reflow.

---

## Phase 2 — Bidirectional Word-to-Word Navigation

**Goal:** Butterfly starts resting on first word. Click → flies to last word. Click again → flies back. No more arbitrary container-edge coordinates.

### Changes to `Butterfly.tsx`

#### Props
```ts
interface ButterflyProps {
  containerRef: React.RefObject<HTMLDivElement | null>
  anchorPositions: { firstWord: { x: number; y: number }; lastWord: { x: number; y: number } } | null
}
```

#### State & Refs
- Replace `phase: 'start' | 'flying' | 'settled'` with:
  ```ts
  type ButterflyPhase = 'at-start' | 'flying-forward' | 'flying-backward' | 'at-end'
  ```
- Remove `boundsRef` (no longer used for start/end positions).
- Keep `pathSeed` for meander variety.

#### Start / End positions
```ts
const getStartPos = () => anchorPositions?.firstWord ?? fallbackTopLeft
const getEndPos   = () => anchorPositions?.lastWord  ?? fallbackBottomRight
```

`BUTTERFLY_SIZE` offset applied so the butterfly's center sits over the first/last word.

#### Click logic
```ts
if (phase === 'at-start') → begin flying forward (phase: 'flying-forward')
if (phase === 'at-end')   → begin flying backward (phase: 'flying-backward')
if (phase === 'flying-*') → ignore (no interrupting mid-flight)
```

#### Flight path
`flightPath(progress, direction)` already exists. Wire direction from phase:
```ts
const dir = phase === 'flying-forward' ? 'forward' : 'reverse'
const pos = flightPath(progress, dir)
```

On completion:
- `flying-forward` → `at-end`, snap to `getEndPos()`
- `flying-backward` → `at-start`, snap to `getStartPos()`

#### Initialization
On mount (after 300ms delay or after `anchorPositions` first becomes non-null): snap to `getStartPos()` with phase `'at-start'`.

**Outcome:** Butterfly toggles reliably between first and last word with a natural sinusoidal path in both directions.

---

## Phase 3 — Live Pretext Text Displacement (The Core Feature)

**Goal:** As the butterfly moves, it registers itself as a Pretext obstacle. Body text reflows around it in real time.

### The Displacement Model

The butterfly is a circular-ish creature moving across the text. We model it as a padded rectangular obstacle:
```ts
const BUTTERFLY_OBSTACLE_SIZE = BUTTERFLY_SIZE + 32  // generous padding
const butterflyObstacle = {
  rect: { x: pos.x - 16, y: pos.y - 16, width: BUTTERFLY_OBSTACLE_SIZE, height: BUTTERFLY_OBSTACLE_SIZE },
  horizontalPadding: 24,
  verticalPadding: 8,
}
```

### Changes to `PageSpread.tsx`

1. Add prop: `butterflyObstacle?: { rect: Rect; horizontalPadding: number; verticalPadding: number } | null`

2. Add `butterflyObstacle` to the `figureObstacles` array inside `computeLayout`:
   ```ts
   if (butterflyObstacle) figureObstacles.push(butterflyObstacle)
   ```

3. Add `butterflyObstacle` to the `useCallback` dependency array of `computeLayout`.

4. Because `computeLayout` now runs on every butterfly position change, **switch body line rendering to the already-existing `.butterfly-text-line` CSS class** (which has `transition: left 150ms, top 150ms`) instead of `.spread-line--body`.

   This means text lines smoothly slide to their new positions after each layout recomputation.

### Changes to `WingsPage.tsx`

1. Add `butterflyObstacle` state: `BandObstacle | null`.
2. Pass `onObstacleChange={setButterflyObstacle}` callback to `<Butterfly />`.
3. Pass `butterflyObstacle` to `<PageSpread />`.

### Changes to `Butterfly.tsx`

1. Add prop: `onObstacleChange?: (obstacle: BandObstacle | null) => void`
2. In the rAF `animate` loop, after computing `pos`, call:
   ```ts
   onObstacleChange?.({
     rect: { x: pos.x - 16, y: pos.y - 16, width: BUTTERFLY_OBSTACLE_SIZE, height: BUTTERFLY_OBSTACLE_SIZE },
     horizontalPadding: 24,
     verticalPadding: 8,
   })
   ```
3. On settle (`at-start` or `at-end`): keep a small static obstacle at the resting position so the word remains displaced as long as the butterfly rests there.
4. On start of next flight: obstacle continues to update, so displacement transitions smoothly into flight.

### Performance notes
- Pretext `layoutText()` for the full Wings body (~1,200 words) takes ~0.1ms per call.
- `onObstacleChange` triggers a React `setState` → `computeLayout` → `setLayout` cycle.
- At 60fps this is one React re-render per frame — acceptable for a single page component.
- If profiling shows jank: throttle `onObstacleChange` to every 2nd frame (30fps), CSS transitions bridge the gap invisibly.

**Outcome:** Body text physically parts around the butterfly as it moves, like water around a boat.

---

## Phase 4 — Smooth Animation Loop Integration

**Goal:** Ensure the butterfly image itself moves at native 60fps with no visual stutter, decoupled from React's render cycle.

### Direct DOM position writes for the butterfly image

Instead of storing position in React `useState` and relying on re-renders to update `style.left/top`, use a **ref to the butterfly's own `<img>` DOM node** and update it directly in the rAF loop:

```ts
const imgRef = useRef<HTMLImageElement>(null)

// In animate():
const pos = flightPath(progress, dir)
if (imgRef.current) {
  imgRef.current.style.left = `${pos.x}px`
  imgRef.current.style.top  = `${pos.y}px`
}
positionRef.current = pos  // keep ref in sync for settle snap
```

React state is still used for `phase` (low-frequency: only changes 4 times per flight cycle). Position is NOT in React state — it lives purely in the ref and the DOM.

This eliminates 60fps React re-renders for the butterfly's own movement while keeping the text reflow (via `onObstacleChange`) at the cadence we choose.

### Throttle text reflow to 30fps
```ts
let lastReflowFrame = 0
// In animate():
if (timestamp - lastReflowFrame > 33) {  // ~30fps
  onObstacleChange?.(buildObstacle(pos))
  lastReflowFrame = timestamp
}
```

CSS transitions on `.butterfly-text-line` (`150ms`) ensure no jumpiness between 30fps layout updates.

### Settle snap
When flight completes:
- Directly set `imgRef.current.style` to exact anchor position
- Apply a CSS class `butterfly-anim--settling` for the rotate/scale/opacity settle keyframe
- Keep obstacle alive at settle position (text remains parted)

**Outcome:** Butterfly image at buttery-smooth 60fps. Text displacement at 30fps with 150ms CSS transitions — feels continuous to the eye.

---

## Phase 5 — Visual Polish

**Goal:** Make the butterfly feel alive and delightful, not just a moving box.

### Wing beat animation
Add a CSS keyframe to `book.css`:
```css
@keyframes butterfly-wingbeat {
  0%, 100% { transform: scaleX(1) rotate(0deg); }
  25%       { transform: scaleX(0.7) rotate(-3deg); }
  75%       { transform: scaleX(0.7) rotate(3deg); }
}

.butterfly-anim.flying-forward,
.butterfly-anim.flying-backward {
  animation: butterfly-wingbeat 0.35s ease-in-out infinite;
}
```

Apply class via `phase` → `className` mapping on the `<img>`.

### Resting animation at word anchors
```css
@keyframes butterfly-rest {
  0%, 100% { transform: rotate(0deg) scale(1); opacity: 0.75; }
  50%       { transform: rotate(2deg) scale(1.03); opacity: 0.9; }
}

.butterfly-anim.at-start,
.butterfly-anim.at-end {
  animation: butterfly-rest 3s ease-in-out infinite;
  cursor: pointer;
}
```

### Cursor indicator
- `at-start` / `at-end`: `cursor: pointer` + subtle tooltip via `title` attribute
  - `at-start`: `title="Click to fly to the last word"`
  - `at-end`:   `title="Click to return to the first word"`
- `flying-*`: `cursor: default`

### Hover interaction on body lines
The existing `.butterfly-text-line:hover { color: var(--ochre) }` is already in `book.css`. No change needed — hovering a line that the butterfly has parted will highlight it in ochre, reinforcing the sense that the text is aware of the butterfly.

### Obstacle padding ramp
During the first 10% and last 10% of flight, linearly ramp `horizontalPadding` from `0` to `24` (approach) and back to `0` (departure). This makes text part gradually as the butterfly arrives and closes smoothly behind it as it leaves.

```ts
const edgeFactor = Math.min(progress * 10, 1) * Math.min((1 - progress) * 10, 1)
const hPad = Math.round(24 * edgeFactor)
onObstacleChange?.({ rect, horizontalPadding: hPad, verticalPadding: 8 })
```

---

## File Change Summary

| File | Change |
|------|--------|
| `src/components/pages/WingsPage.tsx` | Add anchor + obstacle state; wire callbacks to PageSpread and Butterfly |
| `src/components/Butterfly.tsx` | New props (anchorPositions, onObstacleChange); phase enum; direct DOM writes; direction logic |
| `src/components/PageSpread.tsx` | Add butterflyObstacle prop; add to obstacle list; switch body lines to `.butterfly-text-line` class; expose onAnchorPositions callback |
| `src/styles/book.css` | Add `butterfly-wingbeat` and `butterfly-rest` keyframes; refine settle animation |

No new files needed. No new dependencies.

---

## Risk & Mitigation

| Risk | Mitigation |
|------|-----------|
| 60fps React re-renders cause jank | Direct DOM writes for butterfly position; 30fps throttle for text reflow |
| `layoutText` cache invalidation on obstacle change | Pretext `prepareWithSegments` caches by `font::text` key (independent of obstacles); layout re-runs cheaply |
| Text jumps on resize while butterfly is mid-flight | `computeLayout` runs on resize anyway; butterfly obstacle updates synchronously on next frame |
| Butterfly reaches word before layout updates anchor positions | Butterfly initializes to fallback top-left, then re-snaps to real anchor once `onAnchorPositions` fires after fonts load |
| Mobile: anchor positions differ from desktop layout | `anchorPositions` always comes from latest `computeLayout` result, which already handles narrow breakpoint |

---

## Success Criteria

- [ ] Butterfly starts resting directly on the word "To" at page load
- [ ] Click → butterfly flies sinuously to the word "alive."
- [ ] Body text visibly parts as the butterfly passes through (lines shift left/right around it)
- [ ] Text closes back behind the butterfly as it moves on
- [ ] CSS transitions make all text motion smooth (no sudden jumps)
- [ ] Click at "alive." → butterfly flies back to "To"
- [ ] Butterfly wing-beats during flight, rests gently at anchors
- [ ] Works correctly after browser resize (anchor positions recompute)
- [ ] No jank on mid-range hardware (test with Chrome DevTools CPU throttle 4x)
