# Implementation Plan: Pheromone Drop + Attracted Moths

> **Source**: `docs/PLANS/new/interactive-pretext-anitamation-design/indiviual-plans/pheromone-drop-moths-plan.md`
> **PRD User Stories**: 1–16
> **Complexity**: Medium (state machine + spline paths + canvas rendering on existing loop)

---

## Problem Space

The existing `PheromoneCanvas` on the Antennae page renders a passive cursor trail (fading ochre radial gradients following the mouse). The PRD adds two features: (1) click to place a persistent pheromone drop (glowing dot, 8s lifecycle), and (2) moths (`) • (`) that spawn from page edges, zig-zag toward the drop, rest on it, then depart. Everything renders on the same canvas via the existing rAF loop — no new DOM elements.

### Constraints

1. **Single canvas**: All rendering on existing `PheromoneCanvas`. No new canvases, no DOM elements.
2. **No new dependencies**: Zero npm packages.
3. **No Pretext coupling**: Moths fly freely over text, don't route it.
4. **Click vs. move**: Must distinguish click (place drop) from drag (trail only). Track mousedown position, if mouseup at same position (≤5px tolerance) = click.
5. **Mobile**: `touchstart` without preceding `touchmove` = tap/drop.
6. **60fps target**: All animation via existing rAF loop.
7. **Existing code reuse**: Butterfly component already has Catmull-Rom spline + PRNG code that can be copied/adapted.

---

## File Manifest

| File | Type | Purpose |
|------|------|---------|
| `src/components/PheromoneCanvas.tsx` | **Modified** | Add drop state, moth state machine, click detection, moth rendering to existing rAF loop |
| `src/layout-engine/moth-path.ts` | **New (optional)** | Pure utility: Catmull-Rom waypoint generation with distance-based offset (extracted from Butterfly pattern) |

---

## Architecture

### State Model (within PheromoneCanvas refs)

```ts
// Drop state
interface PheromoneDrop {
  x: number
  y: number
  spawnTime: number     // performance.now() when placed
  lifetime: number      // 8000ms total
  pulseStart: number    // when pulse phase begins
}

// Moth state machine
type MothPhase = 'spawned' | 'approaching' | 'resting' | 'departing' | 'gone'

interface Moth {
  id: number
  phase: MothPhase
  x: number
  y: number
  alpha: number          // 0–1, for fade in/out
  spawnEdge: 'left' | 'right' | 'top' | 'bottom'
  spawnPos: number       // position along the chosen edge (0–1 normalized)
  phaseTime: number      // performance.now() when current phase started
  phaseDuration: number  // how long this phase lasts (varies by phase)
  waypoints: Point[]     // Catmull-Rom spline waypoints toward drop
  waypointProgress: number // 0–1 along current waypoint sequence
  wingPhase: number      // 0–1, oscillates for wing flap animation
  restDuration: number   // 2000–3000ms, random per moth
}
```

### rAF Loop Extension

```
Existing loop:
  1. Age trail points → prune expired → draw radial gradients

Extended loop:
  1. Age trail points → prune expired → draw radial gradients
  2. Draw pheromone drop (if active) → update alpha via pulse/decay
  3. For each active moth:
     a. Update phase (check timers, transition if needed)
     b. Calculate position (interpolate waypoints or spawn/depart path)
     c. Update wing phase (oscillate for flap)
     d. Draw moth: ) • ( at current position with current alpha
  4. Remove gone moths from active list
  5. Schedule next rAF if there's anything to animate
```

---

## Detailed Implementation Specs

### 1. Click/Tap Detection — Distinguish Click from Drag

**Problem**: The canvas already listens to `mousemove` for the trail. We need to detect a deliberate click (mousedown → mouseup at same position) vs. a drag (mousedown → mousemove → mouseup).

**Solution**: Track `mousedown` position in a ref. On `mouseup`, compare to mousedown position. If distance ≤ 5px and no `mousemove` occurred between them, treat as click.

