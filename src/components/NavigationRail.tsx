import { useState, useRef, useEffect, useCallback } from 'react'
import { PAGES } from '../content/entomology-text'
import type { ReactNode } from 'react'

/* ── Mini generative art thumbnails for nav rail ── */

function NavThumbnail({ pageIndex }: { pageIndex: number }): ReactNode {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height
    ctx.clearRect(0, 0, w, h)

    // Seed from page index for deterministic variation
    const seed = (pageIndex + 1) * 7919
    let s = seed
    const rand = () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646 }

    const colors = [
      ['#c4963a', '#4a8c7e', '#9b2335'],
      ['#4a8c7e', '#c4963a', '#2c2418'],
      ['#9b2335', '#4a8c7e', '#c4963a'],
      ['#c4963a', '#2c2418', '#4a8c7e'],
      ['#2c2418', '#c4963a', '#9b2335'],
    ]
    const palette = colors[pageIndex % colors.length]!

    // Parchment background
    ctx.fillStyle = '#ebe5d4'
    ctx.fillRect(0, 0, w, h)

    // Generative patterns per page
    if (pageIndex === 0) {
      // Cover: concentric circles (elytra mandala)
      const cx = w / 2, cy = h / 2
      for (let i = 8; i > 0; i--) {
        ctx.beginPath()
        ctx.arc(cx, cy, i * 5 + rand() * 3, 0, Math.PI * 2)
        ctx.strokeStyle = palette[i % palette.length]!
        ctx.globalAlpha = 0.5 + rand() * 0.5
        ctx.lineWidth = 1 + rand() * 2
        ctx.stroke()
      }
    } else if (pageIndex === 1) {
      // Wings: flowing lines
      ctx.globalAlpha = 0.6
      for (let i = 0; i < 12; i++) {
        ctx.beginPath()
        const y = (h / 12) * i + rand() * 5
        ctx.moveTo(0, y)
        for (let x = 0; x < w; x += 4) {
          ctx.lineTo(x, y + Math.sin(x * 0.05 + rand() * 6) * (8 + rand() * 6))
        }
        ctx.strokeStyle = palette[i % palette.length]!
        ctx.lineWidth = 0.5 + rand() * 1.5
        ctx.stroke()
      }
    } else if (pageIndex === 2) {
      // Compound eye: hex grid
      const size = 8 + rand() * 4
      const rowH = size * Math.sqrt(3)
      ctx.globalAlpha = 0.5
      for (let row = 0; row < h / rowH + 1; row++) {
        for (let col = 0; col < w / (size * 1.5) + 1; col++) {
          const cx = col * size * 1.5
          const cy = row * rowH + (row % 2 ? size * 0.75 : 0)
          ctx.beginPath()
          for (let v = 0; v < 6; v++) {
            const angle = (Math.PI / 3) * v - Math.PI / 6
            const hx = cx + size * 0.5 * Math.cos(angle)
            const hy = cy + size * 0.5 * Math.sin(angle)
            v === 0 ? ctx.moveTo(hx, hy) : ctx.lineTo(hx, hy)
          }
          ctx.closePath()
          ctx.strokeStyle = palette[(row + col) % palette.length]!
          ctx.lineWidth = 0.8
          if (rand() > 0.5) {
            ctx.fillStyle = palette[(row + col) % palette.length]!
            ctx.globalAlpha = 0.15 + rand() * 0.2
            ctx.fill()
          }
          ctx.globalAlpha = 0.5
          ctx.stroke()
        }
      }
    } else if (pageIndex === 3) {
      // Metamorphosis: spiral
      ctx.globalAlpha = 0.6
      const cx = w / 2, cy = h / 2
      for (let arm = 0; arm < 3; arm++) {
        ctx.beginPath()
        for (let t = 0; t < 200; t++) {
          const angle = t * 0.1 + (arm * Math.PI * 2) / 3
          const r = t * 0.15
          const x = cx + Math.cos(angle) * r
          const y = cy + Math.sin(angle) * r
          t === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        }
        ctx.strokeStyle = palette[arm % palette.length]!
        ctx.lineWidth = 1.2
        ctx.stroke()
      }
    } else {
      // Antennae: branching L-system
      ctx.globalAlpha = 0.6
      function branch(x: number, y: number, angle: number, len: number, depth: number, c: CanvasRenderingContext2D) {
        if (depth <= 0 || len < 3) return
        const ex = x + Math.cos(angle) * len
        const ey = y + Math.sin(angle) * len
        c.beginPath()
        c.moveTo(x, y)
        c.lineTo(ex, ey)
        c.strokeStyle = palette[depth % palette.length]!
        c.lineWidth = depth * 0.5
        c.stroke()
        const spread = 0.4 + rand() * 0.3
        branch(ex, ey, angle - spread, len * 0.7, depth - 1, c)
        branch(ex, ey, angle + spread, len * 0.7, depth - 1, c)
      }
      branch(w / 2, h, -Math.PI / 2, 25 + rand() * 10, 6, ctx)
    }

    ctx.globalAlpha = 1
  }, [pageIndex])

  return <canvas ref={canvasRef} width={64} height={48} className="nav-rail__thumb" />
}

/* ── NavigationRail: collapsible spine nav with page thumbnails ── */

interface NavRailProps {
  currentPage: number
  onPageSelect: (page: number) => void
}

export function NavigationRail({ currentPage, onPageSelect }: NavRailProps) {
  const [expanded, setExpanded] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleMouseEnter = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setExpanded(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => setExpanded(false), 200)
  }, [])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return (
    <nav
      className={`nav-rail ${expanded ? 'nav-rail--expanded' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="nav-rail__spine" />
      <div className="nav-rail__pages">
        {PAGES.map((page, i) => (
          <button
            key={page.id}
            className={`nav-rail__item ${i === currentPage ? 'nav-rail__item--active' : ''}`}
            onClick={() => onPageSelect(i)}
            aria-label={`Go to page ${page.number}: ${page.label}`}
          >
            <span className="nav-rail__number">
              {i === currentPage ? '●' : page.number}
            </span>
            <span className="nav-rail__thumb-wrap">
              <NavThumbnail pageIndex={i} />
            </span>
            <span className="nav-rail__label">{page.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
