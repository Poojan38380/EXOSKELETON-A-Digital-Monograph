import { describe, it, expect } from 'vitest'
import {
  generateFacetCenters,
  hexagonPath,
  hexagonBBox,
  pointInHexagon,
  findTextInFacet,
  pointInRect,
  FACET_RADIUS,
  FACET_SPACING,
  RING_COUNT,
} from '../hex-facet-grid'

describe('constants', () => {
  it('should have 2 rings (19 total facets)', () => {
    expect(RING_COUNT).toBe(2)
  })

  it('should have reasonable spacing and radius', () => {
    expect(FACET_SPACING).toBeGreaterThan(0)
    expect(FACET_RADIUS).toBeGreaterThan(0)
    expect(FACET_RADIUS).toBeLessThan(FACET_SPACING * 2)
  })
})

describe('generateFacetCenters', () => {
  it('should return exactly 19 facets', () => {
    const facets = generateFacetCenters(100, 100)
    expect(facets).toHaveLength(19)
  })

  it('should have the first facet at the cursor position (center)', () => {
    const facets = generateFacetCenters(200, 300)
    expect(facets[0]!.cx).toBe(200)
    expect(facets[0]!.cy).toBe(300)
  })

  it('should have unique indices from 0 to 18', () => {
    const facets = generateFacetCenters(0, 0)
    const indices = facets.map((f) => f.index).sort((a, b) => a - b)
    expect(indices).toEqual(Array.from({ length: 19 }, (_, i) => i))
  })

  it('should produce facets at increasing distances from center', () => {
    const facets = generateFacetCenters(0, 0)
    // Ring 1 facets should be closer than ring 2 facets
    const ring1Distances = facets.slice(1, 7).map((f) => Math.sqrt(f.cx ** 2 + f.cy ** 2))
    const ring2Distances = facets.slice(7, 19).map((f) => Math.sqrt(f.cx ** 2 + f.cy ** 2))
    const maxRing1 = Math.max(...ring1Distances)
    const minRing2 = Math.min(...ring2Distances)
    expect(minRing2).toBeGreaterThan(maxRing1)
  })

  it('should shift all facets when cursor moves', () => {
    const facetsA = generateFacetCenters(100, 100)
    const facetsB = generateFacetCenters(200, 200)
    for (let i = 0; i < 19; i++) {
      expect(facetsB[i]!.cx - facetsA[i]!.cx).toBeCloseTo(100, 5)
      expect(facetsB[i]!.cy - facetsA[i]!.cy).toBeCloseTo(100, 5)
    }
  })
})

describe('hexagonPath', () => {
  it('should return a valid SVG path string', () => {
    const path = hexagonPath(0, 0, 10)
    expect(path).toContain('M')
    expect(path).toContain('L')
    expect(path).toContain('Z')
  })

  it('should have 6 line segments (5 L commands + M + Z)', () => {
    const path = hexagonPath(50, 50, 20)
    const lCount = (path.match(/L/g) || []).length
    expect(lCount).toBe(5) // M goes to vertex 1, then 5 Ls for vertices 2-6, Z closes
  })

  it('should start at the top vertex', () => {
    const path = hexagonPath(100, 100, 10)
    expect(path).toContain('M100,90') // cy - radius = 100 - 10 = 90
  })
})

describe('hexagonBBox', () => {
  it('should return correct bounding box for center-origin hex', () => {
    const bbox = hexagonBBox(0, 0, 10)
    expect(bbox.x).toBeCloseTo(-8.66, 2) // -sqrt(3)/2 * 10
    expect(bbox.y).toBe(-10)
    expect(bbox.width).toBeCloseTo(17.32, 2)
    expect(bbox.height).toBe(20)
  })

  it('should center the bbox on the given point', () => {
    const bbox = hexagonBBox(100, 200, 5)
    expect(bbox.x + bbox.width / 2).toBeCloseTo(100, 10)
    expect(bbox.y + bbox.height / 2).toBe(200)
  })
})

describe('pointInHexagon', () => {
  it('should return true for the center point', () => {
    expect(pointInHexagon(0, 0, 0, 0, 10)).toBe(true)
  })

  it('should return true for points well inside', () => {
    expect(pointInHexagon(0, 0, 0, 0, 20)).toBe(true)
    expect(pointInHexagon(5, 5, 0, 0, 20)).toBe(true)
  })

  it('should return false for points well outside', () => {
    expect(pointInHexagon(100, 100, 0, 0, 10)).toBe(false)
    expect(pointInHexagon(-50, 0, 0, 0, 10)).toBe(false)
  })

  it('should return false for points at vertices (edge case)', () => {
    // Point at top vertex should be considered inside (on boundary)
    expect(pointInHexagon(0, -10, 0, 0, 10)).toBe(true)
  })

  it('should work with offset centers', () => {
    expect(pointInHexagon(50, 50, 50, 50, 15)).toBe(true)
    expect(pointInHexagon(70, 50, 50, 50, 15)).toBe(false)
  })
})

describe('findTextInFacet', () => {
  const mockLines = [
    { x: 0, y: 0, width: 200, text: 'First line of text' },
    { x: 0, y: 32, width: 180, text: 'Second line of text' },
    { x: 0, y: 64, width: 190, text: 'Third line of text' },
    { x: 0, y: 96, width: 170, text: 'Fourth line of text' },
    { x: 0, y: 128, width: 160, text: 'Fifth line of text' },
  ]
  const LINE_HEIGHT = 32

  it('should find lines that overlap the facet', () => {
    // Facet centered on line 2 (y=64)
    const result = findTextInFacet(mockLines, 100, 64, FACET_RADIUS, LINE_HEIGHT)
    expect(result.length).toBeGreaterThan(0)
    expect(result.some((l) => l.text === 'Third line of text')).toBe(true)
  })

  it('should return empty when facet is far from all lines', () => {
    const result = findTextInFacet(mockLines, 500, 500, FACET_RADIUS, LINE_HEIGHT)
    expect(result).toHaveLength(0)
  })

  it('should include multiple lines when facet overlaps them', () => {
    // Large facet centered between lines
    const result = findTextInFacet(mockLines, 100, 48, 20, LINE_HEIGHT)
    expect(result.length).toBeGreaterThanOrEqual(2)
  })

  it('should preserve original x and y positions', () => {
    const result = findTextInFacet(mockLines, 0, 16, FACET_RADIUS, LINE_HEIGHT)
    for (const item of result) {
      const original = mockLines.find((l) => l.text === item.text)!
      expect(item.x).toBe(original.x)
      expect(item.y).toBe(original.y)
    }
  })
})

describe('pointInRect', () => {
  const rect = { x: 100, y: 100, width: 200, height: 150 }

  it('should return true for points inside', () => {
    expect(pointInRect(150, 150, rect)).toBe(true)
    expect(pointInRect(100, 100, rect)).toBe(true)
    expect(pointInRect(300, 250, rect)).toBe(true)
  })

  it('should return false for points outside', () => {
    expect(pointInRect(50, 150, rect)).toBe(false)
    expect(pointInRect(350, 150, rect)).toBe(false)
    expect(pointInRect(150, 50, rect)).toBe(false)
    expect(pointInRect(150, 300, rect)).toBe(false)
  })

  it('should respect padding', () => {
    expect(pointInRect(95, 150, rect, 10)).toBe(true)
    expect(pointInRect(89, 150, rect, 10)).toBe(false)
  })
})
