# Implementation Plan: Antennae Page — Pheromone Plume Canvas Overlay

> **Source**: `docs/PLANS/new/interactive-pretext-anitamation-design/plan.md` — Phase 2
> **PRD User Stories**: 23–28
> **Complexity**: Low (pure canvas draw loop, no state machine, no Pretext coupling)

---

## Problem Space

The current `AntennaePage.tsx` is a simple `PageSpread` wrapper that renders prose text about insect chemoreception with no interactive element. The PRD calls for a **canvas overlay** that draws a soft, fading radial gradient "pheromone plume" trail following the user's cursor. The effect should feel like drifting through a chemical cloud — subtle, organic, and never obstructing readability. The canvas is `pointer-events: none` so it never intercepts clicks on existing page content.

### Constraints

1. **Canvas overlay, not replacement**: The existing `PageSpread` layout (title, credit, pull quote, body text, figure) must render normally. The canvas sits absolutely-positioned on top with `pointer-events: none`.
2. **No Pretext coupling**: The pheromone plume does NOT need body line positions. It tracks cursor position independently of the text layout.
3. **60fps animation**: All canvas drawing uses `requestAnimationFrame`. No `setInterval`, no CSS `transition` in the hot path.
4. **Trail buffer**: A `Float32Array` (or equivalent typed array) stores the last ~40 mouse positions with age values. Each frame clears canvas, ages all points, redraws as radial gradient circles with decaying alpha.
5. **Clean on entry/exit**: Canvas is transparent on page mount. On `mouseleave`, the trail clears naturally via aging (no points added, existing points expire).
6. **Mobile touch equivalent**: `touchmove` adds points to the trail buffer from `touch.clientX/Y`.
7. **No new dependencies**: Zero npm packages. Vanilla Canvas 2D API + `requestAnimationFrame`.
8. **Book palette**: Pheromone colour is amber/gold `#c4963a` (ochre) with alpha ~0.12 for subtlety.

---

## File Manifest

| File | Type | Purpose |
|------|------|---------|
| `src/components/pages/AntennaePage.tsx` | **Modified** | Wrap `PageSpread` with canvas overlay container |
| `src/components/PheromoneCanvas.tsx` | **New** | Canvas overlay component with trail buffer + rAF draw loop |
| `src/styles/pages/antennae.css` | **Modified** | Add canvas overlay styles (if needed beyond inline) |

---

## Architecture

### Component Hierarchy

```
AntennaePage
├── <div style={{ position: 'relative', overflow: 'hidden' }}>
│   ├── PageSpread (existing — unchanged config)
│   └── PheromoneCanvas (new)
│       └── <canvas> absolutely positioned, fills parent
```

### Data Flow

```
User moves cursor over page
  ↓
mousemove event → push {x, y, age: 0} to trail buffer
  ↓
rAF fires (~16ms)
  ↓
Clear canvas (ctx.clearRect)
  ↓
For each trail point:
  - age += delta
  - alpha = (1 - age / MAX_AGE) * BASE_ALPHA
  - Draw radial gradient circle at (x, y) with alpha
  ↓
Discard expired points (age > MAX_AGE)
  ↓
Loop until no points remain or page unmounts
```

### Trail Buffer Design

**Choice**: Fixed-size circular buffer vs. dynamic array.

**Decision**: Dynamic array with periodic pruning. Simpler to implement, negligible allocation pressure (max ~40 points, each {x, y, age} = 3 numbers). Prune expired points every ~200ms, not every frame.

**Data structure**:
```ts
interface TrailPoint {
  x: number
  y: number
  age: number  // milliseconds since added
}

const trailBuffer: TrailPoint[] = []
const MAX_AGE = 2000      // points expire after 2 seconds
const MAX_POINTS = 40     // soft cap — oldest dropped if exceeded
const BASE_ALPHA = 0.12   // peak opacity for fresh point
```

