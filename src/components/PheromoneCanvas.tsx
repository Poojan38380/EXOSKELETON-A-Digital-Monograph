import { useRef, useEffect, useCallback } from 'react'

const MAX_AGE = 2000
const MAX_POINTS = 40
const BASE_ALPHA = 0.12
const BRUSH_RADIUS_MIN = 24
const BRUSH_RADIUS_MAX = 40
const PHEROMONE_COLOUR = '196, 150, 58' // ochre RGB

const DROP_LIFETIME = 8000 // 8 seconds total
const DROP_PULSE_DURATION = 6000 // 6 seconds of pulsing
const DROP_FADE_DURATION = 2000 // 2 seconds of fading
const CLICK_TOLERANCE = 5 // px tolerance for click vs drag

// Moth constants
const MOTH_SPAWN_COUNT_MIN = 3
const MOTH_SPAWN_COUNT_MAX = 4
const MOTH_SPAWN_FADE_MS = 200
const MOTH_SPAWN_STAGGER_MIN = 50
const MOTH_SPAWN_STAGGER_MAX = 100
const MOTH_REST_DURATION_MIN = 2000
const MOTH_REST_DURATION_MAX = 3000
const MOTH_DEPART_DURATION = 2000
const MOTH_APPROACH_SPEED = 60 // px/s
const MOTH_APPROACH_DISTANCE_THRESHOLD = 5 // px to trigger resting
const MOTH_WING_FLAP_FLYING_HZ = 0.003 // ~3Hz
const MOTH_WING_FLAP_RESTING_HZ = 0.001 // ~1Hz
const MOTH_WING_SWEEP_FLYING_MIN = 50
const MOTH_WING_SWEEP_FLYING_MAX = 70
const MOTH_WING_SWEEP_RESTING_MIN = 35
const MOTH_WING_SWEEP_RESTING_MAX = 50

interface TrailPoint {
  x: number
  y: number
  age: number
}

interface PheromoneDrop {
  id: number
  x: number
  y: number
  spawnTime: number
  pulseStart: number
}

type MothPhase = 'spawned' | 'approaching' | 'resting' | 'departing' | 'gone'

interface Point {
  x: number
  y: number
}

interface Moth {
  id: number
  phase: MothPhase
  x: number
  y: number
  alpha: number
  phaseTime: number
  phaseDuration: number
  waypoints: Point[]
  waypointProgress: number
  wingPhase: number
  restDuration: number
  dropId: number // which drop this moth is attracted to
  departTarget: Point | null
}