```ts
const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null)
const hasMovedRef = useRef(false)

const handleMouseDown = (e: React.MouseEvent) => {
  mouseDownPosRef.current = { x: e.clientX, y: e.clientY }
  hasMovedRef.current = false
}

const handleMouseMove = (e: React.MouseEvent) => {
  // ... existing trail logic ...
  if (mouseDownPosRef.current) {
    const dx = e.clientX - mouseDownPosRef.current.x
    const dy = e.clientY - mouseDownPosRef.current.y
    if (Math.sqrt(dx * dx + dy * dy) > 5) {
      hasMovedRef.current = true
    }
  }
}

const handleMouseUp = (e: React.MouseEvent) => {
  if (mouseDownPosRef.current && !hasMovedRef.current) {
    // This is a click — place drop
    const rect = containerRef.current?.getBoundingClientRect()
    if (rect) {
      placeDrop(e.clientX - rect.left, e.clientY - rect.top)
    }
  }
  mouseDownPosRef.current = null
  hasMovedRef.current = false
}

// Mobile equivalent
const handleTouchStart = (e: React.TouchEvent) => {
  if (e.touches.length === 0) return
  const t = e.touches[0]!
  mouseDownPosRef.current = { x: t.clientX, y: t.clientY }
  hasMovedRef.current = false
}

const handleTouchMove = (e: React.TouchEvent) => {
  // ... existing trail logic ...
  if (mouseDownPosRef.current && e.touches.length > 0) {
    const t = e.touches[0]!
    const dx = t.clientX - mouseDownPosRef.current.x
    const dy = t.clientY - mouseDownPosRef.current.y
    if (Math.sqrt(dx * dx + dy * dy) > 5) {
      hasMovedRef.current = true
    }
  }
}

const handleTouchEnd = (e: React.TouchEvent) => {
  if (mouseDownPosRef.current && !hasMovedRef.current) {
    // This is a tap — place drop
    const rect = containerRef.current?.getBoundingClientRect()
    if (rect) {
      const t = e.changedTouches[0]!
      placeDrop(t.clientX - rect.left, t.clientY - rect.top)
    }
  }
  mouseDownPosRef.current = null
  hasMovedRef.current = false
}
```

**Note**: These handlers must be added to the existing event listeners. The existing `handleMouseMove`/`handleTouchMove` functions already add trail points — we're just adding the movement tracking alongside.

---

### 2. Drop Placement + Lifecycle

**`placeDrop(x, y)` function**:

```ts
const placeDrop = useCallback((x: number, y: number) => {
  const now = performance.now()
  dropRef.current = {
    x,
    y,
    spawnTime: now,
    lifetime: 8000,
    pulseStart: now,
  }
  
  // Spawn moths toward new drop
  spawnMoths(x, y)
}, [])
```

**Drop rendering in rAF loop**:

```ts
const drawDrop = useCallback((ctx: CanvasRenderingContext2D, now: number) => {
  const drop = dropRef.current
  if (!drop) return
  
  const age = now - drop.spawnTime
  if (age >= drop.lifetime) {
    dropRef.current = null
    return
  }
  
  // Calculate alpha
  let alpha: number
  if (age < 6000) {
    // Pulsing phase: alpha oscillates 0.4–0.55
    alpha = 0.4 + 0.15 * Math.sin((now - drop.pulseStart) * 0.012) // ~2Hz
  } else {
    // Fading phase: linear from current pulse value to 0
    const fadeProgress = (age - 6000) / 2000 // 0–1 over 2 seconds
    const pulseAlpha = 0.4 + 0.15 * Math.sin((now - drop.pulseStart) * 0.012)
    alpha = pulseAlpha * (1 - fadeProgress)
  }
  
  // Draw glow halo
  const glowGradient = ctx.createRadialGradient(drop.x, drop.y, 0, drop.x, drop.y, 16)
  glowGradient.addColorStop(0, `rgba(230, 196, 102, ${alpha * 0.3})`) // ochre-bright
  glowGradient.addColorStop(1, 'rgba(230, 196, 102, 0)')
  ctx.fillStyle = glowGradient
  ctx.beginPath()
  ctx.arc(drop.x, drop.y, 16, 0, Math.PI * 2)
  ctx.fill()
  
  // Draw core drop
  const coreGradient = ctx.createRadialGradient(drop.x, drop.y, 0, drop.x, drop.y, 6)
  coreGradient.addColorStop(0, `rgba(196, 150, 58, ${alpha})`)
  coreGradient.addColorStop(1, `rgba(196, 150, 58, ${alpha * 0.3})`)
  ctx.fillStyle = coreGradient
  ctx.beginPath()
  ctx.arc(drop.x, drop.y, 6, 0, Math.PI * 2)
  ctx.fill()
}, [])
```

