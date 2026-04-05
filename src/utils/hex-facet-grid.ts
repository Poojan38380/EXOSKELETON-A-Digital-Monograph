// ── Hexagonal Facet Grid for Compound Eye Cursor ──
// Pure math: hex grid generation, overlap detection, SVG clip paths.
// Zero dependencies on React or the DOM. Fully testable.

import type { Rect } from '../layout-engine/wrap-geometry'

export interface Point {
  x: number
  y: number
}

export interface Facet {
  cx: number
  cy: number
  index: number
}

export interface FacetText {
  x: number
  y: number
  text: string
}

// Hex grid configuration
const RING_COUNT = 3 // center + 3 rings = 37 facets
const FACET_SPACING = 18 // px between adjacent facet centers (axial distance)
const FACET_RADIUS = 21.6 // circumradius — increased by 20% for larger facets
const SQRT3 = Math.sqrt(3)

// Pre-computed axial coordinates for 37 facets (ring 0 + 1 + 2 + 3)
// Using cube-coordinate-derived axial (q, r) pairs
const AXIAL_COORDS: [number, number][] = [
  // Ring 0 — center
  [0, 0],
  // Ring 1 — 6 neighbors
  [1, 0],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [0, -1],
  [1, -1],
  // Ring 2 — 12 neighbors
  [2, 0],
  [1, 1],
  [0, 2],
  [-1, 2],
  [-2, 2],
  [-2, 1],
  [-2, 0],
  [-1, -1],
  [0, -2],
  [1, -2],
  [2, -2],
  [2, -1],
  // Ring 3 — 18 neighbors
  [3, 0],
  [2, 1],
  [1, 2],
  [0, 3],
  [-1, 3],
  [-2, 3],
  [-3, 3],
  [-3, 2],
  [-3, 1],
  [-3, 0],
  [-2, -1],
  [-1, -2],
  [0, -3],
  [1, -3],
  [2, -3],
  [3, -3],
  [3, -2],
  [3, -1],
]

// Convert axial (q, r) to pixel coords for pointy-topped hex layout
function axialToPixel(q: number, r: number): Point {
  return {
    x: FACET_SPACING * (SQRT3 * q + (SQRT3 / 2) * r),
    y: FACET_SPACING * (1.5 * r),
  }
}

/**
 * Generate 19 facet centers around the cursor position.
 */
export function generateFacetCenters(cursorX: number, cursorY: number): Facet[] {
  return AXIAL_COORDS.map(([q, r], i) => {
    const offset = axialToPixel(q, r)
    return {
      cx: cursorX + offset.x,
      cy: cursorY + offset.y,
      index: i,
    }
  })
}

/**
 * SVG path `d` string for a pointy-topped regular hexagon.
 */
export function hexagonPath(cx: number, cy: number, radius: number): string {
  const cos30 = SQRT3 / 2 // ≈ 0.866
  const sin30 = 0.5
  const r = radius
  return (
    `M${cx},${cy - r}` +
    `L${cx + r * cos30},${cy - r * sin30}` +
    `L${cx + r * cos30},${cy + r * sin30}` +
    `L${cx},${cy + r}` +
    `L${cx - r * cos30},${cy + r * sin30}` +
    `L${cx - r * cos30},${cy - r * sin30}` +
    `Z`
  )
}

/**
 * Axis-aligned bounding box of a pointy-topped hexagon.
 */
export function hexagonBBox(cx: number, cy: number, radius: number): Rect {
  const halfW = radius * (SQRT3 / 2)
  return {
    x: cx - halfW,
    y: cy - radius,
    width: halfW * 2,
    height: radius * 2,
  }
}

/**
 * Point-in-convex-polygon test for a pointy-topped regular hexagon.
 * Uses cross-product sign consistency.
 */
export function pointInHexagon(px: number, py: number, cx: number, cy: number, radius: number): boolean {
  const cos30 = SQRT3 / 2
  const sin30 = 0.5
  const r = radius

  // Hexagon vertices (pointy-topped, clockwise from top)
  const verts: Point[] = [
    { x: cx, y: cy - r },
    { x: cx + r * cos30, y: cy - r * sin30 },
    { x: cx + r * cos30, y: cy + r * sin30 },
    { x: cx, y: cy + r },
    { x: cx - r * cos30, y: cy + r * sin30 },
    { x: cx - r * cos30, y: cy - r * sin30 },
  ]

  let sign = 0
  for (let i = 0; i < 6; i++) {
    const a = verts[i]!
    const b = verts[(i + 1) % 6]!
    const cross = (b.x - a.x) * (py - a.y) - (b.y - a.y) * (px - a.x)
    if (cross !== 0) {
      if (sign === 0) {
        sign = cross > 0 ? 1 : -1
      } else if ((cross > 0 ? 1 : -1) !== sign) {
        return false
      }
    }
  }
  return true
}

/**
 * Find all text lines whose bounding box overlaps the hexagonal facet.
 * Uses AABB culling first, then includes the full line text
 * (SVG clipPath handles the actual hexagonal clipping at render time).
 */
export function findTextInFacet(
  lines: { x: number; y: number; width: number; text: string }[],
  facetCx: number,
  facetCy: number,
  facetRadius: number,
  lineHeight: number,
): FacetText[] {
  const bbox = hexagonBBox(facetCx, facetCy, facetRadius)
  const result: FacetText[] = []

  for (const line of lines) {
    // Line AABB
    const lineLeft = line.x
    const lineTop = line.y
    const lineRight = line.x + line.width
    const lineBottom = line.y + lineHeight

    // AABB overlap test
    if (
      lineRight < bbox.x ||
      lineLeft > bbox.x + bbox.width ||
      lineBottom < bbox.y ||
      lineTop > bbox.y + bbox.height
    ) {
      continue
    }

    result.push({ x: line.x, y: line.y, text: line.text })
  }

  return result
}

/**
 * Check if a point is inside a figure rect (with optional padding).
 * Used to disable the cursor when hovering over the figure image.
 */
export function pointInRect(
  px: number,
  py: number,
  rect: { x: number; y: number; width: number; height: number },
  padding = 0,
): boolean {
  return (
    px >= rect.x - padding &&
    px <= rect.x + rect.width + padding &&
    py >= rect.y - padding &&
    py <= rect.y + rect.height + padding
  )
}

export { FACET_RADIUS, FACET_SPACING, RING_COUNT }