**Why not `Float32Array`**: The PRD mentions `Float32Array` of (x, y, age) triples. This is valid for raw performance, but with only 40 points max, the readability cost of a flat typed array (index math: `buffer[i * 3 + 0]`, `buffer[i * 3 + 1]`, `buffer[i * 3 + 2]`) outweighs the micro-optimization. Use an array of plain objects. If profiling shows GC pressure (it won't at 40 objects), switch to `Float32Array` later.

---

## Detailed Implementation Specs

### 1. `src/components/PheromoneCanvas.tsx` — Canvas Overlay Component

**Props**: None (self-contained).

**Behaviour**:
- Renders a `<canvas>` element, absolutely positioned to fill parent
- On mount: sets up HiDPI canvas (logical size × `devicePixelRatio`), registers event listeners
- On `mousemove`: pushes new trail point at cursor position relative to canvas parent
- On `mouseleave`: stops adding points (existing trail ages out naturally)
- On `touchmove`: equivalent — adds points from first touch's `clientX/Y`
- rAF loop: clears canvas, ages points, draws radial gradients
- Cleanup: cancels rAF, removes event listeners on unmount

**Canvas sizing**:
```ts
// Logical size = parent container's clientWidth × clientHeight
// Physical size = logical × devicePixelRatio (for HiDPI)
// ctx.scale(devicePixelRatio, devicePixelRatio) so all draw calls use logical coords
```

**HiDPI pattern** (reused from codebase conventions):
```tsx
const dpr = window.devicePixelRatio || 1
canvas.width = containerWidth * dpr
canvas.height = containerHeight * dpr
canvas.style.width = `${containerWidth}px`
canvas.style.height = `${containerHeight}px`
ctx.scale(dpr, dpr)
```

**Resize handling**: `ResizeObserver` on the parent container. On resize, recalculate canvas dimensions and update DPR scale.

**Draw loop**:
```ts
let lastFrameTime = performance.now()

const draw = (now: number) => {
  const delta = now - lastFrameTime
  lastFrameTime = now

  // Age all points
  for (const point of trailBuffer) {
    point.age += delta
  }

  // Prune expired
  while (trailBuffer.length > 0 && trailBuffer[0]!.age > MAX_AGE) {
    trailBuffer.shift()
  }

  // Cap buffer size
  while (trailBuffer.length > MAX_POINTS) {
    trailBuffer.shift()
  }

  // Clear canvas
  ctx.clearRect(0, 0, containerWidth, containerHeight)

  // Draw each point
  for (const point of trailBuffer) {
    const lifeRatio = 1 - point.age / MAX_AGE  // 1 = fresh, 0 = expired
    if (lifeRatio <= 0) continue

    const alpha = lifeRatio * BASE_ALPHA
    const radius = 24 + (1 - lifeRatio) * 16  // fresh: 24px, old: 40px (spreads as it fades)

    // Radial gradient
    const gradient = ctx.createRadialGradient(
      point.x, point.y, 0,
      point.x, point.y, radius
    )
    gradient.addColorStop(0, `rgba(196, 150, 58, ${alpha})`)
    gradient.addColorStop(1, `rgba(196, 150, 58, 0)`)

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2)
    ctx.fill()
  }

  // Schedule next frame if there are still points to animate
  if (trailBuffer.length > 0) {
    rafRef.current = requestAnimationFrame(draw)
  }
}
```

**Key detail**: The rAF loop only runs while there are trail points. When the buffer empties (cursor leaves page, all points expire), `requestAnimationFrame` stops. The next `mousemove` restarts it. This is more efficient than running rAF continuously.

**Event listener scoping**: Events are registered on the **parent container element** (not `window`), so the plume only appears when the cursor is within the page bounds. The parent is the `div` wrapping `PageSpread` + canvas.

**Implementation sketch**:

```tsx
import { useRef, useEffect, useCallback } from 'react'

const MAX_AGE = 2000
const MAX_POINTS = 40
const BASE_ALPHA = 0.12
const BRUSH_RADIUS_MIN = 24
const BRUSH_RADIUS_MAX = 40
const PHEROMONE_COLOUR = '196, 150, 58' // ochre RGB

interface TrailPoint {
  x: number
  y: number
  age: number
}

export function PheromoneCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const trailBufferRef = useRef<TrailPoint[]>([])
  const rafRef = useRef<number | null>(null)
  const isInsideRef = useRef(false)
  const lastFrameTimeRef = useRef(0)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const container = containerRef.current
    if (!container) return

    const now = performance.now()
    const delta = now - lastFrameTimeRef.current
    lastFrameTimeRef.current = now

    const w = container.clientWidth
    const h = container.clientHeight

    ctx.clearRect(0, 0, w, h)

    // Age and prune
    const trail = trailBufferRef.current
    for (let i = trail.length - 1; i >= 0; i--) {
      trail[i]!.age += delta
      if (trail[i]!.age > MAX_AGE) {
        trail.splice(i, 1)
      }
    }

    // Draw
    for (const point of trail) {
      const lifeRatio = 1 - point.age / MAX_AGE
      if (lifeRatio <= 0) continue

      const alpha = lifeRatio * BASE_ALPHA
      const radius = BRUSH_RADIUS_MIN + (1 - lifeRatio) * (BRUSH_RADIUS_MAX - BRUSH_RADIUS_MIN)

      const gradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius)
      gradient.addColorStop(0, `rgba(${PHEROMONE_COLOUR}, ${alpha})`)
      gradient.addColorStop(1, `rgba(${PHEROMONE_COLOUR}, 0)`)

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(point.x, point.y, radius, 0, Math.PI * 2)
      ctx.fill()
    }

    // Continue only if points remain
    if (trail.length > 0) {
      rafRef.current = requestAnimationFrame(draw)
    }
  }, [])

  const startDrawLoop = useCallback(() => {
    if (rafRef.current !== null) return // already running
    lastFrameTimeRef.current = performance.now()
    rafRef.current = requestAnimationFrame(draw)
  }, [draw])

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1

    const resizeCanvas = () => {
      const w = container.clientWidth
      const h = container.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    resizeCanvas()

    const ro = new ResizeObserver(resizeCanvas)
    ro.observe(container)
    resizeObserverRef.current = ro

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      isInsideRef.current = true

      const trail = trailBufferRef.current
      trail.push({ x, y, age: 0 })

      if (trail.length > MAX_POINTS) {
        trail.shift()
      }

      startDrawLoop()
    }

    const handleMouseLeave = () => {
      isInsideRef.current = false
      // Don't clear — let points age out naturally for smooth fade
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return
      const touch = e.touches[0]!
      const rect = container.getBoundingClientRect()
      const x = touch.clientX - rect.left
      const y = touch.clientY - rect.top

      const trail = trailBufferRef.current
      trail.push({ x, y, age: 0 })

      if (trail.length > MAX_POINTS) {
        trail.shift()
      }

      startDrawLoop()
    }

    container.addEventListener('mousemove', handleMouseMove)
    container.addEventListener('mouseleave', handleMouseLeave)
    container.addEventListener('touchmove', handleTouchMove, { passive: true })

    return () => {
      container.removeEventListener('mousemove', handleMouseMove)
      container.removeEventListener('mouseleave', handleMouseLeave)
      container.removeEventListener('touchmove', handleTouchMove)
      ro.disconnect()
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [startDrawLoop])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 2,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  )
}
```

**Design notes**:
- `pointer-events: none` on the container `div` ensures clicks pass through to `PageSpread` content
- `z-index: 2` places canvas above text (z-index 1) but below navigation (z-index 500)
- HiDPI via `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)` — all draw calls use logical coordinates
- `ResizeObserver` handles window resizes and layout shifts
- `touchmove` uses `{ passive: true }` — doesn't block scroll (though this page shouldn't have scroll conflict since the container is the page area)

