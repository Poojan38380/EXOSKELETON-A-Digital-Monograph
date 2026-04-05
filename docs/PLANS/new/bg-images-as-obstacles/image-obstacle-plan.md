# Background Images as Obstacles — Pretext Plan

## Overview

Add the cleaned specimen images from the `CLEAN/` folder as full-bleed decorative background images on page spreads. Text from Pretext will flow *around* the image boundaries using polygon hull obstacles, creating a magazine-quality layout where body text wraps organically around illustration shapes.

## Source Images (13 files)

| # | File | Suggested Page | Placement |
|---|------|----------------|-----------|
| 1 | `wing.jpg` | Wings (page 2) | Bottom-right corner, partial bleed |
| 2 | `Danaus_plexippus_800x600.jpg` (Monarch butterfly) | Mimicry (page 9) | Center-right |
| 3 | `Aedes_aegypti_proboscis_800x600.jpg` (Mosquito proboscis) | Records (page 7) | Bottom-left |
| 4 | `gettyimages-1346216150-612x612.jpg` (Dragonfly) | Antennae (page 5) | Top-right, partial |
| 5 | `gettyimages-157443399-612x612.jpg` (Ant) | Numbers (page 6) | Bottom-right |
| 6 | `gettyimages-469123930-612x612.jpg` (Beetle) | Cover (page 1) | Center background, faded |
| 7 | `gettyimages-469225502-612x612.jpg` (Insect detail) | Vision/Compound Eye (page 3) | Top-left, partial |
| 8 | `cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIzLTA5L3BkbWlzY3Byb2plY3QyMC15Y2JhdG1zOTQ1NS1pbWFnZS5qcGc.webp` (Insect cluster) | Strange Behavior (page 8) | Bottom-right |
| 9 | `360_F_321038846_VKth7O14dhISRuK9WWnkclYQgBPUZ9Mu.jpg` (Insect macro) | Metamorphosis (page 4) | Right side, mid-page |
| 10 | `beetle-bug-collection-insect-illustration-260nw-2502481691.webp` (Vintage collection) | Colophon (page 11) | Bottom-center |
| 11 | `antique-insect-stag-beetle-bug-illustration-engraving-vintage-style-isolated-white-background-133996992.webp` (Stag beetle) | Insects & Humans (page 10) | Right side |
| 12 | `leg.jpg` (Insect leg detail) | Vision (page 3) | Bottom accent |
| 13 | `360_F_321038846_VKth7O14dhISRuK9WWnkclYQgBPUZ9Mu.jpg` — already mapped above | — | — |

## Phase 1: Copy Images to Public Folder

### Action
Copy all 13 images from `CLEAN/` to `public/images/bg/` with sanitized names:

```
CLEAN/wing.jpg                                  →  public/images/bg/wing-monarch.jpg
CLEAN/Danaus_plexippus_800x600.jpg              →  public/images/bg/danaus-plexippus.jpg
CLEAN/Aedes_aegypti_proboscis_800x600.jpg       →  public/images/bg/aedes-proboscis.jpg
CLEAN/gettyimages-1346216150-612x612.jpg        →  public/images/bg/dragonfly-detail.jpg
CLEAN/gettyimages-157443399-612x612.jpg         →  public/images/bg/ant-lifting.jpg
CLEAN/gettyimages-469123930-612x612.jpg         →  public/images/bg/beetle-carapace.jpg
CLEAN/gettyimages-469225502-612x612.jpg         →  public/images/bg/compound-eye.jpg
CLEAN/cHJpdmF0ZS9sci9pbWFnZXMv...55-imWdlc.webp →  public/images/bg/insect-behavior.webp
CLEAN/360_F_321038846_VKth7O14dhISRuK9WWnkclYQgBPUZ9Mu.jpg → public/images/bg/insect-macro.jpg
CLEAN/beetle-bug-collection-insect-illustration-260nw-2502481691.webp → public/images/bg/vintage-collection.webp
CLEAN/antique-insect-stag-beetle-bug-illustration-engraving-vintage-style-isolated-white-background-133996992.webp → public/images/bg/stag-beetle.webp
CLEAN/leg.jpg                                   →  public/images/bg/insect-leg.jpg
```

