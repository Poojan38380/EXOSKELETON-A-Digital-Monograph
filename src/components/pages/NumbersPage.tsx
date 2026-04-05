import { useRef, useEffect, useState, useCallback, type ReactNode } from 'react'
import { layoutText, type PositionedLine } from '../spread-layout'
import { STATS, type StatData } from '../../content/stat-data'
import { NUMBERS_TITLE, NUMBERS_CREDIT, NUMBERS_PULL_QUOTE, PAGES } from '../../content/entomology-text'
import { IMG_HOUSEFLY_FOOT, IMG_ANT_LIFTING, IMG_JUMPING_BEAN } from '../../content/image-urls'
import { StatCard } from '../StatCard'

const TITLE_FONT = '700 2.2rem "Playfair Display", Georgia, serif'
const TITLE_LINE_HEIGHT = 38
const BODY_FONT = '20px "EB Garamond", "Palatino Linotype", "Book Antiqua", Palatino, serif'
const BODY_LINE_HEIGHT = 32
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

interface MasonryItem {
  x: number
  y: number
  width: number
  height: number
  stat: StatData
}

interface TextBlock {
  x: number
  y: number
  width: number
  lines: PositionedLine[]
}

function NumbersPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [layout, setLayout] = useState<{
    titleLines: Array<{ x: number; y: number; width: number; text: string }>
    creditPos: { x: number; y: number } | null
    pullQuoteBlock: { x: number; y: number; width: number; height: number } | null
    textBlocks: TextBlock[]
    masonryItems: MasonryItem[]
    figureRect: { x: number; y: number; width: number; height: number } | null
    contentHeight: number
  } | null>(null)

  const computeLayout = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    const containerWidth = container.clientWidth
    if (containerWidth === 0) return

    const isNarrow = containerWidth < 768
    const gutter = isNarrow ? 16 : 32
    const contentWidth = containerWidth - gutter * 2

    // Header region
    const headerY = 32
    const titleResult = layoutText(
      NUMBERS_TITLE,
      TITLE_FONT,
      TITLE_LINE_HEIGHT,
      { x: gutter, y: headerY, width: contentWidth, height: 200 },
      [],
    )

    const creditY = headerY + titleResult.lines.length * TITLE_LINE_HEIGHT + 12
    const creditPos: { x: number; y: number } | null = { x: gutter, y: creditY }

    // Rule + gap after header
    const ruleY = creditY + 16
    const copyTop = ruleY + 32

    // Build obstacles and position content
    const obstacles: Array<{ rect: { x: number; y: number; width: number; height: number }; hPad: number; vPad: number }> = []
    const masonryItems: MasonryItem[] = []
    const textBlocks: TextBlock[] = []
    
    let currentY = copyTop

    // Split stats into 3 columns for masonry
    const columnCount = isNarrow ? 2 : 3
    const columnWidth = Math.floor((contentWidth - (columnCount - 1) * 16) / columnCount)
    const columnGap = 16
    const columnHeights = new Array(columnCount).fill(0)

    // Place intro text first
    const introResult = layoutText(
      INTRO_TEXT,
      BODY_FONT,
      BODY_LINE_HEIGHT,
      { x: gutter, y: currentY, width: contentWidth, height: 1000 },
      [],
    )
    const introHeight = introResult.lines.length * BODY_LINE_HEIGHT + 24
    textBlocks.push({
      x: gutter,
      y: currentY,
      width: contentWidth,
      lines: introResult.lines,
    })
    currentY += introHeight

    // Figure (full width)
    const figureHeight = isNarrow ? 270 : 350
    const figureRect = { x: gutter, y: currentY, width: contentWidth, height: figureHeight }
    obstacles.push({ rect: figureRect, hPad: 22, vPad: 19 })
    currentY += figureHeight + 24

    // Pull quote
    const pqWidth = isNarrow ? contentWidth : Math.round(contentWidth * 0.4)
    const pqResult = layoutText(
      NUMBERS_PULL_QUOTE,
      PULL_QUOTE_FONT,
      PULL_QUOTE_LINE_HEIGHT,
      { x: 0, y: 0, width: pqWidth, height: 1000 },
      [],
    )
    const pqTextHeight = pqResult.lines.length * PULL_QUOTE_LINE_HEIGHT
    const pqHeight = pqTextHeight + 108
    const pqX = isNarrow ? gutter : gutter + contentWidth - pqWidth
    const pullQuoteBlock = { x: pqX, y: currentY, width: pqWidth, height: pqHeight }
    obstacles.push({ rect: pullQuoteBlock, hPad: 26, vPad: 19 })

    // Mid text 1 (beside pull quote if not narrow)
    const mid1Width = isNarrow ? contentWidth : contentWidth - pqWidth - 24
    const mid1X = isNarrow ? gutter : gutter
    const mid1Y = currentY
    const mid1Result = layoutText(
      MID_TEXT_1,
      BODY_FONT,
      BODY_LINE_HEIGHT,
      { x: mid1X, y: mid1Y, width: mid1Width, height: 1000 },
      obstacles,
    )
    const mid1Height = mid1Result.lines.length * BODY_LINE_HEIGHT + 24
    textBlocks.push({
      x: mid1X,
      y: mid1Y,
      width: mid1Width,
      lines: mid1Result.lines,
    })

    // Update currentY to below pull quote and mid text
    const pqBottom = currentY + pqHeight
    const mid1Bottom = mid1Y + mid1Height
    currentY = Math.max(pqBottom, mid1Bottom) + 24

    // Masonry grid for stat cards
    const cardMinHeight = 120
    const cardMaxHeight = 180
    const statsPerColumn = Math.ceil(STATS.length / columnCount)

    STATS.forEach((stat, index) => {
      const columnIndex = Math.floor(index / statsPerColumn)
      const rowInColumn = index % statsPerColumn
      
      // Vary card height based on content
      const cardHeight = cardMinHeight + (index % 3) * 30
      
      const x = gutter + columnIndex * (columnWidth + columnGap)
      const y = currentY + rowInColumn * (cardMaxHeight + columnGap)
      
      masonryItems.push({
        x,
        y,
        width: columnWidth,
        height: cardHeight,
        stat,
      })

      // Track column height
      const itemBottom = y + cardHeight
      if (itemBottom > columnHeights[columnIndex]) {
        columnHeights[columnIndex] = itemBottom
      }
    })

    const maxColumnHeight = Math.max(...columnHeights)
    currentY = currentY + maxColumnHeight + 32

    // Mid text 2
    const mid2Result = layoutText(
      MID_TEXT_2,
      BODY_FONT,
      BODY_LINE_HEIGHT,
      { x: gutter, y: currentY, width: contentWidth, height: 1000 },
      [],
    )
    const mid2Height = mid2Result.lines.length * BODY_LINE_HEIGHT + 24
    textBlocks.push({
      x: gutter,
      y: currentY,
      width: contentWidth,
      lines: mid2Result.lines,
    })
    currentY += mid2Height + 24

    // Closing text
    const closingResult = layoutText(
      CLOSING_TEXT,
      BODY_FONT,
      BODY_LINE_HEIGHT,
      { x: gutter, y: currentY, width: contentWidth, height: 1000 },
      [],
    )
    const closingHeight = closingResult.lines.length * BODY_LINE_HEIGHT + 48
    textBlocks.push({
      x: gutter,
      y: currentY,
      width: contentWidth,
      lines: closingResult.lines,
    })
    currentY += closingHeight + 60

    setLayout({
      titleLines: titleResult.lines,
      creditPos: creditPos!,
      pullQuoteBlock,
      textBlocks,
      masonryItems,
      figureRect,
      contentHeight: currentY,
    })
  }, [])

  // Initial layout + resize handling
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
    <div ref={containerRef} className="page-spread numbers-page" style={{ minHeight: layout?.contentHeight ? `${layout.contentHeight}px` : '100vh' }}>
      {/* Pretext-rendered header */}
      {layout && (
        <>
          <div className="numbers-page__header">
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
          </div>

          {/* Pretext-rendered text blocks */}
          {layout.textBlocks.map((block, blockIndex) => (
            <div key={`text-block-${blockIndex}`}>
              {block.lines.map((line, i) => (
                <span
                  key={`block-${blockIndex}-line-${i}`}
                  className="spread-line spread-line--body"
                  style={{
                    left: `${line.x}px`,
                    top: `${line.y}px`,
                    font: BODY_FONT,
                    lineHeight: `${BODY_LINE_HEIGHT}px`,
                  }}
                >
                  {line.text}
                </span>
              ))}
            </div>
          ))}

          {/* Pull quote */}
          <blockquote
            className="numbers-page__pull-quote"
            style={{
              position: 'absolute',
              left: `${layout.pullQuoteBlock.x}px`,
              top: `${layout.pullQuoteBlock.y}px`,
              width: `${layout.pullQuoteBlock.width}px`,
            }}
          >
            {NUMBERS_PULL_QUOTE}
          </blockquote>

          {/* Figure */}
          <figure
            className="page-figure page-figure--full"
            style={{
              position: 'absolute',
              left: `${layout.figureRect.x}px`,
              top: `${layout.figureRect.y}px`,
              width: `${layout.figureRect.width}px`,
              margin: 0,
            }}
          >
            <img
              src={IMG_HOUSEFLY_FOOT}
              alt="Housefly foot macro, SEM photograph"
              className="page-figure__img"
              style={{ width: '100%', height: 280, objectFit: 'cover' }}
            />
            <figcaption className="page-figure__caption">
              Tarsal chemoreceptors — ten million times more sensitive to sugar than the human tongue
            </figcaption>
          </figure>

          {/* Masonry grid */}
          {layout.masonryItems.map((item, i) => (
            <div
              key={`masonry-${i}`}
              className="numbers-page__masonry-card"
              style={{
                position: 'absolute',
                left: `${item.x}px`,
                top: `${item.y}px`,
                width: `${item.width}px`,
                height: `${item.height}px`,
              }}
            >
              <StatCard stat={item.stat} />
            </div>
          ))}
        </>
      )}

      {/* Page number */}
      <div className="spread-page-number">{PAGES[5].number}</div>
    </div>
  )
}

export { NumbersPage }