---

### 2. `src/components/pages/AntennaePage.tsx` — Modified Page Component

**Pattern**: Extended Pattern A (Simple Spread) — wraps `PageSpread` in a `position: relative` container and adds `PheromoneCanvas` as a sibling.

**Structure** (similar to `WingsPage` but simpler — no butterfly state):

```tsx
import { PageSpread } from '../PageSpread'
import type { SpreadConfig } from '../PageSpread'
import {
  ANTENNAE_TITLE,
  ANTENNAE_CREDIT,
  ANTENNAE_PULL_QUOTE,
  ANTENNAE_BODY,
  PAGES,
} from '../../content/entomology-text'
import { IMG_SATURNIID_MOTH } from '../../content/image-urls'
import { PheromoneCanvas } from '../PheromoneCanvas'

const config: SpreadConfig = {
  // ... existing config unchanged ...
}

export function AntennaePage() {
  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      <PageSpread config={config} />
      <PheromoneCanvas />
    </div>
  )
}
```

**Key detail**: The wrapper `div` with `position: relative` and `overflow: hidden` must match the `PageSpread`'s bounding box. Since `PageSpread` sets its own `minHeight` based on content, the wrapper inherits it. The `PheromoneCanvas` uses `position: absolute; inset: 0` to fill the wrapper.

