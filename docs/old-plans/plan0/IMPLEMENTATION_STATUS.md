# EXOSKELETON — Implementation Status

> **Project:** glypdfress — A Digital Entomology Monograph  
> **Started:** April 4, 2026  
> **Status:** In Progress

---

## Phase 1: Content & Typography Foundation ✅ COMPLETE

| Item | Status | Notes |
|------|--------|-------|
| Entomology content (6 pages, ~2,800 words) | ✅ | `src/content/entomology-text.ts` — all essays, pull quotes, page metadata |
| Google Fonts imported | ✅ | Playfair Display, EB Garamond, Cormorant Garamond Italic, Source Code Pro |
| CSS color variables | ✅ | parchment, ink, iron-gall, ochre, verdigris, carmine, rule, marginalia |
| Drop cap styles | ✅ | `.drop-cap` — 5.2rem, Playfair Display, float-left |
| Ornamental rule dividers | ✅ | `.ornamental-rule` with diamond ornament, `.ornamental-rule--small` |
| Pull quote styles | ✅ | `.pull-quote` — ochre left border, decorative quotation mark |
| Page title / subtitle / credit styles | ✅ | `.page-title`, `.page-subtitle`, `.page-credit` |
| Parchment texture overlay | ✅ | SVG noise filter, `mix-blend-mode: multiply` |
| TypeScript build passes | ✅ | `npx tsc -b` — clean |
| Production build passes | ✅ | `npx vite build` — clean |

---

## Phase 2: Book Shell & Page State ✅ COMPLETE

| Item | Status | Notes |
|------|--------|-------|
| BookShell component | ✅ | `src/components/BookShell.tsx` — page state, transitions |
| Page turn animation | ✅ | CSS keyframes: fade + scale, 400ms, cubic-bezier |
| Keyboard navigation | ✅ | Arrow keys, Page Up/Down, Home, End |
| Touch swipe detection | ✅ | 60px threshold, horizontal > vertical check |
| NavigationRail component | ✅ | `src/components/NavigationRail.tsx` — collapsible spine nav |
| 6 Page components | ✅ | Cover, Wings, CompoundEye, Metamorphosis, Antennae, Colophon |
| Book layout styles | ✅ | `src/styles/book.css` — page spread, cover, responsive |
| Navigation styles | ✅ | `src/styles/navigation.css` — rail, active indicator, transitions |
| App.tsx wiring | ✅ | All components connected, page routing via `window.__bookNav` |
| Colophon TOC | ✅ | Roman numerals + page labels |
| TypeScript build passes | ✅ | Clean |
| Production build passes | ✅ | Clean |

---

## Phase 3: Navigation Refinement & Image Integration ✅ COMPLETE

| Item | Status | Notes |
|------|--------|-------|
| Generative art thumbnails in nav rail | ✅ | Canvas-based, 5 unique patterns (mandala, flow lines, hex grid, spiral, L-system) |
| Page image assets copied | ✅ | 5 images in `public/images/` with clean filenames |
| Cover page with hero image | ✅ | Jewel Beetle as full-bleed background with radial gradient overlay |
| Wings page with figure | ✅ | Dragonfly wing, floated right, 45% width |
| Compound Eye page with figure | ✅ | Horsefly eye, full-width, max-height 360px |
| Metamorphosis page with figure | ✅ | Butterfly triptych, full-width banner |
| Antennae page with figure | ✅ | Saturniid moth, floated left, 45% width |
| Figure styles (float, shadow, caption) | ✅ | `.page-figure--right`, `--left`, `--full`, `--wide` |
| Mobile bottom navigation bar | ✅ | `MobileNav` component — prev/next buttons, page label |
| Mobile responsive layout | ✅ | Nav rail hidden < 768px, bottom bar shown, content padding |
| Image URL manifest | ✅ | `src/content/image-urls.ts` — all 5 paths |
| TypeScript build passes | ✅ | Clean |
| Production build passes | ✅ | Clean |

---

## Phase 4: Page Spread Layout (Pretext Engine) ✅ COMPLETE

