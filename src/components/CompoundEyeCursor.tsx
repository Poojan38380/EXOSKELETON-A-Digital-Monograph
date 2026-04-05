import { useRef, useEffect, useState } from 'react'
import { useLayoutData } from '../context/LayoutDataContext'
import {
  generateFacetCenters,
  hexagonPath,
  findTextInFacet,
  pointInRect,
  FACET_RADIUS,
  type Facet,
} from '../utils/hex-facet-grid'

const SVG_NS = 'http://www.w3.org/2000/svg'
const BODY_LINE_HEIGHT = 32
const TITLE_LINE_HEIGHT = 38
const BASELINE_OFFSET = 24 // SVG text baseline offset from line top (~75% of 32px)
const MAGNIFICATION = 1.5
const FIGURE_PADDING = 20

/* ── Pre-compute facet offsets (relative to cursor center) ── */
const FACET_OFFSETS: Facet[] = generateFacetCenters(0, 0)
const FACET_COUNT = FACET_OFFSETS.length

/* ── Font strings matching PageSpread ── */
const BODY_FONT = '20px "EB Garamond", "Palatino Linotype", "Book Antiqua", Palatino, serif'
const TITLE_FONT = '700 2.2rem "Playfair Display", Georgia, serif'

/* ── SVG Filter definitions (rendered once as JSX) ── */
function SvgFilters() {
  return (
    <defs>
      {/* Barrel / organic distortion */}
      <filter id="ce-barrel" x="-50%" y="-50%" width="200%" height="200%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.03"
          numOctaves="2"
          seed="0"
          result="noise"
        />
        <feComponentTransfer in="noise" result="scaled">
          <feFuncR type="linear" slope="0.04" />
          <feFuncG type="linear" slope="0.04" />
          <feFuncB type="linear" slope="0.04" />
        </feComponentTransfer>
        <feDisplacementMap
          in="SourceGraphic"
          in2="scaled"
          scale="2"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </defs>
  )
}

/* ── Helper: create SVG text element ── */
function createSvgText(
  x: number,
  y: number,
  text: string,
  fill: string,
  font: string,
  dx?: number,
  filter?: string,
): SVGTextElement {
  const el = document.createElementNS(SVG_NS, 'text')
  el.setAttribute('x', String(x))
  el.setAttribute('y', String(y))
  el.setAttribute('fill', fill)
  el.setAttribute('font', font)
  if (dx !== undefined) el.setAttribute('dx', String(dx))
  if (filter) el.setAttribute('filter', `url(#${filter})`)
  el.textContent = text
  return el
}