---

### 3. `src/styles/pages/antennae.css` — Minimal Styles Update

**No changes needed** for the canvas itself (all styling is inline in the component). The existing antennae.css already defines page atmosphere and header styles. Optionally add a CSS custom property for the pheromone colour if we want to theme it from CSS:

```css
/* Optional: expose pheromone colour as CSS custom property for future theming */
.page--antennae {
  --pheromone-colour: rgba(196, 150, 58, 0.12);
}
```

This is not used by the canvas (which hardcodes the RGB values) but provides a design token for consistency documentation.

---

## Task Breakdown for AI Worker Agents

The Phase 2 implementation is simple enough that it can be done in **3 sequential waves** with minimal parallelism. The dependencies are tight — `PheromoneCanvas` must exist before `AntennaePage` can import it.

### Wave 1: PheromoneCanvas Component

**Agent A**: `src/components/PheromoneCanvas.tsx`

**Specs**:
- Render a `<canvas>` inside a `position: absolute; inset: 0; pointer-events: none` container
- Trail buffer: array of `{x, y, age}` objects, max 40 points, expire after 2000ms
- `mousemove` → add point, start rAF loop
- `mouseleave` → stop adding points (trail ages out)
- `touchmove` → add point (mobile equivalent)
- rAF draw loop: clear → age → prune → draw radial gradients
- HiDPI: canvas physical size = logical × DPR, `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)`
- Resize: `ResizeObserver` on parent container
- Cleanup: cancel rAF, disconnect observer, remove listeners on unmount
- Pheromone colour: `rgba(196, 150, 58, alpha)` — ochre from book palette
- Brush radius: 24px (fresh) → 40px (fading), alpha: 0.12 (peak) → 0 (expired)

**Acceptance criteria**:
- [ ] Component renders without errors
- [ ] Canvas is invisible on page mount (no trail points initially)
- [ ] Moving cursor over canvas area draws fading radial gradient trail
- [ ] Trail points expire and fade after ~2 seconds
- [ ] Moving cursor away stops new points, existing trail fades out
- [ ] Canvas is transparent (`pointer-events: none`) — clicks on underlying text work
- [ ] Touch-drag on mobile draws equivalent trail
- [ ] Canvas resizes correctly when window is resized
- [ ] No memory leaks (rAF cancelled, observers disconnected, listeners removed on unmount)
- [ ] Runs at 60fps with no jank (profile with browser DevTools)

---

### Wave 2: AntennaePage Integration

**Agent B**: `src/components/pages/AntennaePage.tsx`

**Specs**:
- Wrap existing `PageSpread` in `<div style={{ position: 'relative', overflow: 'hidden' }}>`
- Add `<PheromoneCanvas />` as sibling below `PageSpread`
- Keep all existing config (title, credit, pull quote, body, figure, page number) — unchanged
- Import `PheromoneCanvas` from `../PheromoneCanvas`

