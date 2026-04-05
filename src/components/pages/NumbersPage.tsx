import { useRef, useEffect, useState, useCallback } from 'react'
import { layoutText } from '../spread-layout'
import { STATS } from '../../content/stat-data'
import { NUMBERS_TITLE, NUMBERS_CREDIT, PAGES } from '../../content/entomology-text'
import { StatCard } from '../StatCard'

const TITLE_FONT = '700 2.2rem "Playfair Display", Georgia, serif'
const TITLE_LINE_HEIGHT = 38

function NumbersPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [layout, setLayout] = useState<{
    titleLines: Array<{ x: number; y: number; width: number; text: string }>
    creditPos: { x: number; y: number } | null
  } | null>(null)

  const computeLayout = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    const containerWidth = container.clientWidth
    if (containerWidth === 0) return

    const isNarrow = containerWidth < 768
    const gutter = isNarrow ? 20 : 64
    const contentWidth = containerWidth - gutter * 2

    const headerY = 32
    const titleResult = layoutText(
      NUMBERS_TITLE,
      TITLE_FONT,
      TITLE_LINE_HEIGHT,
      { x: gutter, y: headerY, width: contentWidth, height: 200 },
      [],
    )

    const creditY = headerY + titleResult.lines.length * TITLE_LINE_HEIGHT + 12

    setLayout({
      titleLines: titleResult.lines,
      creditPos: { x: gutter, y: creditY },
    })
  }, [])

  const computeLayoutRef = useRef(computeLayout)
  useEffect(() => { computeLayoutRef.current = computeLayout }, [computeLayout])

  useEffect(() => {
    const onResize = () => computeLayoutRef.current()
    window.addEventListener('resize', onResize)
    document.fonts.ready.then(() => computeLayoutRef.current())
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    computeLayout()
  }, [computeLayout])

  return (
    <div ref={containerRef} className="page-spread numbers-page">
      {/* Pretext-rendered header */}
      <div className="numbers-page__header">
        {layout && (
          <>
            {layout.titleLines.map((line, i) => (
              <span
                key={`title-${i}`}
                className="spread-line spread-line--title"
                style={{
                  left: `${line.x}px`,
                  top: `${line.y}px`,
                }}
              >
                {line.text}
              </span>
            ))}
            {layout.creditPos && (
              <span
                className="spread-line spread-line--credit"
                style={{
                  left: `${layout.creditPos.x}px`,
                  top: `${layout.creditPos.y}px`,
                }}
              >
                {NUMBERS_CREDIT}
              </span>
            )}
          </>
        )}
      </div>

      {/* Stat grid */}
      <div className="numbers-page__grid">
        {STATS.map((stat, i) => (
          <StatCard key={i} stat={stat} />
        ))}
      </div>

      {/* Page number */}
      <div className="spread-page-number">{PAGES[5].number}</div>
    </div>
  )
}

export { NumbersPage }
