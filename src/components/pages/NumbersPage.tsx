import { useRef, useEffect, useState } from 'react'
import { layoutText } from '../spread-layout'
import { STATS } from '../../content/stat-data'
import { NUMBERS_TITLE, NUMBERS_CREDIT, NUMBERS_PULL_QUOTE, PAGES } from '../../content/entomology-text'
import { IMG_HOUSEFLY_FOOT } from '../../content/image-urls'
import { StatCard } from '../StatCard'

const TITLE_FONT = '700 2.2rem "Playfair Display", Georgia, serif'
const TITLE_LINE_HEIGHT = 38
const PULL_QUOTE_FONT = 'italic 1.35rem "Cormorant Garamond", Georgia, serif'
const PULL_QUOTE_LINE_HEIGHT = 28

const INTRO_TEXT =
  'The numbers are so large that the human mind, evolved to track groups of perhaps a hundred and fifty individuals, simply cannot hold them. Over one million insect species have been discovered and formally described. The actual estimate is ten million — nine million of them unnamed, living and dying in forests we have not catalogued, on islands we have not surveyed, in soil we have not sifted.'

const MID_TEXT_1 =
  'Insects comprise roughly ninety percent of all animal species on the planet. More than half of every living organism — by species count, not weight — is an insect. The four largest orders tell the story. Coleoptera, the beetles, account for four hundred thousand described species alone. J. B. S. Haldane, when asked what his study of nature had revealed about the Creator, reportedly answered: "An inordinate fondness for beetles."'

const MID_TEXT_2 =
  'The extremes of insect biology stretch from the almost vanishingly small to the impossibly enduring. A midge wing beats at over sixty-two thousand times per minute. A monarch navigates three thousand miles from Canada to central Mexico. A termite queen can lay forty thousand eggs per day — one every two seconds — for half a century.'

const CLOSING_TEXT =
  'Insects inhabit nearly every terrestrial environment on Earth. They have existed for more than three hundred and fifty million years, predating both dinosaurs and flowering plants by vast margins. They have survived five mass extinctions. They will, almost certainly, outlast us.'

function NumbersPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [layout, setLayout] = useState<{
    titleLines: Array<{ x: number; y: number; width: number; text: string }>
    creditPos: { x: number; y: number } | null
    pullQuoteHeight: number
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

    // Compute pull quote dimensions (same approach as PageSpread)
    const pqWidth = isNarrow ? contentWidth : Math.round(contentWidth * 0.4)
    const pqResult = layoutText(
      NUMBERS_PULL_QUOTE,
      PULL_QUOTE_FONT,
      PULL_QUOTE_LINE_HEIGHT,
      { x: 0, y: 0, width: pqWidth, height: 1000 },
      [],
    )
    const pqTextHeight = pqResult.lines.length * PULL_QUOTE_LINE_HEIGHT
    // CSS overhead: padding 1.25rem*2 = 40px, border-left = 3px
    const cssOverhead = 43
    const pqTotalHeight = pqTextHeight + cssOverhead

    setLayout({
      titleLines: titleResult.lines,
      creditPos: { x: gutter, y: creditY },
      pullQuoteHeight: pqTotalHeight,
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

      {/* Pull quote — height reserved to prevent overlap with surrounding content */}
      {layout && (
        <blockquote
          className="numbers-page__pull-quote"
          style={{ minHeight: `${layout.pullQuoteHeight}px` }}
        >
          {NUMBERS_PULL_QUOTE}
        </blockquote>
      )}

      {/* Mid-text 1 */}
      <p className="numbers-page__body">{MID_TEXT_1}</p>

      {/* Stat grid */}
      <div className="numbers-page__grid">
        {STATS.map((stat, i) => (
          <StatCard key={i} stat={stat} />
        ))}
      </div>

      {/* Mid-text 2 */}
      <p className="numbers-page__body">{MID_TEXT_2}</p>

      {/* Closing passage */}
      <p className="numbers-page__body numbers-page__closing">{CLOSING_TEXT}</p>

      {/* Page number */}
      <div className="spread-page-number">{PAGES[5].number}</div>
    </div>
  )
}

export { NumbersPage }
