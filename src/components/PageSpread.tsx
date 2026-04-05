import React, { useRef, useEffect, useState, useCallback, type ReactNode } from 'react'
import { layoutText, type PositionedLine, type BandObstacle } from './spread-layout'
import type { Rect } from '../layout-engine/wrap-geometry'
import { useLayoutData } from '../context/LayoutDataContext'
import { useGlobalLightbox } from '../context/LightboxContext'

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
  /** Single figure (legacy) */
  figure?: SpreadFigure
  /** Multiple figures (new - preferred) */
  figures?: SpreadFigure[]
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

export const PageSpread = React.forwardRef<HTMLDivElement, PageSpreadProps>(
  function PageSpread({ config, children, onAnchorPositions, butterflyObstacle }: PageSpreadProps, ref) {
    const containerRef = useRef<HTMLDivElement>(null)
    const { registerLayout } = useLayoutData()
    const { openLightbox } = useGlobalLightbox()

    // Merge forwarded ref with internal ref
    const setContainerRef = useCallback((el: HTMLDivElement | null) => {
      containerRef.current = el
      if (typeof ref === 'function') {
        ref(el)
      } else if (ref) {
        ref.current = el
      }
    }, [ref])
    // Stable ref so computeLayout's useCallback dep array stays clean
    const onAnchorPositionsRef = useRef(onAnchorPositions)
    useEffect(() => { onAnchorPositionsRef.current = onAnchorPositions }, [onAnchorPositions])
    const [layout, setLayout] = useState<{
      titleLines: PositionedLine[]
      creditPos: { x: number; y: number } | null
      bodyLines: PositionedLine[]
      pullQuoteBlock: { x: number; y: number; width: number; height: number } | null
      figureRect: Rect | null
      figureRects: Rect[]
      figureImgHeights: number[]
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
      const gutter = isNarrow ? 16 : 32
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

      // Figure geometry - support multiple figures
      let figureRect: Rect | null = null
      const figureRects: Rect[] = []
      const figureImgHeights: number[] = []
      
      // Use figures array if available, otherwise fall back to single figure
      const figuresToRender = config.figures || (config.figure ? [config.figure] : [])
      
      let currentFigY = copyTop
      for (let i = 0; i < figuresToRender.length; i++) {
        const fig = figuresToRender[i]!
        const figW = isNarrow ? contentWidth : Math.round(contentWidth * 0.45)
        const figImgH = isNarrow ? 200 : fig.placement === 'full' || fig.placement === 'wide' ? 280 : 320
        figureImgHeights.push(figImgH)
        const figCaptionH = 70
        const figH = figImgH + figCaptionH
        const figX = fig.placement === 'right'
          ? gutter + contentWidth - figW
          : fig.placement === 'left'
            ? gutter
            : gutter
        const figRect: Rect = { x: figX, y: currentFigY, width: figW, height: figH }
        figureRects.push(figRect)
        
        // Track first figure for legacy compatibility
        if (i === 0) {
          figureRect = figRect
        }
        
        // Add spacing between figures
        currentFigY = currentFigY + figH + 24
      }

      // Build obstacles - include all figures
      const figureObstacles: BandObstacle[] = []
      for (let i = 0; i < figureRects.length; i++) {
        figureObstacles.push({
          rect: figureRects[i]!,
          horizontalPadding: Math.round(BODY_LINE_HEIGHT * 0.7),
          verticalPadding: Math.round(BODY_LINE_HEIGHT * 0.6),
        })
      }

      // Pull quote — rendered as a normal DOM blockquote, but as an obstacle for body text
      let pullQuoteBlock: { x: number; y: number; width: number; height: number } | null = null
      if (config.pullQuote) {
        const pqWidth = isNarrow ? contentWidth : Math.round(contentWidth * 0.4)
        // Check if last figure is full/wide
        const lastFig = figuresToRender[figuresToRender.length - 1]
        const figIsFullOrWide = lastFig && (lastFig.placement === 'full' || lastFig.placement === 'wide')
        const figIsLeft = lastFig?.placement === 'left'
        const pqX = isNarrow
          ? gutter
          : figIsLeft
            ? gutter
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
        // CSS overhead: top padding 2rem (32px) + bottom padding 2rem (32px) +
        // decorative ::before quote mark extends ~40px above text + border-left 4px
        const cssOverhead = 108
        // Extra safety margin to prevent body text overlap below the quote
        const safetyMargin = 32
        const pqHeight = textHeight + cssOverhead + safetyMargin
        // If figure is full/wide, place pull quote below it.
        // If figure is right/left, pull quote goes on the opposite side but below figure bottom.
        let pqY: number
        if (figIsFullOrWide && figureRects.length > 0) {
          const lastFigRect = figureRects[figureRects.length - 1]!
          pqY = lastFigRect.y + lastFigRect.height + 24
        } else if (figureRects.length > 0) {
          const lastFigRect = figureRects[figureRects.length - 1]!
          pqY = lastFigRect.y + lastFigRect.height + 24
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

      // Lay out body text — reasonable max height
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

      // Find where the last figure ends (figures stack vertically and can extend below body text)
      let figureBottom = 0
      for (let i = 0; i < figureRects.length; i++) {
        const rect = figureRects[i]!
        const b = rect.y + rect.height
        if (b > figureBottom) figureBottom = b
      }

      // Container must be tall enough for both body text AND all figures
      const neededHeight = Math.max(actualBodyBottom, figureBottom)

      const extraY = bottomReserve > 0 ? neededHeight + 32 : 0
      const contentHeight = bottomReserve > 0
        ? extraY + bottomReserve + 40
        : Math.max(neededHeight + 80, 400) // tight-fit to actual content with bottom margin

      const layoutData = {
        titleLines: titleResult.lines,
        creditPos,
        bodyLines,
        pullQuoteBlock,
        figureRect,
        figureRects,
        figureImgHeights,
        contentHeight,
        extraY,
      }

      setLayout(layoutData)
      registerLayout({
        bodyLines: layoutData.bodyLines,
        titleLines: layoutData.titleLines,
        pullQuoteBlock: layoutData.pullQuoteBlock,
        figureRect: layoutData.figureRect,
      })

      if (cleanResult.lines.length > 0) {
        const first = cleanResult.lines[0]!
        const last = cleanResult.lines[cleanResult.lines.length - 1]!
        onAnchorPositionsRef.current?.({
          // Start: left edge of first word — butterfly will sit just to its left
          firstWord: { x: first.x, y: first.y },
          // End: right edge of last word's line — butterfly will sit just to its right
          lastWord: { x: last.x + last.width, y: last.y },
        })
      }
    }, [config, butterflyObstacle, registerLayout])

    // Keep a ref so the resize handler always calls the latest computeLayout
    // without needing to re-register on every butterfly position update.
    const computeLayoutRef = useRef(computeLayout)
    useEffect(() => { computeLayoutRef.current = computeLayout }, [computeLayout])

    // ── Effect: register resize listener + ResizeObserver ──────────────
    useEffect(() => {
      const container = containerRef.current
      if (!container) return

      const onResize = () => computeLayoutRef.current()
      window.addEventListener('resize', onResize)
      document.fonts.ready.then(() => computeLayoutRef.current())

      // ResizeObserver catches sidebar expand/collapse changing container width
      const ro = new ResizeObserver(() => computeLayoutRef.current())
      ro.observe(container)

      return () => {
        window.removeEventListener('resize', onResize)
        ro.disconnect()
      }
    }, [])

    // ── Effect: run layout whenever config or butterfly obstacle changes ─
    useEffect(() => {
      computeLayout()
    }, [computeLayout])

    // ── Render ──────────────────────────────────────────────────────────
    const figuresToRender = config.figures || (config.figure ? [config.figure] : [])

    return (
      <div
        ref={setContainerRef}
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

        {/* Multiple figures (regular DOM elements, not positioned by Pretext) */}
        {layout && figuresToRender.length > 0 && figuresToRender.map((fig, i) => {
          const figRect = layout.figureRects[i]
          const imgHeight = layout.figureImgHeights[i] ?? 320
          if (!figRect) return null
          
          return (
            <figure
              key={`figure-${i}`}
              className={`page-figure page-figure--${fig.placement}`}
              style={{
                position: 'absolute',
                left: `${figRect.x}px`,
                top: `${figRect.y}px`,
                width: `${figRect.width}px`,
                margin: 0,
              }}
            >
              <img
                src={fig.src}
                alt={fig.alt as string}
                className="page-figure__img page-figure__img--clickable"
                style={{ width: '100%', height: imgHeight, objectFit: 'cover', maxHeight: 'none' }}
                onClick={() => openLightbox(fig.src, fig.alt as string)}
              />
              <figcaption className="page-figure__caption">{fig.caption}</figcaption>
            </figure>
          )
        })}

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
  },
)
