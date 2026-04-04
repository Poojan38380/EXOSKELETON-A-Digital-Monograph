import { useRef, useEffect, useState, useCallback, type ReactNode } from 'react'
import { layoutText, type PositionedLine, type BandObstacle } from './spread-layout'
import type { Rect } from '../layout-engine/wrap-geometry'

/* ── PageSpread: Pretext-powered magazine layout ── */

export type FigurePlacement = 'right' | 'left' | 'full' | 'wide'

export interface SpreadFigure {
  src: string
  alt: string
  caption: ReactNode
  placement: FigurePlacement
}

export interface SpreadConfig {
  title: string
  credit?: string
  pullQuote?: string
  body: string
  figure?: SpreadFigure
  /** Page number (Roman numeral) */
  pageNumber?: string
  /** Reserved height at the bottom for extra content (e.g. TOC on colophon) */
  bottomReserve?: number
}

export type AnchorPositions = {
  firstWord: { x: number; y: number }
  lastWord: { x: number; y: number }
}

export interface PageSpreadProps {
  config: SpreadConfig
  children?: ReactNode
  /** Called after each layout pass with the pixel positions of the first and last body-text words. */
  onAnchorPositions?: (anchors: AnchorPositions) => void
  /** Live obstacle from the butterfly; added to the layout engine so body text routes around it. */
  butterflyObstacle?: BandObstacle | null
}

const BODY_FONT = '20px "EB Garamond", "Palatino Linotype", "Book Antiqua", Palatino, serif'
const BODY_LINE_HEIGHT = 32
const TITLE_FONT = '700 2.2rem "Playfair Display", Georgia, serif'
const TITLE_LINE_HEIGHT = 38
const CREDIT_LINE_HEIGHT = 16
const PULL_QUOTE_FONT = 'italic 1.35rem "Cormorant Garamond", Georgia, serif'
const PULL_QUOTE_LINE_HEIGHT = 28
const GUTTER_DESKTOP = 64