export function CompoundEyeCursor() {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const cursorGroupRef = useRef<SVGGElement>(null)
  const facetGroupsRef = useRef<SVGGElement[]>([])
  const mouseRef = useRef({ x: 0, y: 0 })
  const rafRef = useRef<number | null>(null)

  const { layout } = useLayoutData()
  const [visible, setVisible] = useState(false)

  // Fade in on mount
  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(t)
  }, [])

  // Update layout ref on every context change
  const layoutRef = useRef(layout)
  useEffect(() => {
    layoutRef.current = layout
  }, [layout])

  // ── Mouse tracking ──
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      // Check cursor is within container bounds
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      ) {
        return
      }
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // ── rAF render loop ──
  useEffect(() => {
    let lastMouse = { x: -1, y: -1 }

    const loop = () => {
      const mouse = mouseRef.current
      const currentLayout = layoutRef.current

      // Only update if mouse moved or first frame
      if (mouse.x !== lastMouse.x || mouse.y !== lastMouse.y) {
        lastMouse = { x: mouse.x, y: mouse.y }

        const cursorGroup = cursorGroupRef.current
        if (cursorGroup) {
          cursorGroup.setAttribute('transform', `translate(${mouse.x}, ${mouse.y})`)
        }

        // Figure exclusion
        const figRect = currentLayout?.figureRect
        if (
          figRect &&
          pointInRect(mouse.x, mouse.y, figRect, FIGURE_PADDING)
        ) {
          // Hide all facet text groups when over figure
          for (let i = 0; i < FACET_COUNT; i++) {
            const g = facetGroupsRef.current[i]
            if (g) {
              while (g.firstChild) g.removeChild(g.firstChild)
            }
          }
        } else if (currentLayout) {
          // Collect all text lines (body + title)
          const allLines = [
            ...currentLayout.bodyLines.map((l) => ({ ...l, font: BODY_FONT, lh: BODY_LINE_HEIGHT })),
            ...currentLayout.titleLines.map((l) => ({ ...l, font: TITLE_FONT, lh: TITLE_LINE_HEIGHT })),
          ]

          for (let i = 0; i < FACET_COUNT; i++) {
            const facet = FACET_OFFSETS[i]!
            // Absolute facet center for text finding
            const absCx = mouse.x + facet.cx
            const absCy = mouse.y + facet.cy

            const textInFacet = findTextInFacet(allLines, absCx, absCy, FACET_RADIUS, BODY_LINE_HEIGHT)

            const group = facetGroupsRef.current[i]
            if (!group) continue

            // Clear existing text
            while (group.firstChild) group.removeChild(group.firstChild)

            if (textInFacet.length === 0) continue

            // Magnification transform: scale relative to facet center (in group-local coords)
            group.setAttribute(
              'transform',
              `translate(${facet.cx}, ${facet.cy}) scale(${MAGNIFICATION}) translate(${-facet.cx}, ${-facet.cy})`,
            )

            // Render text with chromatic channels
            for (const line of textInFacet) {
              // Positions relative to cursor group (= absolute - mouse)
              const relX = line.x - mouse.x
              const relY = line.y - mouse.y + BASELINE_OFFSET

              // Red/carmine channel — shifted left
              group.appendChild(
                createSvgText(relX - 1.5, relY, line.text, 'rgba(155, 35, 53, 0.5)', BODY_FONT),
              )
              // Main ink channel — with barrel distortion
              group.appendChild(
                createSvgText(relX, relY, line.text, 'rgba(26, 23, 20, 0.95)', BODY_FONT, undefined, 'ce-barrel'),
              )
              // Blue/verdigris channel — shifted right
              group.appendChild(
                createSvgText(relX + 1.5, relY, line.text, 'rgba(74, 140, 126, 0.5)', BODY_FONT),
              )
            }
          }
        }
      }

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className={`compound-eye-cursor${visible ? ' compound-eye-cursor--visible' : ''}`}
    >
      <svg ref={svgRef} className="compound-eye-cursor__svg">
        <SvgFilters />

        {/* Clip paths — one per facet */}
        {FACET_OFFSETS.map((facet, i) => (
          <clipPath key={i} id={`ce-facet-${i}`}>
            <path d={hexagonPath(facet.cx, facet.cy, FACET_RADIUS)} />
          </clipPath>
        ))}

        {/* Cursor group — translated to mouse position by rAF loop */}
        <g ref={cursorGroupRef} className="compound-eye-cursor__group">
          {FACET_OFFSETS.map((facet, i) => (
            <g key={i} clipPath={`url(#ce-facet-${i})`}>
              {/* Subtle warm facet background */}
              <path
                d={hexagonPath(facet.cx, facet.cy, FACET_RADIUS)}
                fill="rgba(245, 240, 225, 0.3)"
              />
              {/* Text group — populated by rAF loop */}
              <g
                ref={(el) => {
                  if (el) facetGroupsRef.current[i] = el
                }}
              />
              {/* Hexagonal border */}
              <path
                d={hexagonPath(facet.cx, facet.cy, FACET_RADIUS)}
                className="ce-facet-border"
              />
            </g>
          ))}
        </g>
      </svg>
    </div>
  )
}