### Create URL Registry
Add to a new file `src/content/bg-image-urls.ts`:

```typescript
export const BG_WING_MONARCH = '/images/bg/wing-monarch.jpg'
export const BG_DANAUS_PLEXIPPUS = '/images/bg/danaus-plexippus.jpg'
export const BG_AEDES_PROBOSCIS = '/images/bg/aedes-proboscis.jpg'
// ... etc for all 13
```

## Phase 2: Integrate into PageSpread as Obstacles

### Architecture: How Pretext Dynamic Layout Works (Reference)

The `dynamic-layout.ts` demo shows the pattern:

1. **Preload**: `getWrapHull(imageSrc, { smoothRadius, mode })` rasterizes the image, extracts alpha channel, traces the polygon hull
2. **Transform**: `transformWrapPoints(hull, rect, rotation)` scales/rotates the hull to match the image's layout position
3. **Obstacle**: The transformed points become a `BandObstacle` of `kind: 'polygon'`
4. **Layout**: `layoutColumn()` routes text around polygon intervals at each band

### Adaptation for PageSpread

The existing `PageSpread` already supports rectangular obstacles (`BandObstacle` with `rect`). We need to extend this to support polygon obstacles.

#### Step 2a: Update `spread-layout.ts` — Add Polygon Support

The current `layoutText` function only accepts `BandObstacle` (which is already compatible — our codebase uses `Rect`-based obstacles). We need to add polygon hull support.

**File**: `src/components/spread-layout.ts`

The `BandObstacle` type already exists in our `wrap-geometry.ts`:

```typescript
export type BandObstacle =
  | {
      kind: 'polygon'
      points: Point[]
      horizontalPadding: number
      verticalPadding: number
    }
  | {
      kind: 'rects'
      rects: Rect[]
      horizontalPadding: number
      verticalPadding: number
    }
```

The `getObstacleIntervals` function needs to handle both kinds — reference the pattern from `dynamic-layout.ts`:

```typescript
function getObstacleIntervals(obstacle: BandObstacle, bandTop: number, bandBottom: number): Interval[] {
  switch (obstacle.kind) {
    case 'polygon': {
      return getPolygonIntervalForBand(
        obstacle.points,
        bandTop,
        bandBottom,
        obstacle.horizontalPadding,
        obstacle.verticalPadding,
      ) === null ? [] : [getPolygonIntervalForBand(...)!]
    }
    case 'rects':
      return getRectIntervalsForBand(
        obstacle.rects,
        bandTop,
        bandBottom,
        obstacle.horizontalPadding,
        obstacle.verticalPadding,
      )
  }
}
```

#### Step 2b: Create `useImageHull` Hook

**File**: `src/hooks/useImageHull.ts`

A React hook that preloads an image and extracts its wrap hull, exactly like the `dynamic-layout.ts` preload pattern:

```typescript
import { useState, useEffect } from 'react'
import { getWrapHull, type Point } from '../layout-engine/wrap-geometry'

interface UseImageHullResult {
  /** Scaled hull points in layout coordinates */
  hull: Point[] | null
  /** Natural image dimensions */
  naturalSize: { width: number; height: number } | null
}

export function useImageHull(src: string | null): UseImageHullResult {
  const [result, setResult] = useState<UseImageHullResult>({
    hull: null,
    naturalSize: null,
  })

  useEffect(() => {
    if (!src) {
      setResult({ hull: null, naturalSize: null })
      return
    }

    let cancelled = false
    ;(async () => {
      // Extract hull from image alpha channel
      const hull = await getWrapHull(src, { smoothRadius: 8, mode: 'mean' })
      if (!cancelled) {
        // Also load the image to get natural dimensions
        const img = new Image()
        img.onload = () => {
          if (!cancelled) {
            setResult({
              hull,
              naturalSize: { width: img.naturalWidth, height: img.naturalHeight },
            })
          }
        }
        img.onerror = () => {
          if (!cancelled) {
            setResult({ hull: null, naturalSize: null })
          }
        }
        img.src = src
      }
    })()

    return () => { cancelled = true }
  }, [src])

  return result
}
```