**Key details**:
- Drop core radius: 6px, glow halo: 16px
- Core colour: `#c4963a` (ochre), glow: `#e6c466` (ochre-bright)
- Pulse frequency: `sin(t * 0.012)` ≈ 2Hz (since rAF fires every ~16ms, 0.012 rad/ms × 1000ms / 2π ≈ 1.9Hz)
- Total lifetime: 8000ms (6000ms pulse + 2000ms fade)

---

### 3. Moth Shape Rendering + Wing Flap

**Draw moth at position (x, y) with wing flap phase**:

```ts
const drawMoth = useCallback((
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  alpha: number,
  wingPhase: number, // 0–1, oscillates
) => {
  ctx.save()
  ctx.globalAlpha = alpha
  
  const wingSweep = 55 + 15 * Math.sin(wingPhase * Math.PI * 2) // 50°–70° sweep
  const wingSize = 6
  const dotRadius = 1.5
  
  ctx.strokeStyle = `rgba(196, 150, 58, ${alpha})` // ochre
  ctx.lineWidth = 1.5
  ctx.lineCap = 'round'
  
  // Left wing: )
  ctx.beginPath()
  const leftStartAngle = Math.PI - (wingSweep * Math.PI / 180) / 2
  const leftEndAngle = Math.PI + (wingSweep * Math.PI / 180) / 2
  ctx.arc(x - 4, y, wingSize, leftStartAngle, leftEndAngle)
  ctx.stroke()
  
  // Right wing: (
  ctx.beginPath()
  const rightStartAngle = - (wingSweep * Math.PI / 180) / 2
  const rightEndAngle = (wingSweep * Math.PI / 180) / 2
  ctx.arc(x + 4, y, wingSize, rightStartAngle, rightEndAngle)
  ctx.stroke()
  
  // Center dot: •
  ctx.fillStyle = `rgba(44, 36, 24, ${alpha})` // ink
  ctx.beginPath()
  ctx.arc(x, y, dotRadius, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.restore()
}, [])
```

**Wing flap rates by phase**:
- Flying (`approaching`, `departing`): 3Hz → `wingPhase += delta * 0.003` (rAF ms delta)
- Resting: 1Hz → `wingPhase += delta * 0.001`
- Resting wing sweep: 35°–50° instead of 50°–70°

---

### 4. Moth State Machine + Transitions

**State transitions** (checked each rAF frame):

```ts
const updateMoth = useCallback((moth: Moth, now: number, dropX: number, dropY: number) => {
  const phaseAge = now - moth.phaseTime
  
  switch (moth.phase) {
    case 'spawned': {
      // Fade in over 200ms
      moth.alpha = Math.min(phaseAge / 200, 1)
      
      if (phaseAge >= 200) {
        // Transition to approaching
        moth.phase = 'approaching'
        moth.phaseTime = now
        moth.waypoints = generateWaypoints(moth, dropX, dropY)
        moth.waypointProgress = 0
      }
      break
    }
    
    case 'approaching': {
      // Interpolate along waypoints
      const speed = 60 // px/s
      moth.waypointProgress += (phaseAge / 1000) * speed / waypointLength
      
      if (moth.waypointProgress >= 1) {
        // Check if reached drop
        const dx = moth.x - dropX
        const dy = moth.y - dropY
        const dist = Math.sqrt(dx * dx + dy * dy)
        
        if (dist < 5) {
          // Reached drop → rest
          moth.phase = 'resting'
          moth.phaseTime = now
          moth.phaseDuration = moth.restDuration
          moth.x = dropX
          moth.y = dropY
        } else {
          // Generate new waypoints
          moth.waypoints = generateWaypoints(moth, dropX, dropY)
          moth.waypointProgress = 0
          moth.phaseTime = now
        }
      } else {
        // Update position from waypoint interpolation
        const pos = interpolateWaypoints(moth.waypoints, moth.waypointProgress)
        moth.x = pos.x
        moth.y = pos.y
      }
      
      // Wing flap at 3Hz
      moth.wingPhase += phaseAge * 0.003
      break
    }
    
    case 'resting': {
      moth.alpha = 1
      
      if (phaseAge >= moth.phaseDuration) {
        // Transition to departing
        moth.phase = 'departing'
        moth.phaseTime = now
        moth.phaseDuration = 2000 // 2 second fade-out
        moth.departTarget = getNearestEdgePoint(moth.x, moth.y, containerWidth, containerHeight)
      }
      
      // Wing flap at 1Hz (slower)
      moth.wingPhase += phaseAge * 0.001
      break
    }
    
    case 'departing': {
      const fadeProgress = Math.min(phaseAge / 2000, 1)
      moth.alpha = 1 - fadeProgress
      
      // Interpolate from current position to edge
      moth.x = lerp(moth.x, moth.departTarget!.x, fadeProgress * 0.1)
      moth.y = lerp(moth.y, moth.departTarget!.y, fadeProgress * 0.1)
      
      // Wing flap at 3Hz
      moth.wingPhase += phaseAge * 0.003
      
      if (fadeProgress >= 1) {
        moth.phase = 'gone'
      }
      break
    }
  }
}, [])
```

