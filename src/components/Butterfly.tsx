import { useRef, useEffect, useState, useCallback } from 'react'
import type { BandObstacle } from './spread-layout'

const BUTTERFLY_SIZE = 48
const FLIGHT_DURATION = 13000 // ms — slow, leisurely crossing
const BODY_LINE_HEIGHT = 32

type ButterflyPhase = 'at-start' | 'flying-forward' | 'flying-backward' | 'at-end'
type Point = { x: number; y: number }

// ── Seeded PRNG (mulberry32) ───────────────────────────────────────────────
function makePrng(seed: number) {
  let s = seed | 0
  return () => {
    s = (s + 0x6D2B79F5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ── Catmull-Rom spline ─────────────────────────────────────────────────────
function cr1d(p0: number, p1: number, p2: number, p3: number, t: number): number {
  return 0.5 * (
    2 * p1 +
    (-p0 + p2) * t +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t +
    (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t
  )
}

function splineAt(pts: Point[], t: number): Point {
  const n   = pts.length - 1
  const seg = Math.min(Math.floor(t * n), n - 1)
  const lt  = t * n - seg
  const p0  = pts[Math.max(0, seg - 1)]!
  const p1  = pts[seg]!
  const p2  = pts[Math.min(n, seg + 1)]!
  const p3  = pts[Math.min(n, seg + 2)]!
  return { x: cr1d(p0.x, p1.x, p2.x, p3.x, lt), y: cr1d(p0.y, p1.y, p2.y, p3.y, lt) }
}

// ── Gentle flutter easing — minimal speed variation for a smooth glide ─────
function flutterT(t: number, seed: number): number {
  const s   = seed % 997
  const env = Math.sin(t * Math.PI)  // zero at endpoints, peak in middle
  const f   = env * (
    Math.sin(t * 9.1  + s * 0.02) * 0.018 +
    Math.sin(t * 14.7 + s * 0.05) * 0.012
  )
  return Math.max(0, Math.min(1, t + f))
}

// ── Generate graceful waypoints — fewer, moderate amplitude ───────────────
function generateWaypoints(seed: number, start: Point, end: Point): Point[] {
  const rng = makePrng(seed)
  const N   = 5  // fewer waypoints = wider, lazier curves

  const dx  = end.x - start.x
  const dy  = end.y - start.y
  const len = Math.sqrt(dx * dx + dy * dy) || 1

  const ax = dx / len,  ay = dy / len
  const px = -ay,       py = ax

  // Moderate amplitude — 10–22% of total path length
  const baseAmp  = len * 0.10
  const extraAmp = len * 0.12

  const pts: Point[] = [start]

  for (let i = 1; i <= N; i++) {
    const frac = i / (N + 1)
    const bx   = start.x + dx * frac
    const by   = start.y + dy * frac

    const side    = rng() > 0.45 ? 1 : -1
    const swingMag = (baseAmp + rng() * extraAmp) * side
    const stutter  = (rng() - 0.5) * len * 0.04  // very gentle along-axis drift

    pts.push({
      x: bx + px * swingMag + ax * stutter,
      y: by + py * swingMag + ay * stutter,
    })
  }

  pts.push(end)
  return pts
}

// ──────────────────────────────────────────────────────────────────────────
interface ButterflyProps {
  containerRef: React.RefObject<HTMLDivElement | null>
  anchorPositions: { firstWord: Point; lastWord: Point } | null
  onObstacleChange?: (obs: BandObstacle | null) => void
}

export function Butterfly({ anchorPositions, onObstacleChange }: ButterflyProps) {
  const [position, setPosition]   = useState<Point | null>(null)
  const [phase, setPhase]         = useState<ButterflyPhase>('at-start')
  const animRef                   = useRef<number>(0)
  const startTimeRef              = useRef(0)
  const pathSeed                  = useRef(Math.floor(Math.random() * 100000))
  const waypointsRef              = useRef<Point[]>([])
  const lastObstacleFrame         = useRef(0)

  const anchorRef           = useRef(anchorPositions)
  const onObstacleChangeRef = useRef(onObstacleChange)
  useEffect(() => { anchorRef.current           = anchorPositions  }, [anchorPositions])
  useEffect(() => { onObstacleChangeRef.current = onObstacleChange }, [onObstacleChange])

  /* ── Anchors ── */
  const getStartPos = useCallback((): Point => {
    const a = anchorRef.current
    if (!a) return { x: 16, y: 160 }
    // Right edge of butterfly flush with left edge of "To" — sits just before the first word
    return {
      x: a.firstWord.x - BUTTERFLY_SIZE,
      y: a.firstWord.y + BODY_LINE_HEIGHT / 2 - BUTTERFLY_SIZE / 2,
    }
  }, [])

  const getEndPos = useCallback((): Point => {
    const a = anchorRef.current
    if (!a) return { x: 500, y: 900 }
    // Left edge of butterfly flush with right edge of "alive." — sits just after the last word
    return {
      x: a.lastWord.x,
      y: a.lastWord.y + BODY_LINE_HEIGHT / 2 - BUTTERFLY_SIZE / 2,
    }
  }, [])

  /* ── Obstacle builder ── */
  const makeObstacle = useCallback((pos: Point, hPad: number): BandObstacle => ({
    rect: { x: pos.x, y: pos.y, width: BUTTERFLY_SIZE, height: BUTTERFLY_SIZE },
    horizontalPadding: hPad,
    verticalPadding: 4,
  }), [])

  /* ── Flight path via spline ── */
  const flightPath = useCallback(
    (progress: number, direction: 'forward' | 'reverse'): Point => {
      const pts = waypointsRef.current
      if (pts.length < 2) return getStartPos()
      const t   = direction === 'forward' ? progress : 1 - progress
      const ft  = flutterT(t, pathSeed.current)
      const raw = splineAt(pts, ft)
      return {
        x: Math.round(raw.x - BUTTERFLY_SIZE / 2),
        y: Math.round(raw.y - BUTTERFLY_SIZE / 2),
      }
    },
    [getStartPos],
  )

  /* ── Animation loop ── */
  const animate = useCallback(
    (timestamp: number) => {
      if (phase !== 'flying-forward' && phase !== 'flying-backward') return

      const elapsed   = timestamp - startTimeRef.current
      const progress  = Math.min(1, elapsed / FLIGHT_DURATION)
      const direction = phase === 'flying-forward' ? 'forward' : 'reverse'
      const pos       = flightPath(progress, direction)

      setPosition(pos)

      if (timestamp - lastObstacleFrame.current > 33) {
        lastObstacleFrame.current = timestamp
        const raw        = elapsed / FLIGHT_DURATION
        const edgeFactor = Math.max(0, Math.min(raw * 10, 1) * Math.min((1 - raw) * 10, 1))
        onObstacleChangeRef.current?.(makeObstacle(pos, Math.round(16 * edgeFactor)))
      }

      if (progress >= 1) {
        if (phase === 'flying-forward') {
          setPhase('at-end');   setPosition(getEndPos())
        } else {
          setPhase('at-start'); setPosition(getStartPos())
        }
        return
      }

      animRef.current = requestAnimationFrame(animate)
    },
    [phase, flightPath, makeObstacle, getStartPos, getEndPos],
  )

  useEffect(() => {
    if (phase === 'flying-forward' || phase === 'flying-backward') {
      animRef.current = requestAnimationFrame(animate)
    }
    return () => cancelAnimationFrame(animRef.current)
  }, [phase, animate])

  /* ── Settled obstacle ── */
  useEffect(() => {
    if (phase !== 'at-start' && phase !== 'at-end') return
    const p = phase === 'at-start' ? getStartPos() : getEndPos()
    onObstacleChangeRef.current?.(makeObstacle(p, 16))
  }, [phase, anchorPositions, getStartPos, getEndPos, makeObstacle])

  useEffect(() => () => { onObstacleChangeRef.current?.(null) }, [])

  /* ── Snap on anchor arrival / resize ── */
  useEffect(() => {
    if (anchorPositions === null) return
    setPosition(prev => {
      if (prev === null)        return getStartPos()
      if (phase === 'at-start') return getStartPos()
      if (phase === 'at-end')   return getEndPos()
      return prev
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchorPositions, getStartPos, getEndPos])

  useEffect(() => {
    const t = setTimeout(() => setPosition(p => p ?? getStartPos()), 500)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ── Click ── */
  const handleClick = useCallback(() => {
    if (phase === 'flying-forward' || phase === 'flying-backward') return

    pathSeed.current     = Math.floor(Math.random() * 100000)
    const start          = getStartPos()
    const end            = getEndPos()
    waypointsRef.current = generateWaypoints(pathSeed.current, start, end)

    if (phase === 'at-start') {
      setPosition(start)
      setPhase('flying-forward')
      startTimeRef.current = performance.now()
    } else {
      setPosition(end)
      setPhase('flying-backward')
      startTimeRef.current = performance.now()
    }
  }, [phase, getStartPos, getEndPos])

  if (position === null) return null

  const isFlying = phase === 'flying-forward' || phase === 'flying-backward'

  // Wing path data
  const wingsOpen = {
    lf: 'M24 24 C20 14 10 8 8 16 C6 24 14 28 24 24Z',
    rf: 'M24 24 C28 14 38 8 40 16 C42 24 34 28 24 24Z',
    lh: 'M24 24 C18 28 8 32 10 38 C12 44 20 34 24 28Z',
    rh: 'M24 24 C30 28 40 32 38 38 C36 44 28 34 24 28Z',
  }
  const wingsMid = {
    lf: 'M24 24 C22 18 14 14 12 18 C10 22 16 25 24 24Z',
    rf: 'M24 24 C26 18 34 14 36 18 C38 22 32 25 24 24Z',
    lh: 'M24 24 C20 30 14 32 15 36 C16 40 20 32 24 28Z',
    rh: 'M24 24 C28 30 34 32 33 36 C32 40 28 32 24 28Z',
  }

  return (
    <svg
      viewBox="0 0 48 48"
      width={BUTTERFLY_SIZE}
      height={BUTTERFLY_SIZE}
      aria-label={isFlying ? 'Butterfly in flight' : 'Click the butterfly'}
      role="img"
      title={
        phase === 'at-start' ? 'Click to fly to the last word' :
        phase === 'at-end'   ? 'Click to return to the first word' :
        undefined
      }
      className={`butterfly-anim ${phase}`}
      style={{
        position: 'absolute',
        left:    `${position.x}px`,
        top:     `${position.y}px`,
        overflow: 'visible',
        cursor:  isFlying ? 'default' : 'pointer',
        transition: isFlying ? 'none' : 'left 0.5s ease, top 0.5s ease',
      }}
      onClick={handleClick}
    >
      <g opacity="0.85">
        {/* Left forewing */}
        <path d={wingsOpen.lf} fill="#c4963a" opacity="0.8">
          {isFlying && (
            <animate attributeName="d" dur="0.5s" repeatCount="indefinite"
              calcMode="spline" keyTimes="0;0.5;1" keySplines="0.4 0 0.6 1;0.4 0 0.6 1"
              values={`${wingsOpen.lf};${wingsMid.lf};${wingsOpen.lf}`} />
          )}
        </path>
        {/* Right forewing */}
        <path d={wingsOpen.rf} fill="#c4963a" opacity="0.8">
          {isFlying && (
            <animate attributeName="d" dur="0.5s" repeatCount="indefinite"
              calcMode="spline" keyTimes="0;0.5;1" keySplines="0.4 0 0.6 1;0.4 0 0.6 1"
              values={`${wingsOpen.rf};${wingsMid.rf};${wingsOpen.rf}`} />
          )}
        </path>
        {/* Left hindwing */}
        <path d={wingsOpen.lh} fill="#4a8c7e" opacity="0.7">
          {isFlying && (
            <animate attributeName="d" dur="0.5s" repeatCount="indefinite"
              calcMode="spline" keyTimes="0;0.5;1" keySplines="0.4 0 0.6 1;0.4 0 0.6 1"
              values={`${wingsOpen.lh};${wingsMid.lh};${wingsOpen.lh}`} />
          )}
        </path>
        {/* Right hindwing */}
        <path d={wingsOpen.rh} fill="#4a8c7e" opacity="0.7">
          {isFlying && (
            <animate attributeName="d" dur="0.5s" repeatCount="indefinite"
              calcMode="spline" keyTimes="0;0.5;1" keySplines="0.4 0 0.6 1;0.4 0 0.6 1"
              values={`${wingsOpen.rh};${wingsMid.rh};${wingsOpen.rh}`} />
          )}
        </path>
        {/* Body */}
        <ellipse cx="24" cy="24" rx="2" ry="8" fill="#2c2418" />
        {/* Antennae */}
        <path d="M24 16 C22 12 18 10 16 8" stroke="#2c2418" strokeWidth="0.8" fill="none" strokeLinecap="round" />
        <path d="M24 16 C26 12 30 10 32 8" stroke="#2c2418" strokeWidth="0.8" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  )
}
