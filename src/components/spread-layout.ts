// ── Spread Layout Engine ──
// Uses Pretext to lay out text in columns, routing around rectangular obstacles.

import {
  prepareWithSegments,
  layoutNextLine,
  walkLineRanges,
  type PreparedTextWithSegments,
  type LayoutCursor,
} from '../layout-engine/layout.ts'
import {
  carveTextLineSlots,
  getRectIntervalsForBand,
  type Interval,
  type Rect,
} from '../layout-engine/wrap-geometry.ts'

export type PositionedLine = {
  x: number
  y: number
  width: number
  text: string
}

export type LayoutResult = {
  lines: PositionedLine[]
  overflowed: boolean
  remainingText: string
}

type BandObstacle = {
  rect: Rect
  horizontalPadding: number
  verticalPadding: number
}

const preparedByKey = new Map<string, PreparedTextWithSegments>()

function getPrepared(text: string, font: string): PreparedTextWithSegments {
  const key = `${font}::${text}`
  const cached = preparedByKey.get(key)
  if (cached !== undefined) return cached
  const prepared = prepareWithSegments(text, font)
  preparedByKey.set(key, prepared)
  return prepared
}

/**
 * Lay out prepared text in a rectangular region, routing around obstacles.
 * Returns positioned lines and whether text overflowed the region.
 */
export function layoutText(
  text: string,
  font: string,
  lineHeight: number,
  region: Rect,
  obstacles: BandObstacle[],
): LayoutResult {
  const prepared = getPrepared(text, font)
  let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 }
  let lineTop = region.y
  const lines: PositionedLine[] = []

  while (true) {
    if (lineTop + lineHeight > region.y + region.height) break

    const bandTop = lineTop
    const bandBottom = lineTop + lineHeight

    // Collect blocked intervals from all obstacles at this band
    const blocked: Interval[] = []
    for (const obs of obstacles) {
      const intervals = getRectIntervalsForBand(
        [obs.rect],
        bandTop,
        bandBottom,
        obs.horizontalPadding,
        obs.verticalPadding,
      )
      for (const interval of intervals) blocked.push(interval)
    }

    // Carve available text slots
    const slots = carveTextLineSlots(
      { left: region.x, right: region.x + region.width },
      blocked,
    )
    if (slots.length === 0) {
      lineTop += lineHeight
      continue
    }

    // Pick the widest slot (prefer leftmost if tied)
    let slot = slots[0]!
    for (let i = 1; i < slots.length; i++) {
      const c = slots[i]!
      if (c.right - c.left > slot.right - slot.left) slot = c
    }

    const slotWidth = slot.right - slot.left
    const line = layoutNextLine(prepared, cursor, slotWidth)
    if (line === null) break

    lines.push({
      x: Math.round(slot.left),
      y: Math.round(lineTop),
      width: line.width,
      text: line.text,
    })

    cursor = line.end
    lineTop += lineHeight
  }

  // Check if there's remaining text
  let remainingText = ''
  if (cursor.segmentIndex < prepared.segments!.length) {
    const segs = prepared.segments!
    remainingText = segs.slice(cursor.segmentIndex).join('')
  } else if (cursor.graphemeIndex > 0 && cursor.segmentIndex < prepared.segments!.length) {
    const segs = prepared.segments!
    const seg = segs[cursor.segmentIndex]!
    remainingText = seg.slice(cursor.graphemeIndex) + segs.slice(cursor.segmentIndex + 1).join('')
  }

  return {
    lines,
    overflowed: remainingText.length > 0,
    remainingText,
  }
}

/**
 * Measure how many lines a text block will occupy at a given width.
 */
export function measureTextHeight(text: string, font: string, lineHeight: number, maxWidth: number): number {
  const prepared = getPrepared(text, font)
  let count = 0
  walkLineRanges(prepared, maxWidth, () => { count++ })
  return count * lineHeight
}

/**
 * Get the natural (intrinsic) width of text — the width of its longest line
 * when unconstrained.
 */
export function measureNaturalWidth(text: string, font: string): number {
  const prepared = getPrepared(text, font)
  let maxWidth = 0
  walkLineRanges(prepared, 100_000, line => {
    if (line.width > maxWidth) maxWidth = line.width
  })
  return maxWidth
}

/**
 * Get the width of a single credit/byline string.
 */
export function measureSingleLineWidth(text: string, font: string): number {
  let width = 0
  const prepared = getPrepared(text, font)
  walkLineRanges(prepared, 100_000, line => { width = line.width })
  return width
}