#### Step 2c: Update `PageSpread` — Add BG Image Prop

**File**: `src/components/PageSpread.tsx`

Add a new optional prop:

```typescript
export interface SpreadConfig {
  // ... existing props
  /** Decorative background image that text flows around as an obstacle */
  bgImage?: {
    src: string
    /** Where to place the image within the spread */
    position: 'top-right' | 'bottom-right' | 'bottom-left' | 'center-right' | 'top-left'
    /** Scale relative to container width (0.0–1.0). Default: 0.35 */
    scale?: number
    /** Opacity of the image. Default: 0.12 */
    opacity?: number
    /** Additional polygon padding in body line heights. Default: 0.8 */
    obstaclePadding?: number
  }
}
```

Inside `computeLayout`:

```typescript
const { bgImage } = config
const bgHull = useImageHull(bgImage?.src ?? null)

// ... inside computeLayout, after contentWidth is computed:

let bgRect: Rect | null = null
let bgObstacle: BandObstacle | null = null

if (bgImage && bgHull.hull && bgHull.naturalSize) {
  const imgScale = bgImage.scale ?? 0.35
  const imgWidth = Math.round(contentWidth * imgScale)
  const aspect = bgHull.naturalSize.height / bgHull.naturalSize.width
  const imgHeight = Math.round(imgWidth * aspect)

  // Position the image
  switch (bgImage.position) {
    case 'top-right':
      bgRect = { x: offsetX + contentWidth - imgWidth, y: copyTop, width: imgWidth, height: imgHeight }
      break
    case 'bottom-right':
      // Position below initial text area, will be computed after body layout
      break
    case 'bottom-left':
      break
    case 'center-right':
      bgRect = { x: offsetX + contentWidth - imgWidth, y: copyTop + BODY_LINE_HEIGHT * 4, width: imgWidth, height: imgHeight }
      break
    case 'top-left':
      bgRect = { x: offsetX, y: copyTop, width: imgWidth, height: imgHeight }
      break
  }

  if (bgRect) {
    // Transform hull points to layout coordinates
    const transformedPoints = transformWrapPoints(
      bgHull.hull,
      bgRect,
      0 // no rotation
    )

    bgObstacle = {
      kind: 'polygon',
      points: transformedPoints,
      horizontalPadding: Math.round(BODY_LINE_HEIGHT * (bgImage.obstaclePadding ?? 0.8)),
      verticalPadding: Math.round(BODY_LINE_HEIGHT * 0.3),
    }
  }
}

// Add bgObstacle to figureObstacles array
if (bgObstacle) {
  figureObstacles.push(bgObstacle)
}
```

#### Step 2d: Render the BG Image

In the `PageSpread` render function, add the bg image as an absolutely-positioned element behind the text:

```tsx
{/* Background decorative image — text flows around it */}
{bgImage && bgRect && (
  <img
    src={bgImage.src}
    alt=""
    aria-hidden="true"
    style={{
      position: 'absolute',
      left: `${bgRect.x}px`,
      top: `${bgRect.y}px`,
      width: `${bgRect.width}px`,
      height: `${bgRect.height}px`,
      objectFit: 'contain',
      objectPosition: 'center',
      opacity: bgImage.opacity ?? 0.12,
      pointerEvents: 'none',
      userSelect: 'none',
      zIndex: 0,
      filter: 'saturate(0.6) contrast(1.05)',
    }}
    draggable={false}
  />
)}
```

## Phase 3: Add BG Images to Page Configs

Each page's spread config gets a `bgImage` entry. Example:

```typescript
// src/content/spread-configs.ts (or wherever configs are defined)

export const WINGS_CONFIG: SpreadConfig = {
  title: 'Wings',
  credit: '...',
  body: WINGS_BODY_TEXT,
  bgImage: {
    src: BG_WING_MONARCH,
    position: 'bottom-right',
    scale: 0.30,
    opacity: 0.10,
  },
}
```

