import { useRef, useEffect, useCallback } from 'react'
import { layoutNextLine, prepareWithSegments, walkLineRanges, type LayoutCursor, type PreparedTextWithSegments } from '../layout-engine/layout.ts'
import { BODY_COPY } from '../assets/body-copy.ts'
import openaiLogoUrl from '../assets/openai-symbol.svg'
import claudeLogoUrl from '../assets/claude-symbol.svg'
import {
  carveTextLineSlots,
  getPolygonIntervalForBand,
  getRectIntervalsForBand,
  getWrapHull,
  isPointInPolygon,
  transformWrapPoints,
  type Interval,
  type Point,
  type Rect,
} from '../layout-engine/wrap-geometry.ts'

// ── Constants ────────────────────────────────────────────────────────────────

const BODY_FONT = '20px "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Palatino, serif'
const BODY_LINE_HEIGHT = 32
const CREDIT_TEXT = 'Leopold Aschenbrenner'
const CREDIT_FONT = '12px "Helvetica Neue", Helvetica, Arial, sans-serif'
const CREDIT_LINE_HEIGHT = 16
const HEADLINE_TEXT = 'SITUATIONAL AWARENESS: THE DECADE AHEAD'
const HEADLINE_FONT_FAMILY = '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Palatino, serif'
const HINT_PILL_SAFE_TOP = 72
const NARROW_BREAKPOINT = 760
const NARROW_COLUMN_MAX_WIDTH = 430

// ── Types ────────────────────────────────────────────────────────────────────

type LogoKind = 'openai' | 'claude'
type SpinState = { from: number; to: number; start: number; duration: number }
type LogoAnimationState = { angle: number; spin: SpinState | null }
type PositionedLine = { x: number; y: number; width: number; text: string }
type ProjectedBodyLine = PositionedLine & { className: string }
type TextProjection = {
  pageWidth: number; pageHeight: number; headlineFont: string; headlineLineHeight: number
  headlineLines: PositionedLine[]; creditLeft: number; creditTop: number
  bodyFont: string; bodyLineHeight: number; bodyLines: ProjectedBodyLine[]
}
type BandObstacle =
  | { kind: 'polygon'; points: Point[]; horizontalPadding: number; verticalPadding: number }
  | { kind: 'rects'; rects: Rect[]; horizontalPadding: number; verticalPadding: number }