---

### 5. Moth Spawn Logic

**`spawnMoths(dropX, dropY)` function**:

```ts
const spawnMoths = useCallback((dropX: number, dropY: number) => {
  const count = 3 + Math.floor(Math.random() * 2) // 3–4
  const edges: Array<'left' | 'right' | 'top' | 'bottom'> = ['left', 'right', 'top', 'bottom']
  
  for (let i = 0; i < count; i++) {
    const edge = edges[Math.floor(Math.random() * 4)]!
    const edgePos = Math.random() // 0–1 along the edge
    
    const moth: Moth = {
      id: nextMothId++,
      phase: 'spawned',
      x: 0, // set by spawn edge calculation
      y: 0,
      alpha: 0,
      spawnEdge: edge,
      spawnPos: edgePos,
      phaseTime: performance.now() + i * (50 + Math.random() * 50), // staggered
      phaseDuration: 200,
      waypoints: [],
      waypointProgress: 0,
      wingPhase: Math.random(), // random starting wing position
      restDuration: 2000 + Math.random() * 1000, // 2–3 seconds
    }
    
    // Set initial position based on edge
    const w = containerWidth
    const h = containerHeight
    switch (edge) {
      case 'left':   moth.x = -20; moth.y = edgePos * h; break
      case 'right':  moth.x = w + 20; moth.y = edgePos * h; break
      case 'top':    moth.x = edgePos * w; moth.y = -20; break
      case 'bottom': moth.x = edgePos * w; moth.y = h + 20; break
    }
    
    mothsRef.current.push(moth)
  }
}, [])
```

---

### 6. Approach Path: Waypoint Generation with Zig-Zag

**`generateWaypoints(moth, dropX, dropY)` function**:

```ts
interface Point { x: number; y: number }

function generateWaypoints(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  distanceToDrop: number,
): Point[] {
  const dx = toX - fromX
  const dy = toY - fromY
  const dist = Math.sqrt(dx * dx + dy * dy) || 1
  
  // Normalize direction
  const dirX = dx / dist
  const dirY = dy / dist
  // Perpendicular
  const perpX = -dirY
  const perpY = dirX
  
  // Offset magnitude: decreases as moth gets closer to drop
  const baseOffset = Math.max(5, Math.min(80, dist * 0.3)) // 5–80px
  
  const numWaypoints = 3 + Math.floor(Math.random() * 3) // 3–5
  const waypoints: Point[] = []
  
  for (let i = 1; i <= numWaypoints; i++) {
    const frac = i / (numWaypoints + 1)
    const baseX = fromX + dx * frac
    const baseY = fromY + dy * frac
    
    // Random perpendicular offset, decreasing near the end
    const side = Math.random() > 0.5 ? 1 : -1
    const offsetMag = baseOffset * (1 - frac * 0.7) // reduces by 70% at end
    
    waypoints.push({
      x: baseX + perpX * offsetMag * side * (0.5 + Math.random() * 0.5),
      y: baseY + perpY * offsetMag * side * (0.5 + Math.random() * 0.5),
    })
  }
  
  // Final waypoint is the drop position
  waypoints.push({ x: toX, y: toY })
  
  return waypoints
}
```