| Item | Status | Notes |
|------|--------|-------|
| PageSpread component | ✅ | `src/components/PageSpread.tsx` — full Pretext-based layout |
| spread-layout module | ✅ | `src/components/spread-layout.ts` — layoutText, measureNaturalWidth |
| Obstacle routing for figures | ✅ | Text flows around images via `getRectIntervalsForBand` + `carveTextLineSlots` |
| Two-column text layout | ✅ | Body text fills available width after figure obstacles |
| Figure geometry (right/left/full/wide) | ✅ | Four placement modes, computed responsively |
| Pull quote positioning | ✅ | Placed as obstacle, text routes around it |
| Title layout by Pretext | ✅ | Title measured and positioned by engine, not DOM |
| Responsive fallback | ✅ | Single column < 768px, narrower gutters |
| Page number footer | ✅ | Roman numeral, centered at bottom |
| Spread line styles | ✅ | `.spread-line--title`, `--body`, `--pullquote`, `--credit`, hover accent |
| All 4 content pages use PageSpread | ✅ | Wings, CompoundEye, Metamorphosis, Antennae |
| TypeScript build passes | ✅ | Clean |
| Production build passes | ✅ | Clean |

---

## Phase 5: Generative Art System (p5.js) ⏳ PENDING

| Item | Status | Notes |
|------|--------|-------|
| p5.js wrapper component | ⏳ | `GenerativeArt.tsx` — lifecycle, resize handling |
| Elytra Mandala (Cover) | ⏳ | Concentric beetle wing pattern, 400×400 |
| Wing Venation (Page 1) | ⏳ | Flow-field vein tracing, 350×450 |
| Compound Eye (Page 2) | ⏳ | Hex grid + moiré, 300×300 |
| Metamorphosis Triptych (Page 3) | ⏳ | 3× 200×200 canvases |
| Antennal L-System (Page 4) | ⏳ | L-system branching, 250×400 |
| Seed controls | ⏳ | Reproducible output per page |
| Lazy loading | ⏳ | Only render visible page's canvas |

---

## Phase 6: Individual Page Polish ⏳ PENDING

| Item | Status | Notes |
|------|--------|-------|
| Each page uses PageSpread | ⏳ | Replace current simple layout |
| Generative art embedded per page | ⏳ | Beside or within text columns |
| Print stylesheet | ⏳ | Hide nav, show all content |
| Favicon | ⏳ | Beetle icon or elytra pattern |
| Meta tags (OG, description) | ⏳ | Social sharing |

---

## Phase 7: App Wiring & Polish ⏳ PENDING

| Item | Status | Notes |
|------|--------|-------|
| Lazy loading pages | ⏳ | `React.lazy` + `Suspense` |
| Loading states | ⏳ | Font + p5.js initialization |
| Smooth scroll-to-top on page change | ⏳ | After navigation |
| Performance optimization | ⏳ | Memoize content, unmount p5 on nav |
| Error boundaries | ⏳ | Graceful fallbacks |

---

## Phase 8: Testing & Deployment ⏳ PENDING

| Item | Status | Notes |
|------|--------|-------|
| All 6 pages render | ⏳ | Manual verification |
| Navigation works all modes | ⏳ | Click, keyboard, touch, mobile |
| Page turn animations smooth | ⏳ | Visual check |
| Responsive at all breakpoints | ⏳ | Desktop, tablet, mobile |
| Final production build | ⏳ | `npm run build` — clean |
| Preview | ⏳ | `npm run preview` — functional |

---

## Build Status

| Check | Result |
|-------|--------|
| `npx tsc -b` | ✅ Pass |
| `npx vite build` | ✅ Pass |
| Bundle size (JS main) | ~268 kB (88 kB gzipped) |
| Bundle size (CSS) | 13.5 kB (3.7 kB gzipped) |

---

## Phase 6: New Pages & Image Integration ✅ COMPLETE

| Item | Status | Notes |
|------|--------|-------|
| 13 new images copied to public/images/ | ✅ | Clean filenames |
| Image URL manifest updated | ✅ | 18 total images in `image-urls.ts` |
| "By the Numbers" page (VI) | ✅ | Ant illustration, facts & figures |
| "Records & Extremes" page (VII) | ✅ | Termite queen image |
| "Strange Behavior" page (VIII) | ✅ | Jumping bean image |
| "Mimicry & Defense" page (IX) | ✅ | Hawk moth caterpillar image |
| "Insects & Humans" page (X) | ✅ | Blow fly image |
| Colophon updated (XI) | ✅ | Now page 11, TOC lists all 11 pages |
| PAGES metadata updated | ✅ | 11 pages, Roman numerals I–XI |
| TypeScript build passes | ✅ | Clean |
| Production build passes | ✅ | Clean |

---

## Butterfly — Interactive Element on "The Architecture of Wings" ✅ COMPLETE

