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

    // Use window listeners because the overlay has pointer-events: none
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

      const trail = trailBufferRef.current
      trail.push({ x, y, age: 0 })

      if (trail.length > MAX_POINTS) {
        trail.shift()
      }

      startDrawLoop()
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

      const trail = trailBufferRef.current
      trail.push({ x, y, age: 0 })

      if (trail.length > MAX_POINTS) {
        trail.shift()
      }

      startDrawLoop()
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('touchmove', handleTouchMove, { passive: true })

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('touchmove', handleTouchMove)
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