export function PageSpread({ config, children, onAnchorPositions, butterflyObstacle }: PageSpreadProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  // Stable ref so computeLayout's useCallback dep array stays clean
  const onAnchorPositionsRef = useRef(onAnchorPositions)
  useEffect(() => { onAnchorPositionsRef.current = onAnchorPositions }, [onAnchorPositions])
  const [layout, setLayout] = useState<{
    titleLines: PositionedLine[]
    creditPos: { x: number; y: number } | null
    bodyLines: PositionedLine[]
    pullQuoteBlock: { x: number; y: number; width: number; height: number } | null
    figureRect: Rect | null
    figureImgHeight: number
    contentHeight: number
    extraY: number
  } | null>(null)

  // ── Layout computation ─────────────────────────────────────────────
  const computeLayout = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    const containerWidth = container.clientWidth
    if (containerWidth === 0) return

    const isNarrow = containerWidth < 768
    const gutter = isNarrow ? 20 : GUTTER_DESKTOP
    const contentWidth = containerWidth - gutter * 2

    // Header region
    const headerY = 32
    const titleWidth = contentWidth
    const titleResult = layoutText(
      config.title,
      TITLE_FONT,
      TITLE_LINE_HEIGHT,
      { x: gutter, y: headerY, width: titleWidth, height: 200 },
      [],
    )

    const creditY = headerY + titleResult.lines.length * TITLE_LINE_HEIGHT + 12
    const creditPos: { x: number; y: number } | null = config.credit
      ? { x: gutter, y: creditY }
      : null

    // Rule + gap after header
    const ruleY = creditY + (config.credit ? CREDIT_LINE_HEIGHT : 0) + 16
    const copyTop = ruleY + 32

    // Figure geometry
    let figureRect: Rect | null = null
    let figureImgHeight = 0
    let figW = 0
    if (config.figure) {
      figW = isNarrow ? contentWidth : Math.round(contentWidth * 0.45)
      const figImgH = isNarrow ? 200 : config.figure.placement === 'full' || config.figure.placement === 'wide' ? 280 : 320
      figureImgHeight = figImgH
      // Extra space for caption below the image: padding + borders + up to 3 lines of text
      const figCaptionH = 70
      const figH = figImgH + figCaptionH
      const figX = config.figure.placement === 'right'
        ? gutter + contentWidth - figW
        : config.figure.placement === 'left'
          ? gutter
          : gutter
      const figY = copyTop
      figureRect = { x: figX, y: figY, width: figW, height: figH }
    }

    // Build obstacles
    const figureObstacles: { rect: Rect; horizontalPadding: number; verticalPadding: number }[] = []
    if (figureRect) {
      figureObstacles.push({
        rect: figureRect,
        horizontalPadding: Math.round(BODY_LINE_HEIGHT * 0.7),
        verticalPadding: Math.round(BODY_LINE_HEIGHT * 0.6),
      })
    }

    // Pull quote — rendered as a normal DOM blockquote, but as an obstacle for body text
    let pullQuoteBlock: { x: number; y: number; width: number; height: number } | null = null
    if (config.pullQuote) {
      const pqWidth = isNarrow ? contentWidth : Math.round(contentWidth * 0.4)
      // Placement: pull quote goes on the right side (or left if figure is there).
      // For full/wide figures, pull quote goes below the figure.
      const figIsFullOrWide = config.figure && (config.figure.placement === 'full' || config.figure.placement === 'wide')
      const figIsLeft = config.figure?.placement === 'left'
      const pqX = isNarrow
        ? gutter
        : figIsLeft
          ? gutter + contentWidth - pqWidth
          : gutter + contentWidth - pqWidth
      // Count lines the pull quote text will occupy
      const pqPreparedText = layoutText(
        config.pullQuote,
        PULL_QUOTE_FONT,
        PULL_QUOTE_LINE_HEIGHT,
        { x: 0, y: 0, width: pqWidth, height: 1000 },
        [],
      )
      const textHeight = pqPreparedText.lines.length * PULL_QUOTE_LINE_HEIGHT
      // CSS overhead: padding 1.25rem*2 = 40px, border-left = 3px (margin overridden to 0)
      const cssOverhead = 43
      // Extra safety to prevent body text overlap below the quote
      const safetyMargin = 32
      const pqHeight = textHeight + cssOverhead + safetyMargin
      // If figure is full/wide, place pull quote below it.
      // If figure is right/left, pull quote goes on the opposite side but below figure bottom.
      let pqY: number
      if (figIsFullOrWide) {
        pqY = figureRect!.y + figureRect!.height + 24
      } else if (figureRect) {
        pqY = figureRect.y + figureRect.height + 24
      } else {
        pqY = copyTop + BODY_LINE_HEIGHT * 6
      }
      pullQuoteBlock = { x: pqX, y: pqY, width: pqWidth, height: pqHeight }

      figureObstacles.push({
        rect: pullQuoteBlock,
        horizontalPadding: Math.round(BODY_LINE_HEIGHT * 0.8),
        verticalPadding: Math.round(BODY_LINE_HEIGHT * 0.6),
      })
    }

    const bottomReserve = config.bottomReserve ?? 0

    // Lay out body text in columns — reasonable max height
    const maxBodyHeight = bottomReserve > 0 ? 1200 : 4000
    const bodyRegion: Rect = {
      x: gutter,
      y: copyTop,
      width: contentWidth,
      height: maxBodyHeight,
    }

    // ── Clean layout (no butterfly) — used for anchor positions only ──────
    // Anchor positions must never be contaminated by butterfly displacement
    // (which would cause a feedback loop: butterfly chasing its own displaced text).
    const cleanResult = layoutText(
      config.body,
      BODY_FONT,
      BODY_LINE_HEIGHT,
      bodyRegion,
      figureObstacles,  // figure + pull-quote only, no butterfly
    )

    // ── Live layout (with butterfly) — used for rendered body lines ────────
    let bodyLines: PositionedLine[]
    if (butterflyObstacle) {
      const liveResult = layoutText(
        config.body,
        BODY_FONT,
        BODY_LINE_HEIGHT,
        bodyRegion,
        [...figureObstacles, butterflyObstacle],
      )
      bodyLines = liveResult.lines
    } else {
      bodyLines = cleanResult.lines  // reuse clean result when no butterfly
    }

    // Find where body text actually ends
    let actualBodyBottom = 0
    for (const line of bodyLines) {
      const lineBottom = line.y + BODY_LINE_HEIGHT
      if (lineBottom > actualBodyBottom) actualBodyBottom = lineBottom
    }

    const extraY = bottomReserve > 0 ? actualBodyBottom + 32 : 0
    const contentHeight = bottomReserve > 0
      ? extraY + bottomReserve + 40
      : Math.max(actualBodyBottom + 80, 400) // tight-fit to actual text with bottom margin

    setLayout({
      titleLines: titleResult.lines,
      creditPos,
      bodyLines,
      pullQuoteBlock,
      figureRect,
      figureImgHeight,
      contentHeight,
      extraY,
    })

    if (cleanResult.lines.length > 0) {
      const first = cleanResult.lines[0]!
      const last  = cleanResult.lines[cleanResult.lines.length - 1]!
      onAnchorPositionsRef.current?.({
        // Start: left edge of first word — butterfly will sit just to its left
        firstWord: { x: first.x, y: first.y },
        // End: right edge of last word's line — butterfly will sit just to its right
        lastWord: { x: last.x + last.width, y: last.y },
      })
    }
  }, [config, butterflyObstacle])

  // Keep a ref so the resize handler always calls the latest computeLayout
  // without needing to re-register on every butterfly position update.
  const computeLayoutRef = useRef(computeLayout)
  useEffect(() => { computeLayoutRef.current = computeLayout }, [computeLayout])

  // ── Effect: register resize listener once ──────────────────────────
  useEffect(() => {
    const onResize = () => computeLayoutRef.current()
    window.addEventListener('resize', onResize)
    document.fonts.ready.then(() => computeLayoutRef.current())
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // ── Effect: run layout whenever config or butterfly obstacle changes ─
  useEffect(() => {
    computeLayout()
  }, [computeLayout])

  // ── Render ──────────────────────────────────────────────────────────
  const fig = config.figure

  return (
    <div
      ref={containerRef}
      className="page-spread"
      style={{ minHeight: layout?.contentHeight ? `${layout.contentHeight}px` : '100vh' }}
    >
      {/* Title lines (positioned by Pretext) */}
      {layout && (
        <div className="spread-lines">
          {layout.titleLines.map((line, i) => (
            <span
              key={`title-${i}`}
              className="spread-line spread-line--title"
              style={{
                left: `${line.x}px`,
                top: `${line.y}px`,
                font: TITLE_FONT,
                lineHeight: `${TITLE_LINE_HEIGHT}px`,
              }}
            >
              {line.text}
            </span>
          ))}

          {/* Credit */}
          {layout.creditPos && (
            <span
              className="spread-line spread-line--credit"
              style={{
                left: `${layout.creditPos.x}px`,
                top: `${layout.creditPos.y}px`,
              }}
            >
              {config.credit}
            </span>
          )}

          {/* Body lines */}
          {layout.bodyLines.map((line, i) => (
            <span
              key={`body-${i}`}
              className="spread-line spread-line--body butterfly-text-line"
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

          {/* Pull quote — regular blockquote, body text routes around it */}
          {layout.pullQuoteBlock && config.pullQuote && (
            <blockquote
              className="pull-quote"
              style={{
                position: 'absolute',
                left: `${layout.pullQuoteBlock.x}px`,
                top: `${layout.pullQuoteBlock.y}px`,
                width: `${layout.pullQuoteBlock.width}px`,
                margin: 0,
                lineHeight: `${PULL_QUOTE_LINE_HEIGHT}px`,
              }}
            >
              {config.pullQuote}
            </blockquote>
          )}
        </div>
      )}

      {/* Figure (regular DOM element, not positioned by Pretext) */}
      {fig && layout?.figureRect && (
        <figure
          className={`page-figure page-figure--${fig.placement}`}
          style={{
            position: 'absolute',
            left: `${layout.figureRect.x}px`,
            top: `${layout.figureRect.y}px`,
            width: `${layout.figureRect.width}px`,
            margin: 0,
          }}
        >
          <img
            src={fig.src}
            alt={fig.alt}
            className="page-figure__img"
            style={{ width: '100%', height: layout.figureImgHeight, objectFit: 'cover', maxHeight: 'none' }}
          />
          <figcaption className="page-figure__caption">{fig.caption}</figcaption>
        </figure>
      )}

      {/* Extra children (e.g. TOC for colophon) with page number below */}
      {children && layout && (
        <div
          className="spread-extra"
          style={{
            position: 'absolute',
            left: 0,
            top: `${layout.extraY}px`,
            right: 0,
          }}
        >
          {children}
          {config.pageNumber && (
            <div className="spread-page-number" style={{ position: 'static', transform: 'none', marginTop: '1.5rem' }}>
              {config.pageNumber}
            </div>
          )}
        </div>
      )}

      {/* Page number (no extra children) */}
      {!children && config.pageNumber && (
        <div className="spread-page-number">{config.pageNumber}</div>
      )}
    </div>
  )
}