Planned in `butterfly-wings-plan.md` (5 phases). All phases shipped.

| Phase | Item | Status | Notes |
|-------|------|--------|-------|
| 1 | Anchor positions from PageSpread | ✅ | `onAnchorPositions` callback; clean layout (no butterfly) used so anchor coords are never contaminated by displacement feedback loop |
| 2 | Bidirectional navigation | ✅ | Phase enum `at-start / flying-forward / flying-backward / at-end`; click toggles direction; re-snaps on resize |
| 3 | Live Pretext text displacement | ✅ | `BandObstacle` exported from `spread-layout.ts`; butterfly added as live obstacle; separate clean+live layout passes; `butterfly-text-line` CSS transitions body lines; edge-ramp on `horizontalPadding` |
| 4 | Inline SVG with conditional wing beats | ✅ | Switched from `<img>` to inline SVG so `<animate>` elements can be conditionally rendered — wings beat only when flying, completely still when resting |
| 5 | Visual polish | ✅ | Catmull-Rom spline path through 5 seeded waypoints; flutter easing; gentle settle + breathing-pulse animations; no-scrollbar overflow clamp |

**Key decisions:**
- Two layout passes per frame when butterfly is present: one without butterfly (anchor positions), one with (rendered body lines). Prevents the chase feedback loop where the butterfly displaced its own anchor word.
- `lastWord` anchor = right edge of last body line (`last.x + last.width`), giving a natural diagonal from top-left ("To") to bottom-right ("alive.").
- Butterfly start: right edge flush with left edge of "To". Butterfly end: left edge flush with right edge of "alive."
- Wing beat `dur` = 0.5 s with `calcMode="spline"` for organic feel; 13 000 ms total flight duration.
- `overflow: hidden` on WingsPage wrapper prevents waypoints that wander outside content from creating a scrollbar.

---

## Bug Fixes Applied

| Bug | Fix |
|-----|-----|
| Pull quotes appearing randomly | Pulled from Pretext line positioning; rendered as standard blockquote with exact obstacle geometry |
| Pull quote overlapping body text | Increased obstacle height with safety margin (32px), added bottom border separator |
| Pull quote behind figure on Wings page | Pull quote Y-position now placed below figure bottom edge + 24px gap |
| Colophon page had no proper layout | Converted to use PageSpread with `children` prop for TOC |
| Nav rail index centered instead of top-aligned | Changed `justify-content: center` → `flex-start` |
| Nav rail spine visible when collapsed | Spine opacity transitions with expand state |

---

## File Inventory

```
glypdfress/
├── src/
│   ├── layout-engine/          ✅ Pretext engine (ported)
│   ├── content/
│   │   ├── entomology-text.ts  ✅ All page content
│   │   └── image-urls.ts       ✅ Image path manifest
│   ├── components/
│   │   ├── BookShell.tsx       ✅ Page state + keyboard/touch nav
│   │   ├── NavigationRail.tsx  ✅ Collapsible nav + thumbnails
│   │   ├── MobileNav.tsx       ✅ Mobile bottom nav
│   │   ├── PageSpread.tsx      ✅ Pretext-powered magazine layout
│   │   ├── spread-layout.ts    ✅ Layout engine (layoutText, measure*)
│   │   ├── HomePage.tsx        ✅ (legacy — dynamic layout demo)
│   │   └── pages/
│   │       ├── CoverPage.tsx   ✅ With hero image (not PageSpread)
│   │       ├── WingsPage.tsx   ✅ PageSpread, figure floated right
│   │       ├── CompoundEyePage.tsx ✅ PageSpread, full-width figure
│   │       ├── MetamorphosisPage.tsx ✅ PageSpread, wide figure
│   │       ├── AntennaePage.tsx ✅ PageSpread, figure floated left
│   │       └── ColophonPage.tsx ✅ With TOC (not PageSpread)
│   ├── styles/
│   │   ├── book.css            ✅ Layout, figures, spread lines, responsive
│   │   └── navigation.css      ✅ Nav rail + mobile nav
│   ├── App.tsx                 ✅ Full wiring
│   ├── main.tsx                ✅ Entry point
│   └── index.css               ✅ Typography, colors, globals
├── public/images/              ✅ 5 generated images
├── assets/                     ✅ Source images (original filenames)
├── index.html                  ✅ With Google Fonts
├── PLAN.md                     ✅ 8-phase implementation plan
└── IMPLEMENTATION_STATUS.md    ✅ This file
```