export function PheromoneCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const trailBufferRef = useRef<TrailPoint[]>([])
  const rafRef = useRef<number | null>(null)
  const lastFrameTimeRef = useRef(0)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)

  // Drop state (array for multiple drops)
  const dropsRef = useRef<PheromoneDrop[]>([])
  const nextDropIdRef = useRef(0)

  // Moth state
  const mothsRef = useRef<Moth[]>([])
  const nextMothIdRef = useRef(0)

  // Click vs drag detection
  const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null)
  const hasMovedRef = useRef(false)

  // Container dimensions (cached for moth spawn/depart)
  const containerSizeRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 })

  // --- Catmull-Rom spline utilities ---
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
    if (n === 0) return pts[0] ?? { x: 0, y: 0 }
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

  function waypointLength(pts: Point[]): number {
    let total = 0
    for (let i = 1; i < pts.length; i++) {
      const dx = pts[i]!.x - pts[i - 1]!.x
      const dy = pts[i]!.y - pts[i - 1]!.y
      total += Math.sqrt(dx * dx + dy * dy)
    }
    return total
  }

  function distance(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x1 - x2
    const dy = y1 - y2
    return Math.sqrt(dx * dx + dy * dy)
  }

  // --- Waypoint generation with zig-zag offset ---
  function generateWaypoints(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
  ): Point[] {
    const dx = toX - fromX
    const dy = toY - fromY
    const dist = Math.sqrt(dx * dx + dy * dy) || 1

    const dirX = dx / dist
    const dirY = dy / dist
    const perpX = -dirY
    const perpY = dirX

    const baseOffset = Math.max(5, Math.min(80, dist * 0.3))
    const numWaypoints = 3 + Math.floor(Math.random() * 3)
    const waypoints: Point[] = []

    for (let i = 1; i <= numWaypoints; i++) {
      const frac = i / (numWaypoints + 1)
      const baseX = fromX + dx * frac
      const baseY = fromY + dy * frac

      const side = Math.random() > 0.5 ? 1 : -1
      const offsetMag = baseOffset * (1 - frac * 0.7)

      waypoints.push({
        x: baseX + perpX * offsetMag * side * (0.5 + Math.random() * 0.5),
        y: baseY + perpY * offsetMag * side * (0.5 + Math.random() * 0.5),
      })
    }

    waypoints.push({ x: toX, y: toY })
    return waypoints
  }

  function getNearestEdgePoint(x: number, y: number, w: number, h: number): Point {
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

  // --- Draw moth ---
  function drawMoth(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    alpha: number,
    wingPhase: number,
    phase: MothPhase,
  ) {
    ctx.save()
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha))

    const isResting = phase === 'resting'
    const sweepMin = isResting ? MOTH_WING_SWEEP_RESTING_MIN : MOTH_WING_SWEEP_FLYING_MIN
    const sweepMax = isResting ? MOTH_WING_SWEEP_RESTING_MAX : MOTH_WING_SWEEP_FLYING_MAX
    const wingSweep = sweepMin + (sweepMax - sweepMin) * (0.5 + 0.5 * Math.sin(wingPhase * Math.PI * 2))
    const wingSize = 6

    ctx.strokeStyle = `rgba(196, 150, 58, ${ctx.globalAlpha})`
    ctx.lineWidth = 1.5
    ctx.lineCap = 'round'

    // Left wing: )
    ctx.beginPath()
    const leftCenterX = x - 4
    const leftStartAngle = Math.PI - (wingSweep * Math.PI / 180) / 2
    const leftEndAngle = Math.PI + (wingSweep * Math.PI / 180) / 2
    ctx.arc(leftCenterX, y, wingSize, leftStartAngle, leftEndAngle)
    ctx.stroke()

    // Right wing: (
    ctx.beginPath()
    const rightCenterX = x + 4
    const rightStartAngle = -(wingSweep * Math.PI / 180) / 2
    const rightEndAngle = (wingSweep * Math.PI / 180) / 2
    ctx.arc(rightCenterX, y, wingSize, rightStartAngle, rightEndAngle)
    ctx.stroke()

    // Center dot
    ctx.fillStyle = `rgba(44, 36, 24, ${ctx.globalAlpha})`
    ctx.beginPath()
    ctx.arc(x, y, 1.5, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }

  // --- Update moth state machine ---
  function updateMoth(moth: Moth, now: number, drops: PheromoneDrop[]) {
    const phaseAge = now - moth.phaseTime

    // Find the drop this moth is following
    const drop = drops.find((d) => d.id === moth.dropId) ?? null

    switch (moth.phase) {
      case 'spawned': {
        moth.alpha = Math.min(phaseAge / MOTH_SPAWN_FADE_MS, 1)
        if (phaseAge >= MOTH_SPAWN_FADE_MS) {
          moth.phase = 'approaching'
          moth.phaseTime = now
          if (drop) {
            moth.waypoints = generateWaypoints(moth.x, moth.y, drop.x, drop.y)
            moth.waypointProgress = 0
          } else {
            // No drop, go to departed
            moth.phase = 'departing'
            moth.phaseTime = now
            moth.phaseDuration = MOTH_DEPART_DURATION
            const { w, h } = containerSizeRef.current
            moth.departTarget = getNearestEdgePoint(moth.x, moth.y, w, h)
          }
        }
        break
      }

      case 'approaching': {
        if (!drop) {
          // Drop expired, depart
          moth.phase = 'departing'
          moth.phaseTime = now
          moth.phaseDuration = MOTH_DEPART_DURATION
          const { w, h } = containerSizeRef.current
          moth.departTarget = getNearestEdgePoint(moth.x, moth.y, w, h)
          break
        }

        // Regenerate waypoints every ~1 second
        if (phaseAge > 1000) {
          moth.waypoints = generateWaypoints(moth.x, moth.y, drop.x, drop.y)
          moth.waypointProgress = 0
          moth.phaseTime = now
          break
        }

        const pathLen = waypointLength(moth.waypoints)
        if (pathLen > 0) {
          const progressDelta = (16 / 1000) * MOTH_APPROACH_SPEED / pathLen // 16ms ≈ one frame
          moth.waypointProgress += progressDelta
        }

        if (moth.waypointProgress >= 1) {
          const dist = distance(moth.x, moth.y, drop.x, drop.y)
          if (dist < MOTH_APPROACH_DISTANCE_THRESHOLD) {
            moth.phase = 'resting'
            moth.phaseTime = now
            moth.phaseDuration = moth.restDuration
            moth.x = drop.x
            moth.y = drop.y
            moth.waypoints = []
            moth.waypointProgress = 0
          } else {
            moth.waypoints = generateWaypoints(moth.x, moth.y, drop.x, drop.y)
            moth.waypointProgress = 0
            moth.phaseTime = now
          }
        } else {
          const pos = interpolateWaypoints(moth.waypoints, moth.waypointProgress)
          moth.x = pos.x
          moth.y = pos.y
        }

        moth.wingPhase += 16 * MOTH_WING_FLAP_FLYING_HZ
        break
      }

      case 'resting': {
        moth.alpha = 1
        if (drop) {
          moth.x = drop.x
          moth.y = drop.y
        }

        if (phaseAge >= moth.phaseDuration) {
          moth.phase = 'departing'
          moth.phaseTime = now
          moth.phaseDuration = MOTH_DEPART_DURATION
          const { w, h } = containerSizeRef.current
          moth.departTarget = getNearestEdgePoint(moth.x, moth.y, w, h)
        }

        moth.wingPhase += 16 * MOTH_WING_FLAP_RESTING_HZ
        break
      }

      case 'departing': {
        if (!moth.departTarget) {
          const { w, h } = containerSizeRef.current
          moth.departTarget = getNearestEdgePoint(moth.x, moth.y, w, h)
        }

        const fadeProgress = Math.min(phaseAge / moth.phaseDuration, 1)
        moth.alpha = 1 - fadeProgress

        // Smooth lerp toward depart target
        const lerpFactor = 0.05 + fadeProgress * 0.1
        moth.x += (moth.departTarget.x - moth.x) * lerpFactor
        moth.y += (moth.departTarget.y - moth.y) * lerpFactor

        moth.wingPhase += 16 * MOTH_WING_FLAP_FLYING_HZ

        if (fadeProgress >= 1) {
          moth.phase = 'gone'
        }
        break
      }

      case 'gone':
        break
    }
  }

  // --- Spawn moths ---
  function spawnMoths(dropId: number) {
    const count = MOTH_SPAWN_COUNT_MIN + Math.floor(Math.random() * (MOTH_SPAWN_COUNT_MAX - MOTH_SPAWN_COUNT_MIN + 1))
    const edges: Array<'left' | 'right' | 'top' | 'bottom'> = ['left', 'right', 'top', 'bottom']
    const { w, h } = containerSizeRef.current
    const now = performance.now()

    for (let i = 0; i < count; i++) {
      const edge = edges[Math.floor(Math.random() * 4)]!
      const edgePos = Math.random()

      let sx = 0
      let sy = 0
      switch (edge) {
        case 'left':
          sx = -20
          sy = edgePos * h
          break
        case 'right':
          sx = w + 20
          sy = edgePos * h
          break
        case 'top':
          sx = edgePos * w
          sy = -20
          break
        case 'bottom':
          sx = edgePos * w
          sy = h + 20
          break
      }

      const moth: Moth = {
        id: nextMothIdRef.current++,
        phase: 'spawned',
        x: sx,
        y: sy,
        alpha: 0,
        phaseTime: now + i * (MOTH_SPAWN_STAGGER_MIN + Math.random() * (MOTH_SPAWN_STAGGER_MAX - MOTH_SPAWN_STAGGER_MIN)),
        phaseDuration: MOTH_SPAWN_FADE_MS,
        waypoints: [],
        waypointProgress: 0,
        wingPhase: Math.random(),
        restDuration: MOTH_REST_DURATION_MIN + Math.random() * (MOTH_REST_DURATION_MAX - MOTH_REST_DURATION_MIN),
        dropId,
        departTarget: null,
      }

      mothsRef.current.push(moth)
    }
  }

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
    containerSizeRef.current = { w, h }

    ctx.clearRect(0, 0, w, h)

    // Age and prune expired points
    const trail = trailBufferRef.current
    for (let i = trail.length - 1; i >= 0; i--) {
      trail[i]!.age += delta
      if (trail[i]!.age > MAX_AGE) {
        trail.splice(i, 1)
      }
    }

    // Draw each trail point
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

    // Draw and age all pheromone drops
    const drops = dropsRef.current
    for (let i = drops.length - 1; i >= 0; i--) {
      const drop = drops[i]!
      const age = now - drop.spawnTime
      if (age >= DROP_LIFETIME) {
        drops.splice(i, 1)
        continue
      }

      // Calculate alpha
      let alpha: number
      if (age < DROP_PULSE_DURATION) {
        alpha = 0.4 + 0.15 * Math.sin((now - drop.pulseStart) * 0.012)
      } else {
        const fadeProgress = (age - DROP_PULSE_DURATION) / DROP_FADE_DURATION
        const pulseAlpha = 0.4 + 0.15 * Math.sin((now - drop.pulseStart) * 0.012)
        alpha = pulseAlpha * (1 - fadeProgress)
      }

      // Draw glow halo
      const glowGradient = ctx.createRadialGradient(drop.x, drop.y, 0, drop.x, drop.y, 16)
      glowGradient.addColorStop(0, `rgba(230, 196, 102, ${alpha * 0.3})`)
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
    }

    // Update and draw all moths
    const moths = mothsRef.current
    for (const moth of moths) {
      updateMoth(moth, now, dropsRef.current)
      drawMoth(ctx, moth.x, moth.y, moth.alpha, moth.wingPhase, moth.phase)
    }

    // Remove gone moths
    mothsRef.current = moths.filter((m) => m.phase !== 'gone')

    // Continue only if there's something to animate
    const hasDrops = dropsRef.current.length > 0
    const hasMoths = mothsRef.current.length > 0
    if (trail.length > 0 || hasDrops || hasMoths) {
      rafRef.current = requestAnimationFrame(draw)
    } else {
      rafRef.current = null
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

    // Use window listeners because the overlay has pointer-events: none
    const handleMouseDown = (e: MouseEvent) => {
      mouseDownPosRef.current = { x: e.clientX, y: e.clientY }
      hasMovedRef.current = false
    }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      // Only add points when cursor is inside container bounds
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      ) {
        return
      }

      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      // Track movement for click vs drag detection
      if (mouseDownPosRef.current) {
        const dx = e.clientX - mouseDownPosRef.current.x
        const dy = e.clientY - mouseDownPosRef.current.y
        if (Math.sqrt(dx * dx + dy * dy) > CLICK_TOLERANCE) {
          hasMovedRef.current = true
        }
      }

      const trail = trailBufferRef.current
      trail.push({ x, y, age: 0 })

      if (trail.length > MAX_POINTS) {
        trail.shift()
      }

      startDrawLoop()
    }

    const handleMouseUp = (e: MouseEvent) => {
      if (mouseDownPosRef.current && !hasMovedRef.current) {
        const rect = container.getBoundingClientRect()
        if (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        ) {
          const x = e.clientX - rect.left
          const y = e.clientY - rect.top
          const now = performance.now()
          const dropId = nextDropIdRef.current++
          dropsRef.current.push({
            x,
            y,
            spawnTime: now,
            pulseStart: now,
            id: dropId,
          })
          spawnMoths(dropId)
          startDrawLoop()
        }
      }
      mouseDownPosRef.current = null
      hasMovedRef.current = false
    }

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 0) return
      const touch = e.touches[0]!
      mouseDownPosRef.current = { x: touch.clientX, y: touch.clientY }
      hasMovedRef.current = false
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return
      const touch = e.touches[0]!
      const rect = container.getBoundingClientRect()

      if (
        touch.clientX < rect.left ||
        touch.clientX > rect.right ||
        touch.clientY < rect.top ||
        touch.clientY > rect.bottom
      ) {
        return
      }

      const x = touch.clientX - rect.left
      const y = touch.clientY - rect.top

      // Track movement for tap vs drag detection
      if (mouseDownPosRef.current) {
        const dx = touch.clientX - mouseDownPosRef.current.x
        const dy = touch.clientY - mouseDownPosRef.current.y
        if (Math.sqrt(dx * dx + dy * dy) > CLICK_TOLERANCE) {
          hasMovedRef.current = true
        }
      }

      const trail = trailBufferRef.current
      trail.push({ x, y, age: 0 })

      if (trail.length > MAX_POINTS) {
        trail.shift()
      }

      startDrawLoop()
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (mouseDownPosRef.current && !hasMovedRef.current && e.changedTouches.length > 0) {
        const rect = container.getBoundingClientRect()
        const touch = e.changedTouches[0]!
        if (
          touch.clientX >= rect.left &&
          touch.clientX <= rect.right &&
          touch.clientY >= rect.top &&
          touch.clientY <= rect.bottom
        ) {
          const x = touch.clientX - rect.left
          const y = touch.clientY - rect.top
          const now = performance.now()
          const dropId = nextDropIdRef.current++
          dropsRef.current.push({
            x,
            y,
            spawnTime: now,
            pulseStart: now,
            id: dropId,
          })
          spawnMoths(dropId)
          startDrawLoop()
        }
      }
      mouseDownPosRef.current = null
      hasMovedRef.current = false
    }

    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: true })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
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