**Catmull-Rom interpolation** (copy from Butterfly's `splineAt` function):

```ts
// From Butterfly.tsx — reuse or copy to moth-path.ts
function cr1d(p0: number, p1: number, p2: number, p3: number, t: number): number {
  return 0.5 * (
    2 * p1 +
    (-p0 + p2) * t +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t +
    (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t
  )
}

function interpolateWaypoints(pts: Point[], t: number): Point {
  const n = pts.length - 1
  const seg = Math.min(Math.floor(t * n), n - 1)
  const lt = t * n - seg
  const p0 = pts[Math.max(0, seg - 1)]!
  const p1 = pts[seg]!
  const p2 = pts[Math.min(n, seg + 1)]!
  const p3 = pts[Math.min(n, seg + 2)]!
  return {
    x: cr1d(p0.x, p1.x, p2.x, p3.x, lt),
    y: cr1d(p0.y, p1.y, p2.y, p3.y, lt),
  }
}
```

---

### 7. Departure: Fly to Nearest Edge

**`getNearestEdgePoint(x, y, width, height)` function**:

```ts
function getNearestEdgePoint(
  x: number,
  y: number,
  w: number,
  h: number,
): Point {
  const distToLeft = x
  const distToRight = w - x
  const distToTop = y
  const distToBottom = h - y
  
  const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom)
  
  if (minDist === distToLeft) return { x: -30, y: y + (Math.random() - 0.5) * 60 }
  if (minDist === distToRight) return { x: w + 30, y: y + (Math.random() - 0.5) * 60 }
  if (minDist === distToTop) return { x: x + (Math.random() - 0.5) * 60, y: -30 }
  return { x: x + (Math.random() - 0.5) * 60, y: h + 30 }
}
```

---

### 8. Drop–Moth Interaction

When a new drop is placed while moths are active:

```ts
const placeDrop = useCallback((x: number, y: number) => {
  const now = performance.now()
  
  // Update existing moths
  for (const moth of mothsRef.current) {
    if (moth.phase === 'approaching') {
      // Recalculate waypoints to new drop
      moth.waypoints = generateWaypoints(moth.x, moth.y, x, y, distance(moth.x, moth.y, x, y))
      moth.waypointProgress = 0
      moth.phaseTime = now
    }
    // resting/departing/gone moths are unaffected
  }
  
  // Place new drop
  dropRef.current = { x, y, spawnTime: now, lifetime: 8000, pulseStart: now }
  
  // Spawn new moths
  spawnMoths(x, y)
}, [spawnMoths])
```

---

## Task Breakdown for AI Worker Agents

### Wave 1: Drop Placement + Click Detection

**Agent A**: Modify `PheromoneCanvas.tsx` — add click/tap detection and drop lifecycle

**Specs**:
- Add `mouseDownPosRef`, `hasMovedRef` for click vs. drag distinction
- Modify existing `handleMouseDown`, `handleMouseMove`, `handleMouseUp` to track movement
- Add `handleTouchStart`, `handleTouchEnd` tap detection (modify existing touch handlers)
- Implement `placeDrop(x, y)` function with drop state ref
- Add `drawDrop(ctx, now)` to rAF loop
- Drop: radial gradient core (6px) + glow halo (16px), pulsing alpha (0.4–0.55 at 2Hz), 8s total lifetime
- Clicking replaces old drop, spawns moths (stub `spawnMoths` for now)

**Acceptance criteria**:
- [ ] Click places glowing dot at cursor position
- [ ] Dot pulses (breathes) gently
- [ ] Clicking again moves dot to new position
- [ ] Dot fades and disappears after ~8 seconds
- [ ] Mobile tap places dot equivalently
- [ ] Dragging does NOT place a drop
- [ ] Existing pheromone trail still works

---

### Wave 2: Moth Rendering + Wing Flap

**Agent B**: Add moth drawing function to `PheromoneCanvas.tsx`

**Specs**:
- Implement `drawMoth(ctx, x, y, alpha, wingPhase)` — `) • (` shape
- Left wing: `ctx.arc(x - 4, y, 6, startAngle, endAngle)` — closing arc
- Right wing: mirror arc
- Center dot: `ctx.arc(x, y, 1.5, 0, π*2)` filled
- Wing flap: oscillate arc sweep 50°–70° at 3Hz via `wingPhase`
- Resting wing flap: 35°–50° at 1Hz
- Call `drawMoth` from rAF loop for each active moth (test with a static moth at fixed position)

**Acceptance criteria**:
- [ ] Moth renders as `) • (` on canvas
- [ ] Wing flap animates visibly (3Hz while "flying")
- [ ] Resting wing flap is slower and narrower (1Hz, 35°–50°)
- [ ] Moth alpha controls opacity
- [ ] Moth is ~16×12px at logical size
- [ ] HiDPI rendering is sharp

---

### Wave 3: Moth State Machine + Spawn

**Agent C**: Implement moth state machine and spawn logic

**Specs**:
- Define `Moth` interface with all fields
- Implement `spawnMoths(dropX, dropY)` — 3–4 moths from random edges, staggered
- Implement `updateMoth(moth, now, dropX, dropY)` — state transitions
- `spawned` → fade in 200ms → `approaching` (stub: just move toward drop linearly for now)
- `approaching` → reach drop → `resting`
- `resting` → 2–3s → `departing`
- `departing` → fade 2s → `gone` → remove from list
- Integrate `updateMoth` into rAF loop
- Integrate `drawMoth` calls per moth in rAF loop

**Acceptance criteria**:
- [ ] Placing drop spawns 3–4 moths from random edges
- [ ] Moths fade in from off-screen over 200ms
- [ ] Spawn is staggered (50–100ms apart)
- [ ] Moths transition through all states correctly
- [ ] Moths reach drop, rest, depart, and are removed
- [ ] `spawned` moths approach drop (linear path is fine for now)
- [ ] Active moth count stays bounded (gone moths removed)

---

### Wave 4: Catmull-Rom Approach Paths (Zig-Zag → Straight)

**Agent D**: Implement waypoint generation + spline interpolation

**Specs**:
- Copy Catmull-Rom spline functions from Butterfly.tsx (`cr1d`, `splineAt` equivalent)
- Implement `generateWaypoints(fromX, fromY, toX, toY, distance)` with perpendicular offset
- Offset: 80px at start → 5px at drop (decreases with progress)
- 3–5 waypoints, regenerated every ~1 second
- `interpolateWaypoints(waypoints, t)` returns position at progress t
- Wire into `approaching` state in `updateMoth`
- Moth speed: 60px/s

**Acceptance criteria**:
- [ ] Moths follow curved (not straight) paths toward drop
- [ ] Paths are zig-zaggy when far from drop
- [ ] Paths straighten as moths approach drop
- [ ] Waypoints regenerate every ~1 second
- [ ] Moths always reach within 5px of drop
- [ ] Spline interpolation is smooth (no jagged corners)

---

### Wave 5: Drop–Moth Interaction + Edge Cases

**Agent E**: Handle drop replacement, drop expiration, cleanup

**Specs**:
- Modify `placeDrop` to redirect approaching moths to new position
- Resting/departing moths unaffected by drop change
- Drop expiration: moths complete their current state using last known drop position
- Page navigation: all state resets via component unmount (automatic)
- Remove gone moths from active list (prevent memory leaks)
- Edge case: drop placed near page edge (short approach is fine)
- Edge case: all moths gone but drop still active (drop continues pulsing)

**Acceptance criteria**:
- [ ] New drop redirects approaching moths
- [ ] Resting moths finish rest and depart normally
- [ ] Departing moths unaffected by drop change
- [ ] Drop expiration doesn't crash moths
- [ ] Navigating away and back resets everything
- [ ] No memory leaks (moth list doesn't grow unbounded)

---

### Wave 6: Visual Polish + Integration Testing

**Agent F**: Manual verification + tuning

**Specs**:
- Navigate to Antennae page in browser
- Verify drop placement: click/tap, pulse visual, 8s fade
- Verify moth spawning: 3–4 moths appear from edges
- Verify approach paths: zig-zag → straight
- Verify resting: moths cluster on drop, wings slow
- Verify departure: moths fly away, fade out
- Verify drop replacement: new drop redirects moths
- Verify mobile: tap places drop, moths spawn
- Tune parameters (wing flap rate, moth speed, offset magnitude) for visual feel
- Profile rAF loop: confirm 60fps with 4 moths + drop + trail

**Acceptance criteria**:
- [ ] All 16 user stories verified in browser
- [ ] No visual artifacts (flickering, clipping, overlap issues)
- [ ] 60fps on modern laptop (Chrome DevTools Performance panel)
- [ ] Moths feel organic and alive, not mechanical
- [ ] Drop is clearly visible but not overpowering
- [ ] Works on mobile viewport (test at 375px width)

---

## Agent Execution Summary

| Wave | Task | Agent | Dependencies | Can Parallelize With |
|------|------|-------|-------------|---------------------|
| 1 | Click detection + drop lifecycle | A | None | — |
| 2 | Moth rendering + wing flap | B | None (test with static position) | Wave 1 |
| 3 | Moth state machine + spawn | C | Wave 1 (drop ref), Wave 2 (drawMoth) | — |
| 4 | Catmull-Rom approach paths | D | Wave 3 (state machine in place) | — |
| 5 | Drop–moth interaction + edge cases | E | Wave 4 (all behaviors working) | — |
| 6 | Visual polish + testing | F | Wave 5 (complete system) | — |

**Parallelism opportunity**: Wave 1 + Wave 2 can run simultaneously (drop and moth rendering are independent). Wave 2 can test moth rendering with a hardcoded position before the state machine exists.

**Minimum critical path**: 6 sequential waves → verified feature.

---

## Acceptance Criteria Checklist (All Phases)

- [ ] Click/tap places a glowing pheromone drop at cursor position
- [ ] Drop pulses gently (alpha oscillation 0.4–0.55)
- [ ] Only one drop exists at a time; clicking moves it
- [ ] Drop fades after ~8 seconds
- [ ] Drop is visually distinct from trail (brighter)
- [ ] Mobile tap places drop equivalently
- [ ] Click vs. drag distinction works
- [ ] 3–4 moths spawn from random edges when drop placed
- [ ] Moths drawn as `) • (` (parenthesis wings + center dot)
- [ ] Wing flap animates (3Hz flying, 1Hz resting)
- [ ] Moths zig-zag when far from drop
- [ ] Moth paths straighten as they approach
- [ ] Moths rest on drop for 2–3 seconds (wings slow)
- [ ] Moths depart, fading as they exit off-screen
- [ ] New drop redirects approaching moths
- [ ] Drop expiration doesn't break moths
- [ ] Page navigation resets all state
- [ ] No memory leaks
- [ ] 60fps with drop + 4 moths + trail active
- [ ] Existing pheromone trail unaffected

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| rAF loop becomes too heavy with moths + drop + trail | Low | High | Profile with DevTools. If jank, reduce moth count or simplify wing drawing. Budget: ~55 draw ops/frame is well within 60fps. |
| Click vs. drag distinction false positives | Medium | Medium | 5px tolerance is standard. Test with deliberate drags and clicks. Adjust to 8px if needed. |
| Moths spawn off-screen and never appear | Low | Medium | Verify spawn position calculation. Add debug mode that logs moth positions. |
| Zig-zag offset too extreme (moths fly off page) | Medium | Low | Clamp waypoint positions to canvas bounds. Offset decreases with distance, so moths near edges won't have large offsets. |
| Moth state machine gets stuck (phase never transitions) | Low | High | Add safety timeout: if moth stays in any phase > 10s, force transition to `gone`. Debug-only safeguard. |
| Drop placement fires on mobile scroll (touch event) | Medium | Medium | Use `touchend` without preceding `touchmove` as tap signal. Ensure scroll events generate `touchmove`. `hasMovedRef` catches this. |
| Moth wing arcs look like circles (not parentheses) | Medium | Low | Verify arc start/end angles. Use `ctx.arc(centerX, centerY, radius, startAngle, endAngle)` with angles in radians. Test visually. |
| Multiple drops accumulate if click fires rapidly | Low | Medium | `placeDrop` always replaces `dropRef.current` (single drop). Old drop is garbage-collected. No accumulation possible. |