type PageLayout = {
  isNarrow: boolean; gutter: number; pageWidth: number; pageHeight: number
  centerGap: number; columnWidth: number; headlineRegion: Rect; headlineFont: string
  headlineLineHeight: number; creditGap: number; copyGap: number
  openaiRect: Rect; claudeRect: Rect
}
type LogoHits = { openai: Point[]; claude: Point[] }
type WrapHulls = { openaiLayout: Point[]; claudeLayout: Point[]; openaiHit: Point[]; claudeHit: Point[] }
type DomCache = {
  page: HTMLElement; headline: HTMLHeadingElement; credit: HTMLParagraphElement
  openaiLogo: HTMLImageElement; claudeLogo: HTMLImageElement
  headlineLines: HTMLSpanElement[]; bodyLines: HTMLSpanElement[]
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function resolveImportedAssetUrl(assetUrl: string): string {
  if (/^(?:[a-z]+:)?\/\//i.test(assetUrl) || assetUrl.startsWith('data:') || assetUrl.startsWith('blob:')) return assetUrl
  if (assetUrl.startsWith('/')) return new URL(assetUrl, window.location.origin).href
  return new URL(assetUrl, import.meta.url).href
}

function createHeadline(): HTMLHeadingElement {
  const el = document.createElement('h1')
  el.className = 'headline'
  return el
}

function createCredit(): HTMLParagraphElement {
  const el = document.createElement('p')
  el.className = 'credit'
  el.textContent = CREDIT_TEXT
  return el
}

function createLogo(className: string, alt: string, src: string): HTMLImageElement {
  const el = document.createElement('img')
  el.className = className; el.alt = alt; el.src = src; el.draggable = false
  return el
}

function syncPool<T extends HTMLElement>(pool: T[], length: number, create: () => T, parent: HTMLElement): void {
  while (pool.length < length) { const el = create(); pool.push(el); parent.appendChild(el) }
  while (pool.length > length) { pool.pop()!.remove() }
}

function positionedLinesEqual(a: PositionedLine[], b: PositionedLine[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    const l = a[i]!, r = b[i]!
    if (l.x !== r.x || l.y !== r.y || l.width !== r.width || l.text !== r.text) return false
  }
  return true
}

function projectedBodyLinesEqual(a: ProjectedBodyLine[], b: ProjectedBodyLine[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    const l = a[i]!, r = b[i]!
    if (l.className !== r.className || l.x !== r.x || l.y !== r.y || l.width !== r.width || l.text !== r.text) return false
  }
  return true
}

function textProjectionEqual(a: TextProjection | null, b: TextProjection): boolean {
  return a !== null && a.pageWidth === b.pageWidth && a.pageHeight === b.pageHeight
    && a.headlineFont === b.headlineFont && a.headlineLineHeight === b.headlineLineHeight
    && a.creditLeft === b.creditLeft && a.creditTop === b.creditTop
    && a.bodyFont === b.bodyFont && a.bodyLineHeight === b.bodyLineHeight
    && positionedLinesEqual(a.headlineLines, b.headlineLines)
    && projectedBodyLinesEqual(a.bodyLines, b.bodyLines)
}

function easeSpin(t: number): number { const o = 1 - t; return 1 - o * o * o }

// ── Component ────────────────────────────────────────────────────────────────

export function HomePage() {
  const stageRef = useRef<HTMLDivElement>(null)
  const domCacheRef = useRef<DomCache | null>(null)
  const stateRef = useRef<{
    preparedByKey: Map<string, PreparedTextWithSegments>
    scheduled: { value: boolean }
    events: { mousemove: MouseEvent | null; click: MouseEvent | null; blur: boolean }
    pointer: { x: number; y: number }
    currentLogoHits: LogoHits
    hoveredLogo: LogoKind | null
    committedTextProjection: TextProjection | null
    logoAnimations: { openai: LogoAnimationState; claude: LogoAnimationState }
    wrapHulls: WrapHulls
    preparedBody: PreparedTextWithSegments
    preparedCredit: PreparedTextWithSegments
    creditWidth: number
    ready: boolean
  } | null>(null)

  const getPrepared = useCallback((text: string, font: string): PreparedTextWithSegments => {
    const state = stateRef.current!
    const key = `${font}::${text}`
    const cached = state.preparedByKey.get(key)
    if (cached !== undefined) return cached
    const prepared = prepareWithSegments(text, font)
    state.preparedByKey.set(key, prepared)
    return prepared
  }, [])

  const headlineBreaksInsideWord = useCallback((prepared: PreparedTextWithSegments, maxWidth: number): boolean => {
    let breaks = false
    walkLineRanges(prepared, maxWidth, line => { if (line.end.graphemeIndex !== 0) breaks = true })
    return breaks
  }, [])

  const fitHeadlineFontSize = useCallback((headlineWidth: number, pageWidth: number): number => {
    let low = Math.ceil(Math.max(22, pageWidth * 0.026))
    let high = Math.floor(Math.min(94.4, Math.max(55.2, pageWidth * 0.055)))
    let best = low
    while (low <= high) {
      const size = Math.floor((low + high) / 2)
      const font = `700 ${size}px ${HEADLINE_FONT_FAMILY}`
      const prepared = getPrepared(HEADLINE_TEXT, font)
      if (!headlineBreaksInsideWord(prepared, headlineWidth)) { best = size; low = size + 1 } else { high = size - 1 }
    }
    return best
  }, [getPrepared, headlineBreaksInsideWord])

  const buildLayout = useCallback((pageWidth: number, pageHeight: number, lineHeight: number): PageLayout => {
    const isNarrow = pageWidth < NARROW_BREAKPOINT
    if (isNarrow) {
      const gutter = Math.round(Math.max(18, Math.min(28, pageWidth * 0.06)))
      const columnWidth = Math.round(Math.min(pageWidth - gutter * 2, NARROW_COLUMN_MAX_WIDTH))
      const headlineTop = 28
      const headlineWidth = pageWidth - gutter * 2
      const headlineFontSize = Math.min(48, fitHeadlineFontSize(headlineWidth, pageWidth))
      const headlineLineHeight = Math.round(headlineFontSize * 0.92)
      const headlineFont = `700 ${headlineFontSize}px ${HEADLINE_FONT_FAMILY}`
      const creditGap = Math.round(Math.max(12, lineHeight * 0.5))
      const copyGap = Math.round(Math.max(18, lineHeight * 0.7))
      const claudeSize = Math.round(Math.min(92, pageWidth * 0.23, pageHeight * 0.11))
      const openaiSize = Math.round(Math.min(138, pageWidth * 0.34))
      return {
        isNarrow, gutter, pageWidth, pageHeight, centerGap: 0, columnWidth,
        headlineRegion: { x: gutter, y: headlineTop, width: headlineWidth, height: Math.max(320, pageHeight - headlineTop - gutter) },
        headlineFont, headlineLineHeight, creditGap, copyGap,
        openaiRect: { x: gutter - Math.round(openaiSize * 0.22), y: pageHeight - gutter - openaiSize + Math.round(openaiSize * 0.08), width: openaiSize, height: openaiSize },
        claudeRect: { x: pageWidth - gutter - Math.round(claudeSize * 0.88), y: 4, width: claudeSize, height: claudeSize },
      }
    }
    const gutter = Math.round(Math.max(52, pageWidth * 0.048))
    const centerGap = Math.round(Math.max(28, pageWidth * 0.025))
    const columnWidth = Math.round((pageWidth - gutter * 2 - centerGap) / 2)
    const headlineTop = Math.round(Math.max(42, pageWidth * 0.04, HINT_PILL_SAFE_TOP))
    const headlineWidth = Math.round(Math.min(pageWidth - gutter * 2, Math.max(columnWidth, pageWidth * 0.5)))
    const headlineFontSize = fitHeadlineFontSize(headlineWidth, pageWidth)
    const headlineLineHeight = Math.round(headlineFontSize * 0.92)
    const headlineFont = `700 ${headlineFontSize}px ${HEADLINE_FONT_FAMILY}`
    const creditGap = Math.round(Math.max(14, lineHeight * 0.6))
    const copyGap = Math.round(Math.max(20, lineHeight * 0.9))
    const openaiShrinkT = Math.max(0, Math.min(1, (960 - pageWidth) / 260))
    const OPENAI_SIZE = 400 - openaiShrinkT * 56
    const openaiSize = Math.round(Math.min(OPENAI_SIZE, pageHeight * 0.43))
    const claudeSize = Math.round(Math.max(276, Math.min(500, pageWidth * 0.355, pageHeight * 0.45)))
    return {
      isNarrow, gutter, pageWidth, pageHeight, centerGap, columnWidth,
      headlineRegion: { x: gutter, y: headlineTop, width: headlineWidth, height: pageHeight - headlineTop - gutter },
      headlineFont, headlineLineHeight, creditGap, copyGap,
      openaiRect: { x: gutter - Math.round(openaiSize * 0.3), y: pageHeight - gutter - openaiSize + Math.round(openaiSize * 0.2), width: openaiSize, height: openaiSize },
      claudeRect: { x: pageWidth - Math.round(claudeSize * 0.69), y: -Math.round(claudeSize * 0.22), width: claudeSize, height: claudeSize },
    }
  }, [fitHeadlineFontSize])

  const getObstacleIntervals = useCallback((obstacle: BandObstacle, bandTop: number, bandBottom: number): Interval[] => {
    switch (obstacle.kind) {
      case 'polygon': {
        const interval = getPolygonIntervalForBand(obstacle.points, bandTop, bandBottom, obstacle.horizontalPadding, obstacle.verticalPadding)
        return interval === null ? [] : [interval]
      }
      case 'rects':
        return getRectIntervalsForBand(obstacle.rects, bandTop, bandBottom, obstacle.horizontalPadding, obstacle.verticalPadding)
    }
  }, [])

  const layoutColumn = useCallback((
    prepared: PreparedTextWithSegments, startCursor: LayoutCursor, region: Rect,
    lineHeight: number, obstacles: BandObstacle[], side: 'left' | 'right',
  ): { lines: PositionedLine[]; cursor: LayoutCursor } => {
    let cursor: LayoutCursor = startCursor
    let lineTop = region.y
    const lines: PositionedLine[] = []
    while (true) {
      if (lineTop + lineHeight > region.y + region.height) break
      const bandTop = lineTop, bandBottom = lineTop + lineHeight
      const blocked: Interval[] = []
      for (const obstacle of obstacles) {
        const intervals = getObstacleIntervals(obstacle, bandTop, bandBottom)
        for (const interval of intervals) blocked.push(interval)
      }
      const slots = carveTextLineSlots({ left: region.x, right: region.x + region.width }, blocked)
      if (slots.length === 0) { lineTop += lineHeight; continue }
      let slot = slots[0]!
      for (let i = 1; i < slots.length; i++) {
        const c = slots[i]!
        const bw = slot.right - slot.left, cw = c.right - c.left
        if (cw > bw) { slot = c; continue }
        if (cw < bw) continue
        if (side === 'left') { if (c.left > slot.left) slot = c } else { if (c.left < slot.left) slot = c }
      }
      const line = layoutNextLine(prepared, cursor, slot.right - slot.left)
      if (line === null) break
      lines.push({ x: Math.round(slot.left), y: Math.round(lineTop), width: line.width, text: line.text })
      cursor = line.end
      lineTop += lineHeight
    }
    return { lines, cursor }
  }, [getObstacleIntervals])

  const getLogoProjection = useCallback((layout: PageLayout, lineHeight: number): { openaiObstacle: BandObstacle; claudeObstacle: BandObstacle; hits: LogoHits } => {
    const state = stateRef.current!
    const openaiWrap = transformWrapPoints(state.wrapHulls.openaiLayout, layout.openaiRect, state.logoAnimations.openai.angle)
    const claudeWrap = transformWrapPoints(state.wrapHulls.claudeLayout, layout.claudeRect, state.logoAnimations.claude.angle)
    return {
      openaiObstacle: { kind: 'polygon', points: openaiWrap, horizontalPadding: Math.round(lineHeight * 0.82), verticalPadding: Math.round(lineHeight * 0.26) },
      claudeObstacle: { kind: 'polygon', points: claudeWrap, horizontalPadding: Math.round(lineHeight * 0.28), verticalPadding: Math.round(lineHeight * 0.12) },
      hits: {
        openai: transformWrapPoints(state.wrapHulls.openaiHit, layout.openaiRect, state.logoAnimations.openai.angle),
        claude: transformWrapPoints(state.wrapHulls.claudeHit, layout.claudeRect, state.logoAnimations.claude.angle),
      },
    }
  }, [])

  const evaluateLayout = useCallback((
    layout: PageLayout, lineHeight: number, preparedBody: PreparedTextWithSegments,
  ): { headlineLines: PositionedLine[]; creditLeft: number; creditTop: number; leftLines: PositionedLine[]; rightLines: PositionedLine[]; contentHeight: number; hits: LogoHits } => {
    const state = stateRef.current!
    const { openaiObstacle, claudeObstacle, hits } = getLogoProjection(layout, lineHeight)
    const headlinePrepared = getPrepared(HEADLINE_TEXT, layout.headlineFont)
    const headlineResult = layoutColumn(headlinePrepared, { segmentIndex: 0, graphemeIndex: 0 }, layout.headlineRegion, layout.headlineLineHeight, [openaiObstacle], 'left')
    const headlineLines = headlineResult.lines
    const headlineRects = headlineLines.map(l => ({ x: l.x, y: l.y, width: Math.ceil(l.width), height: layout.headlineLineHeight }))
    const headlineBottom = headlineLines.length === 0 ? layout.headlineRegion.y : Math.max(...headlineLines.map(l => l.y + layout.headlineLineHeight))
    const creditTop = headlineBottom + layout.creditGap
    const creditRegion: Rect = { x: layout.gutter + 4, y: creditTop, width: layout.headlineRegion.width, height: CREDIT_LINE_HEIGHT }
    const copyTop = creditTop + CREDIT_LINE_HEIGHT + layout.copyGap
    const leftRegion: Rect = { x: layout.gutter, y: copyTop, width: layout.columnWidth, height: layout.pageHeight - copyTop - layout.gutter }
    const rightRegion: Rect = { x: layout.gutter + layout.columnWidth + layout.centerGap, y: layout.headlineRegion.y, width: layout.columnWidth, height: layout.pageHeight - layout.headlineRegion.y - layout.gutter }
    const titleObstacle: BandObstacle = { kind: 'rects', rects: headlineRects, horizontalPadding: Math.round(lineHeight * 0.95), verticalPadding: Math.round(lineHeight * 0.3) }
    const creditBlocked = getObstacleIntervals(openaiObstacle, creditRegion.y, creditRegion.y + creditRegion.height)
    const claudeCreditBlocked = getObstacleIntervals(claudeObstacle, creditRegion.y, creditRegion.y + creditRegion.height)
    const creditSlots = carveTextLineSlots({ left: creditRegion.x, right: creditRegion.x + creditRegion.width }, layout.isNarrow ? creditBlocked.concat(claudeCreditBlocked) : creditBlocked)
    let creditLeft = creditRegion.x
    for (const slot of creditSlots) { if (slot.right - slot.left >= state.creditWidth) { creditLeft = Math.round(slot.left); break } }

    if (layout.isNarrow) {
      const bodyRegion: Rect = { x: Math.round((layout.pageWidth - layout.columnWidth) / 2), y: copyTop, width: layout.columnWidth, height: Math.max(0, layout.pageHeight - copyTop - layout.gutter) }
      const bodyResult = layoutColumn(preparedBody, { segmentIndex: 0, graphemeIndex: 0 }, bodyRegion, lineHeight, [claudeObstacle, openaiObstacle], 'left')
      return { headlineLines, creditLeft, creditTop, leftLines: bodyResult.lines, rightLines: [], contentHeight: layout.pageHeight, hits }
    }

    const leftResult = layoutColumn(preparedBody, { segmentIndex: 0, graphemeIndex: 0 }, leftRegion, lineHeight, [openaiObstacle], 'left')
    const rightResult = layoutColumn(preparedBody, leftResult.cursor, rightRegion, lineHeight, [titleObstacle, claudeObstacle, openaiObstacle], 'right')
    return { headlineLines, creditLeft, creditTop, leftLines: leftResult.lines, rightLines: rightResult.lines, contentHeight: layout.pageHeight, hits }
  }, [getLogoProjection, getPrepared, layoutColumn, getObstacleIntervals])

  const projectHeadlineLines = useCallback((lines: PositionedLine[], font: string, lineHeight: number) => {
    const dom = domCacheRef.current!
    syncPool(dom.headlineLines, lines.length, () => { const el = document.createElement('span'); el.className = 'headline-line'; return el }, dom.headline)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!, el = dom.headlineLines[i]!
      el.textContent = line.text
      el.style.left = `${line.x}px`; el.style.top = `${line.y}px`
      el.style.font = font; el.style.lineHeight = `${lineHeight}px`
    }
  }, [])

  const projectChromeLayout = useCallback((layout: PageLayout, contentHeight: number) => {
    const dom = domCacheRef.current!
    const state = stateRef.current!
    dom.page.className = layout.isNarrow ? 'page page--mobile' : 'page'
    dom.headline.parentElement!.style.height = `${contentHeight}px`
    dom.openaiLogo.style.left = `${layout.openaiRect.x}px`; dom.openaiLogo.style.top = `${layout.openaiRect.y}px`
    dom.openaiLogo.style.width = `${layout.openaiRect.width}px`; dom.openaiLogo.style.height = `${layout.openaiRect.height}px`
    dom.openaiLogo.style.transform = `rotate(${state.logoAnimations.openai.angle}rad)`
    dom.claudeLogo.style.left = `${layout.claudeRect.x}px`; dom.claudeLogo.style.top = `${layout.claudeRect.y}px`
    dom.claudeLogo.style.width = `${layout.claudeRect.width}px`; dom.claudeLogo.style.height = `${layout.claudeRect.height}px`
    dom.claudeLogo.style.transform = `rotate(${state.logoAnimations.claude.angle}rad)`
  }, [])

  const projectTextProjection = useCallback((projection: TextProjection) => {
    const dom = domCacheRef.current!
    dom.headline.style.left = '0px'; dom.headline.style.top = '0px'
    dom.headline.style.width = `${projection.pageWidth}px`; dom.headline.style.height = `${projection.pageHeight}px`
    dom.headline.style.font = projection.headlineFont; dom.headline.style.lineHeight = `${projection.headlineLineHeight}px`
    dom.headline.style.letterSpacing = '0px'
    projectHeadlineLines(projection.headlineLines, projection.headlineFont, projection.headlineLineHeight)
    dom.credit.style.left = `${projection.creditLeft}px`; dom.credit.style.top = `${projection.creditTop}px`
    dom.credit.style.width = 'auto'; dom.credit.style.font = CREDIT_FONT; dom.credit.style.lineHeight = `${CREDIT_LINE_HEIGHT}px`
    syncPool(dom.bodyLines, projection.bodyLines.length, () => { const el = document.createElement('span'); el.className = 'line'; return el }, dom.headline.parentElement!)
    for (let i = 0; i < projection.bodyLines.length; i++) {
      const line = projection.bodyLines[i]!, el = dom.bodyLines[i]!
      el.className = line.className; el.textContent = line.text
      el.style.left = `${line.x}px`; el.style.top = `${line.y}px`
      el.style.font = projection.bodyFont; el.style.lineHeight = `${projection.bodyLineHeight}px`
    }
  }, [projectHeadlineLines])

  const updateLogoSpin = useCallback((logo: LogoAnimationState, now: number): boolean => {
    if (logo.spin === null) return false
    const progress = Math.min(1, (now - logo.spin.start) / logo.spin.duration)
    logo.angle = logo.spin.from + (logo.spin.to - logo.spin.from) * easeSpin(progress)
    if (progress >= 1) { logo.angle = logo.spin.to; logo.spin = null; return false }
    return true
  }, [])

  const startLogoSpin = useCallback((kind: LogoKind, direction: 1 | -1, now: number) => {
    const state = stateRef.current!
    const logo = state.logoAnimations[kind]
    const delta = direction * Math.PI
    logo.spin = { from: logo.angle, to: logo.angle + delta, start: now, duration: 900 }
  }, [])

  const commitFrame = useCallback((now: number): boolean => {
    const state = stateRef.current!
    const lineHeight = BODY_LINE_HEIGHT
    const root = document.documentElement
    const pageWidth = root.clientWidth, pageHeight = root.clientHeight
    const animating = updateLogoSpin(state.logoAnimations.openai, now) || updateLogoSpin(state.logoAnimations.claude, now)
    const layout = buildLayout(pageWidth, pageHeight, lineHeight)
    const result = evaluateLayout(layout, lineHeight, state.preparedBody)
    state.currentLogoHits = result.hits
    projectChromeLayout(layout, result.contentHeight)
    const bodyLines: ProjectedBodyLine[] = [
      ...result.leftLines.map(l => ({ ...l, className: 'line line--left' })),
      ...result.rightLines.map(l => ({ ...l, className: 'line line--right' })),
    ]
    const textProjection: TextProjection = {
      pageWidth: layout.pageWidth, pageHeight: layout.pageHeight, headlineFont: layout.headlineFont,
      headlineLineHeight: layout.headlineLineHeight, headlineLines: result.headlineLines,
      creditLeft: result.creditLeft, creditTop: result.creditTop,
      bodyFont: BODY_FONT, bodyLineHeight: lineHeight, bodyLines,
    }
    if (!textProjectionEqual(state.committedTextProjection, textProjection)) {
      projectTextProjection(textProjection)
      state.committedTextProjection = textProjection
    }
    document.body.style.cursor = state.hoveredLogo === null ? '' : 'pointer'
    return animating
  }, [buildLayout, evaluateLayout, projectChromeLayout, projectTextProjection, updateLogoSpin])

  const render = useCallback((now: number): boolean => {
    const state = stateRef.current!
    if (state.events.click !== null) { state.pointer.x = state.events.click.clientX; state.pointer.y = state.events.click.clientY }
    if (state.events.mousemove !== null) { state.pointer.x = state.events.mousemove.clientX; state.pointer.y = state.events.mousemove.clientY }
    const nextHovered = state.events.blur ? null
      : isPointInPolygon(state.currentLogoHits.openai, state.pointer.x, state.pointer.y) ? 'openai'
        : isPointInPolygon(state.currentLogoHits.claude, state.pointer.x, state.pointer.y) ? 'claude' : null
    state.hoveredLogo = nextHovered
    if (state.events.click !== null) {
      if (isPointInPolygon(state.currentLogoHits.openai, state.pointer.x, state.pointer.y)) startLogoSpin('openai', -1, now)
      else if (isPointInPolygon(state.currentLogoHits.claude, state.pointer.x, state.pointer.y)) startLogoSpin('claude', 1, now)
    }
    state.events.mousemove = null; state.events.click = null; state.events.blur = false
    return commitFrame(now)
  }, [commitFrame, startLogoSpin])

  const scheduleRender = useCallback(() => {
    const state = stateRef.current!
    if (state.scheduled.value) return
    state.scheduled.value = true
    requestAnimationFrame(function tick(now) {
      state!.scheduled.value = false
      if (render(now)) scheduleRender()
    })
  }, [render])

  // ── Init effect ──────────────────────────────────────────────────────────
  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    const OPENAI_LOGO_SRC = resolveImportedAssetUrl(openaiLogoUrl)
    const CLAUDE_LOGO_SRC = resolveImportedAssetUrl(claudeLogoUrl)

    // Build DOM nodes
    const page = document.querySelector('.page') as HTMLElement
    const headline = createHeadline()
    const credit = createCredit()
    const openaiLogo = createLogo('logo logo--openai', 'OpenAI symbol', OPENAI_LOGO_SRC)
    const claudeLogo = createLogo('logo logo--claude', 'Claude symbol', CLAUDE_LOGO_SRC)
    stage.append(headline, credit, openaiLogo, claudeLogo)

    const domCache: DomCache = { page, headline, credit, openaiLogo, claudeLogo, headlineLines: [], bodyLines: [] }
    domCacheRef.current = domCache

    // Preload hulls + fonts
    const preparedByKey = new Map<string, PreparedTextWithSegments>()
    const scheduled = { value: false }
    const events = { mousemove: null as MouseEvent | null, click: null as MouseEvent | null, blur: false }
    const pointer = { x: -Infinity, y: -Infinity }
    const logoAnimations = { openai: { angle: 0, spin: null as SpinState | null }, claude: { angle: 0, spin: null as SpinState | null } }

    // Kick off async preload, then mount once ready
    Promise.all([
      document.fonts.ready,
      getWrapHull(OPENAI_LOGO_SRC, { smoothRadius: 6, mode: 'mean' }),
      getWrapHull(CLAUDE_LOGO_SRC, { smoothRadius: 6, mode: 'mean' }),
      getWrapHull(OPENAI_LOGO_SRC, { smoothRadius: 3, mode: 'mean' }),
      getWrapHull(CLAUDE_LOGO_SRC, { smoothRadius: 5, mode: 'mean' }),
    ]).then(([, openaiLayout, claudeLayout, openaiHit, claudeHit]) => {
      const wrapHulls: WrapHulls = { openaiLayout, claudeLayout, openaiHit, claudeHit }
      const preparedBody = prepareWithSegments(BODY_COPY, BODY_FONT)
      const preparedCredit = prepareWithSegments(CREDIT_TEXT, CREDIT_FONT)
      let creditWidth = 0
      walkLineRanges(preparedCredit, 100_000, line => { creditWidth = line.width })
      creditWidth = Math.ceil(creditWidth)

      stateRef.current = {
        preparedByKey, scheduled, events, pointer,
        currentLogoHits: { openai: [], claude: [] },
        hoveredLogo: null, committedTextProjection: null,
        logoAnimations, wrapHulls, preparedBody, preparedCredit, creditWidth,
        ready: true,
      }

      // Commit first frame
      commitFrame(performance.now())
    })

    // ── Event listeners ──────────────────────────────────────────────────
    const onResize = () => scheduleRender()
    const onTouchMove = (e: TouchEvent) => {
      const sel = window.getSelection()
      if (sel === null || sel.isCollapsed || sel.rangeCount === 0) e.preventDefault()
    }
    const onMouseMove = (e: MouseEvent) => { events.mousemove = e; scheduleRender() }
    const onBlur = () => { events.blur = true; scheduleRender() }
    const onClick = (e: MouseEvent) => { events.click = e; scheduleRender() }

    window.addEventListener('resize', onResize)
    page.addEventListener('touchmove', onTouchMove, { passive: false })
    document.addEventListener('mousemove', onMouseMove)
    window.addEventListener('blur', onBlur)
    document.addEventListener('click', onClick)

    return () => {
      window.removeEventListener('resize', onResize)
      page.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('blur', onBlur)
      document.removeEventListener('click', onClick)
      // Remove all imperatively created DOM nodes to prevent
      // duplicates on React StrictMode double-mount in dev.
      headline.remove()
      credit.remove()
      openaiLogo.remove()
      claudeLogo.remove()
      for (const el of domCache.headlineLines) el.remove()
      for (const el of domCache.bodyLines) el.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <p className="hint-pill">Everything laid out in JS. Resize horizontally and vertically, then click the logos.</p>
      <main className="page">
        <div className="atmosphere atmosphere--left" />
        <div className="atmosphere atmosphere--right" />
        <div ref={stageRef} className="stage" />
      </main>
    </>
  )
}
