import { useRef, useEffect, useState } from 'react'
import { layoutText } from '../spread-layout'
import { STATS } from '../../content/stat-data'
import { NUMBERS_TITLE, NUMBERS_CREDIT, NUMBERS_PULL_QUOTE, PAGES } from '../../content/entomology-text'
import { IMG_HOUSEFLY_FOOT } from '../../content/image-urls'
import { StatCard } from '../StatCard'

const TITLE_FONT = '700 2.2rem "Playfair Display", Georgia, serif'
const TITLE_LINE_HEIGHT = 38

const INTRO_TEXT =
  'The numbers are so large that the human mind, evolved to track groups of perhaps a hundred and fifty individuals, simply cannot hold them. Over one million insect species have been discovered. The actual estimate is ten million — nine million of them unnamed, living and dying in forests we have not catalogued, on islands we have not surveyed, in soil we have not sifted.'

const CLOSING_TEXT =
  'Insects inhabit nearly every terrestrial environment on Earth. They have existed for more than three hundred and fifty million years, predating both dinosaurs and flowering plants by vast margins. They have survived five mass extinctions. They will, almost certainly, outlast us.'

function NumbersPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [layout, setLayout] = useState<{
    titleLines: Array<{ x: number; y: number; width: number; text: string }>
    creditPos: { x: number; y: number } | null
  } | null>(null)

  const computeLayout = () => {
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
  }

  // Initial layout + resize handling (same pattern as PageSpread)
  const computeLayoutRef = useRef(computeLayout)
  useEffect(() => { computeLayoutRef.current = computeLayout }, [computeLayout])

  useEffect(() => {
    const onResize = () => computeLayoutRef.current()
    window.addEventListener('resize', onResize)
    document.fonts.ready.then(() => computeLayoutRef.current())
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Compute layout when page mounts
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

      {/* Intro paragraph */}
      <p className="numbers-page__body">{INTRO_TEXT}</p>

      {/* Figure */}
      <figure className="page-figure page-figure--full">
        <img
          src={IMG_HOUSEFLY_FOOT}
          alt="Housefly foot macro, SEM photograph"
          className="page-figure__img"
        />
        <figcaption className="page-figure__caption">
          Tarsal chemoreceptors — ten million times more sensitive to sugar than the human tongue
        </figcaption>
      </figure>

      {/* Pull quote */}
      <blockquote className="numbers-page__pull-quote">{NUMBERS_PULL_QUOTE}</blockquote>

      {/* Stat grid */}
      <div className="numbers-page__grid">
        {STATS.map((stat, i) => (
          <StatCard key={i} stat={stat} />
        ))}
      </div>

      {/* Closing passage */}
      <p className="numbers-page__body numbers-page__closing">{CLOSING_TEXT}</p>

      {/* Page number */}
      <div className="spread-page-number">{PAGES[5].number}</div>
    </div>
  )
}

export { NumbersPage }