### Per-Page Assignments

| Page | Image | Position | Scale | Opacity |
|------|-------|----------|-------|---------|
| Wings | `wing-monarch.jpg` | `bottom-right` | 0.30 | 0.10 |
| Vision | `compound-eye.jpg` + `insect-leg.jpg` | `top-left` + `bottom-left` | 0.25 + 0.15 | 0.08 + 0.06 |
| Metamorphosis | `insect-macro.jpg` | `center-right` | 0.35 | 0.10 |
| Antennae | `dragonfly-detail.jpg` | `top-right` | 0.25 | 0.08 |
| Numbers | `ant-lifting.jpg` | `bottom-right` | 0.20 | 0.08 |
| Records | `aedes-proboscis.jpg` | `bottom-left` | 0.28 | 0.10 |
| Behavior | `insect-behavior.webp` | `bottom-right` | 0.30 | 0.10 |
| Mimicry | `danaus-plexippus.jpg` | `center-right` | 0.32 | 0.10 |
| Humans | `stag-beetle.webp` | `center-right` | 0.28 | 0.10 |
| Colophon | `vintage-collection.webp` | `bottom-center` | 0.25 | 0.08 |
| Cover | `beetle-carapace.jpg` | Full background, no obstacle | — | 0.06 (pure decoration, no text routing) |

## Phase 4: Implementation Order

1. **Copy images** — `CLEAN/*` → `public/images/bg/*` (sanitized names)
2. **Create `src/content/bg-image-urls.ts`** — URL registry
3. **Verify `wrap-geometry.ts`** exports `getWrapHull`, `transformWrapPoints`, `getPolygonIntervalForBand`, `Point` — these already exist in the pretext codebase
4. **Update `spread-layout.ts`** — Add `getObstacleIntervals` switch for polygon vs rects
5. **Create `useImageHull` hook** — `src/hooks/useImageHull.ts`
6. **Update `PageSpread`** — Accept `bgImage` in config, compute obstacle, render image
7. **Update page configs** — Add `bgImage` to each spread config
8. **Test** — Resize browser, verify text reflows around image hulls

## Technical Notes

### Dependencies from Pretext

The following functions from `wrap-geometry.ts` are needed and already exist in our codebase:

```typescript
// From layout-engine/wrap-geometry.ts (already present)
export function getWrapHull(src: string, opts: { smoothRadius: number; mode: 'mean' | 'convex' }): Promise<Point[]>
export function transformWrapPoints(points: Point[], rect: Rect, rotation: number): Point[]
export function getPolygonIntervalForBand(points: Point[], bandTop: number, bandBottom: number, hPad: number, vPad: number): Interval | null
```

### Performance Considerations

- **Hull extraction** is async and cached — only runs once per image source
- **`getWrapHull`** is the expensive operation (canvas rasterization + alpha tracing) — results should be cached
- **Transform** is cheap (matrix multiply per point)
- **Per-band interval calculation** runs every frame during resize — polygon is more expensive than rects but acceptable for 1-2 images per spread
- **Preload strategy**: Hull extraction should start on page mount, not wait for layout. Use `useImageHull` hook which preloads early.

### Fallback Behavior

- If hull extraction fails or image fails to load, the bg image simply doesn't render and no obstacle is added — text flows normally
- On slow connections, images load progressively; layout reflows when hull becomes available (via the `useImageHull` state change triggering a `computeLayout` re-run)

## Files to Create

1. `public/images/bg/wing-monarch.jpg` (and 12 others)
2. `src/content/bg-image-urls.ts`
3. `src/hooks/useImageHull.ts`

## Files to Modify

1. `src/components/spread-layout.ts` — Add polygon obstacle support
2. `src/components/PageSpread.tsx` — Accept `bgImage` prop, compute + render
3. `src/components/pages/*.tsx` — Add `bgImage` to each page's config
4. `package.json` — No new dependencies needed

---

*Created: 5 April 2026*
*Status: Plan Ready for Implementation*