**Acceptance criteria**:
- [ ] Page renders without errors
- [ ] All existing content (title, credit, pull quote, body, figure, page number) displays normally
- [ ] Pheromone plume effect works when moving cursor over page
- [ ] Clicking text, images, or pull quote works (canvas doesn't intercept)
- [ ] No TypeScript errors or lint warnings
- [ ] No runtime errors in browser console

---

### Wave 3: Visual Polish + Verification

**Agent C**: Manual verification + optional CSS polish

**Specs**:
- Navigate to Antennae page in browser
- Verify pheromone plume effect:
  - Cursor movement creates soft, amber-tinted radial trail
  - Trail fades naturally over ~2 seconds
  - Trail spreads slightly as it ages (24px → 40px radius)
  - Effect is subtle — body text remains readable through the plume
  - No visual artifacts (flickering, harsh edges, colour clipping)
- Verify mobile touch equivalent
- Verify no scroll jank or interaction blocking
- Check HiDPI rendering on Retina display (sharp gradients, no pixelation)
- Optional: Add CSS custom property `--pheromone-colour` to antennae.css for design token consistency

**Acceptance criteria**:
- [ ] Visual effect matches PRD description: "soft, slow-fading chemical plume behind the cursor"
- [ ] Trail is subtle enough that body text remains readable through it
- [ ] No visual artifacts at any stage (entry, active, exit)
- [ ] Works on both desktop and mobile viewports
- [ ] No performance regressions (no scroll jank, no interaction delay)

---

## Agent Execution Summary

| Wave | Task | Agent | Dependencies | Can Parallelize With |
|------|------|-------|-------------|---------------------|
| 1 | PheromoneCanvas.tsx | A | None | — |
| 2 | AntennaePage.tsx | B | Wave 1 (A) | — |
| 3 | Verification + polish | C | Wave 2 (B) | — |

**Minimum critical path**: 3 sequential waves. No parallelism possible because each wave depends on the previous output.

**Why not parallelize Wave 1 + Wave 2**: `AntennaePage` imports `PheromoneCanvas`. If Agent B writes the import before Agent A creates the file, TypeScript will error. Agent B can draft the file structure but cannot complete it until `PheromoneCanvas.tsx` exists.

**Practical approach**: If you have multiple agents available, Agent A starts on Wave 1. Agent B can prepare by reading the existing `AntennaePage.tsx` and understanding the wrapper pattern (study `WingsPage.tsx`). Once Wave 1 lands, Wave 2 is a ~10-line change.

---

## Acceptance Criteria Checklist (All Phases)

- [ ] Canvas overlay sits above AntennaePage's `PageSpread` content
- [ ] Canvas has `pointer-events: none` — does not block clicks on text, images, or navigation
- [ ] `mousemove` events add cursor position to a trail buffer
- [ ] Each `rAF` frame clears canvas and redraws trail points with decaying alpha
- [ ] Plume is subtle enough that body text remains readable through it
- [ ] Canvas is clean (empty) on page entry — no residual plume
- [ ] On `mouseleave`, trail clears and canvas goes transparent (natural aging)
- [ ] `touchmove` on mobile provides equivalent plume-drawing behavior
- [ ] Uses book palette colour (amber/gold `#c4963a` / ochre)
- [ ] Runs at 60fps with no jank
- [ ] HiDPI rendering: sharp gradients on Retina/high-DPI displays
- [ ] No new npm dependencies
- [ ] No TypeScript errors or lint warnings
- [ ] No runtime errors in browser console

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Canvas blocks clicks on text/figure | Low | High | `pointer-events: none` on container div — verify with click tests on pull quote, figure image, and body text |
| rAF loop runs when no points present (wasted CPU) | Low | Low | Guard: `if (trail.length > 0) rafRef.current = requestAnimationFrame(draw)` — loop stops when buffer empties |
| Trail buffer grows unbounded on rapid mousemove | Low | Medium | Hard cap: `while (trail.length > MAX_POINTS) trail.shift()` — oldest points dropped |
| HiDPI canvas blurry on Retina displays | Medium | Medium | `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)` ensures physical pixels match logical. Test on 2× and 3× displays. |
| `touchmove` scrolls page on mobile | Medium | Low | `{ passive: true }` on listener — doesn't prevent default scroll. Canvas is `pointer-events: none` so touch events pass through. The plume draws from `touchmove` but scroll is unaffected. |
| `ResizeObserver` fires excessively during window resize | Low | Low | Canvas resize is just setting `width/height` — cheap operation. No debounce needed. |
| Pheromone effect too visible/obtrusive | Medium | Medium | Tune `BASE_ALPHA` (currently 0.12). If too strong, reduce to 0.08. If too faint, increase to 0.15. User testing required. |
| Gradient circles look "pixelated" at low DPR | Low | Low | At 1× DPR, radial gradients may show banding. Mitigation: use `ctx.createRadialGradient` (native, smooth) not manual pixel iteration. |

---

## Design Decisions & Rationale

### Why not CSS `transition` or `filter: blur`?

CSS transitions are declarative but can't handle the per-point age-based alpha decay that the pheromone effect requires. Each trail point has an independent age value, so we need per-frame computation. `filter: blur` on DOM elements would work for a single point but compositing 40 blurred elements at 60fps is slower than canvas `arc()` + `createRadialGradient()`.

### Why radial gradients instead of simple circles with alpha?

A flat `ctx.arc()` with `globalAlpha` produces a hard-edged circle. The pheromone plume should feel like a soft, diffuse cloud. `createRadialGradient()` gives a smooth falloff from centre to edge, which looks more organic. The performance cost is negligible for ~40 gradients per frame on a modern GPU.

### Why prune from the front of the array (`shift()`) instead of filtering?

The trail buffer is FIFO — oldest points expire first. `shift()` is O(n) for arrays, but with n ≤ 40, the cost is trivial. `filter()` creates a new array every frame (allocation pressure). `splice(i, 1)` in reverse order (iterate backwards, splice expired) avoids shifting during the loop — used in the implementation above.

### Why not use `will-change` or `OffscreenCanvas`?

`will-change` is a CSS hint for browser compositing — irrelevant for canvas content drawn via 2D context. `OffscreenCanvas` requires a Web Worker, which adds complexity for no benefit here — the draw loop is lightweight and doesn't block the main thread at 40 points × 60fps.

### Trail point radius: why 24px → 40px?

Fresh trail points (just added) should feel like a concentrated plume — the cursor's immediate position. As they age, they should spread and diffuse, mimicking chemical diffusion in air. The expanding radius (24px at age 0 → 40px at age 2000ms) creates this effect. The values are starting points — user testing will determine if they need adjustment.

### Why no "hint text" (e.g. "move your cursor")?

The PRD does NOT specify hint text for the Antennae page (unlike the Mimicry page which has "drag to reveal"). The pheromone effect is immediately visible on first cursor movement — no instruction needed. Adding a hint would clutter the page and undermine the subtle, discovery-driven design philosophy.

---

## Comparison with WingsPage Butterfly Pattern

| Aspect | WingsPage Butterfly | AntennaePage Pheromone |
|--------|-------------------|----------------------|
| Surface | SVG element | Canvas 2D |
| Positioning | Absolute, driven by Pretext anchor positions | Absolute, driven by cursor position |
| Animation | Catmull-Rom spline waypoints + SMIL wing flaps | rAF trail buffer + radial gradients |
| Interaction | Click to fly between anchors | Passive — responds to mouse/touch movement |
| Text routing | BandObstacle — body text routes around it | No obstacle — canvas is transparent to text |
| State machine | 4 phases (at-start, flying, at-end, settling) | None — single passive mode |
| Complexity | High | Low |

The PheromoneCanvas is significantly simpler than the Butterfly component. It has no state machine, no Pretext coupling, no obstacle reporting, and no autonomous movement. It's a pure reactive overlay — input (cursor position) → output (canvas draw).
