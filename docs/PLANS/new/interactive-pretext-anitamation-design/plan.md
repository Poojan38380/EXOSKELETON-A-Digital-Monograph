# Plan: Interactive Canvas Pages — EXOSKELETON

> Source PRD: `docs/PLANS/new/interactive-pretext-anitamation-design/prd.md`

## Architectural decisions

Durable decisions that apply across all phases:

- **Routing**: Index-based page carousel via `window.__bookNav.navigateTo(pageIndex)`. No router library. Pages are in `PAGE_COMPONENTS` array in `App.tsx`.
- **Page component patterns**: Three existing patterns — (A) Simple Spread wrapping `PageSpread`, (B) Spread with Butterfly obstacle (WingsPage only), (C) Custom layout (CoverPage). New interactive pages will extend Pattern A or create Pattern D (fully custom, like NumbersPage).
- **Pretext layout engine**: `PageSpread` uses `spread-layout.ts` which bridges Pretext (`src/layout-engine/`) with React. Key functions: `layoutText()`, `layoutWithLines()`, `prepareWithSegments()`. Text renders as absolutely-positioned `<span>` elements.
- **BandObstacle type**: `{ rect: Rect; horizontalPadding: number; verticalPadding: number }` — used by Wings butterfly to route text around it.
- **Colour palette**: Ink `#2c2418`, Parchment `#e8dcc8`, Ochre/amber `#c4963a`, Verdigris green `#4a8c7e`, Carmine `#9b2335`.
- **Page-specific styles**: Each page has a matching CSS file at `src/styles/pages/{page-name}.css`.
- **Content source**: All page text content lives in `src/content/entomology-text.ts` (constants like `VISION_BODY`, `METAMORPHIS_TITLE`, etc.).
- **60fps target**: All animation uses `requestAnimationFrame`. No `setInterval`, no CSS `transition` in the hot path.
- **Canvas sizing**: All canvases sized to `containerWidth × contentHeight`, HiDPI-aware (`devicePixelRatio`), listen to `ResizeObserver`.
- **No new dependencies**: Zero new npm packages. Vanilla Canvas 2D API, SVG SMIL, and `requestAnimationFrame` only.
- **File conventions**: Page components → `src/components/pages/[Name]Page.tsx`, Effect components → `src/components/[EffectName].tsx`, Pure utilities → `src/layout-engine/[utility-name].ts`.
- **Page IDs**: `'cover'`, `'wings'`, `'vision'`, `'metamorphosis'`, `'antennae'`, `'numbers'`, `'records'`, `'behavior'`, `'mimicry'`, `'humans'`, `'colophon'`.
- **Mobile**: Touch events (`touchstart`, `touchmove`, `touchend`) must provide equivalent behavior to mouse events on all interactive pages.

---

## Phase 1: Numbers Page — Animated Stat Counters

**User stories**: 37, 38, 39, 40, 41, 42, 43, 44, 45

### What to build

Replace the standard `PageSpread` body with a custom stat-card grid. The page title and credit still use Pretext-rendered DOM at the top. Below, a CSS grid of cards each displays an animated counter that counts from 0 to its target value using easeOutQuart easing. Numbers format with `Intl.NumberFormat`. Large numbers (>1 billion) show an abbreviated form with the raw number smaller below. Animation runs once per page mount and replays on each visit.

### Acceptance criteria

- [ ] NumbersPage does NOT use `PageSpread` for body — is a fully custom component (Pattern D)
- [ ] Page title ("By the Numbers") and credit line render at the top using existing Pretext layout
- [ ] Stat cards display in a CSS grid layout (not a plain list)
- [ ] Each counter animates from 0 to target on page mount using easeOutQuart over ~2000ms
- [ ] Counters run only once per mount (no looping)
- [ ] Counters replay when user navigates away and returns (component remounts)
- [ ] Numbers formatted with `Intl.NumberFormat` locale separators
- [ ] Large numbers (>1 billion) show abbreviated form ("10 quintillion") with raw number smaller below
- [ ] Each card shows: animated number, unit label, and short explanatory phrase
- [ ] Respects book palette colours (ochre/amber for numbers, ink for labels)

---

## Phase 2: Antennae Page — Pheromone Plume Canvas Overlay

**User stories**: 23, 24, 25, 26, 27, 28

### What to build

Add a `<canvas>` overlay to the existing AntennaePage that tracks the cursor and draws a soft, fading radial gradient "pheromone plume" trail. The canvas is `pointer-events: none` so it never intercepts clicks. A trail buffer (`Float32Array`) stores the last ~40 mouse positions with age values. Each `rAF` frame clears and redraws the trail as radial gradient circles with decaying alpha. Colour: amber/gold from the book palette. On `mouseleave`, the trail clears naturally. Touch-drag on mobile provides equivalent behavior.

### Acceptance criteria

- [ ] Canvas overlay sits above AntennaePage's `PageSpread` content
- [ ] Canvas has `pointer-events: none` — does not block clicks on text, images, or navigation
- [ ] `mousemove` events add cursor position to a trail buffer
- [ ] Each `rAF` frame clears canvas and redraws trail points with decaying alpha
- [ ] Plume is subtle enough that body text remains readable through it
- [ ] Canvas is clean (empty) on page entry — no residual plume
- [ ] On `mouseleave`, trail clears and canvas goes transparent
- [ ] `touchmove` on mobile provides equivalent plume-drawing behavior
- [ ] Uses book palette colour (amber/gold `#c4963a` or similar)
- [ ] Runs at 60fps with no jank

---

## Phase 3: Mimicry Page — Scratch-Reveal Camouflage Canvas

**User stories**: 29, 30, 31, 32, 33, 34, 35, 36

### What to build

Add a `<canvas>` overlay above the MimicryPage body text that initially obscures it with a procedurally-generated leaf-vein camouflage pattern. The canvas uses `pointer-events: all` to capture mouse drag. On `mousedown` + `mousemove` (and `touchmove` on mobile), the canvas erases under the cursor using `ctx.globalCompositeOperation = 'destination-out'` with a ~28px brush radius. A "drag to reveal" hint text fades once the user starts scratching. Coverage is sampled every 500ms on a grid — once >80% revealed, the canvas is removed from the DOM entirely. The scratch is one-directional (no reset). The leaf-vein pattern uses book palette colours (parchment `#e8dcc8`, verdigris `#7a9c6a`).

### Acceptance criteria

- [ ] Canvas overlay sits above MimicryPage's body text with `pointer-events: all`
- [ ] Initial state: canvas fully painted with leaf-vein camouflage pattern (procedurally generated)
- [ ] Leaf-vein pattern uses book palette (parchment background, verdigris green veins)
- [ ] Mouse drag erases canvas using `destination-out` compositing (~28px brush radius)
- [ ] Touch-drag on mobile provides equivalent scratch behavior
- [ ] "drag to reveal" hint text displayed initially, fades after first scratch
- [ ] Coverage sampled every ~500ms — once >80% revealed, canvas removed from DOM
- [ ] Body text fully readable once canvas is removed
- [ ] Scratch is one-directional — no reset button, no re-obscuring
- [ ] Canvas re-generates on page remount (navigate away and return)

---

## Phase 4: Compound Vision Page — Hexagonal Mosaic Hover Effect

**User stories**: 7, 8, 9, 10, 11, 12

### What to build

Add a `<canvas>` overlay to the CompoundEyePage that shatters body text into a hexagonal compound-eye mosaic on hover. On page mount, the canvas is transparent. On `mouseenter` the body text region, hex cells animate in with a wave-like transition (driven by distance from cursor entry point). Each hex cell (~14px radius) samples the colour/luminance from the underlying text via an offscreen canvas. On `mouseleave`, hex cells animate back out, reassembling into readable text. Transition is per-cell and animated (not instant). On mobile, `touchstart` toggles mosaic on/off. Hex grid path data is pre-generated at layout time, not recomputed per frame.

### Acceptance criteria

- [ ] Canvas overlay on CompoundEyePage, `pointer-events: none` by default
- [ ] Body text appears normally on page entry (no mosaic initially)
- [ ] `mouseenter` on body region triggers mosaic mode
- [ ] `mouseleave` triggers reassembly back to normal text
- [ ] Hex grid tessellates body bounding box with ~14px radius hexagons
- [ ] Each hex cell displays colour sampled from underlying text position
- [ ] Transition is animated per-cell with wave-like pattern from cursor entry point
- [ ] Transition is not instant — has visible animation duration
- [ ] Hex path data pre-generated at layout time, not recomputed per frame
- [ ] `touchstart` on mobile toggles mosaic on/off
- [ ] Uses book palette colours for hex rendering

---

## Phase 5: Metamorphosis Page — Caterpillar Creature State Machine

**User stories**: 13, 14, 15, 16, 17, 18, 19, 20, 21, 22

### What to build

Create a self-contained `CaterpillarCreature` component placed on the MetamorphosisPage. It runs a state machine: `roaming` → `cocooning` → `cocooned` → `hatching` → `butterfly-flying` → `gone` → (reset to `roaming`). In roaming mode, the caterpillar follows a seeded random walk with Catmull-Rom spline paths, wrapping at page boundaries (~80px/s). The caterpillar SVG has 5-6 overlapping ellipse segments with staggered SMIL `<animate>` undulation. Click/tap triggers cocooning (300ms ease transition). Cocoon state is inert. Click/tap on cocoon triggers hatching into a butterfly (reuses WingsPage butterfly SVG paths) that flies off-screen. After departure, resets back to roaming. The creature does NOT act as a Pretext obstacle — it moves freely over text.

### Acceptance criteria

- [ ] CaterpillarCreature component is self-contained, no PageSpread coupling
- [ ] State machine: roaming → cocooning → cocooned → hatching → butterfly-flying → gone → reset
- [ ] Roaming: caterpillar follows smooth, non-linear random walk (~80px/s)
- [ ] Caterpillar wraps at page boundaries (does not disappear off-screen)
- [ ] Caterpillar SVG: 5-6 overlapping ellipses, deep green `#3a6b35`, with lighter segment dividers
- [ ] Undulation animation via SMIL `<animate>` with staggered offsets per segment
- [ ] Caterpillar has head with two short antennae and 3 pairs of leg stubs
- [ ] Caterpillar faces direction of travel
- [ ] Click/tap on caterpillar triggers cocooning transition (300ms ease)
- [ ] Cocoon is inert (no movement animation)
- [ ] Click/tap on cocoon triggers hatching → butterfly flies off-screen
- [ ] Butterfly reuses wing path data from existing Butterfly.tsx component
- [ ] Clicks ignored during transition states (cocooning, hatching, butterfly-flying)
- [ ] After butterfly departs, caterpillar resets to roaming after a delay
- [ ] Creature does NOT push text around (not a Pretext obstacle)
- [ ] Positioned absolutely within page wrapper, z-index above text but below navigation

---

## Phase 6: Shared Utilities and Testing

**User stories**: (supports all phases — infrastructure quality)

### What to build

Extract shared pure-JS utilities into `src/layout-engine/`: hex grid generator, leaf vein generator, easing functions, and number formatter. Write Vitest unit tests for pure functions (deterministic behavior): leaf vein generator produces same output from same seed, hex grid tessellates bounds completely, number formatter handles large numbers correctly with abbreviations, counter easing functions return expected values at boundaries.

### Acceptance criteria

- [ ] Hex grid generator utility in `src/layout-engine/` — given bounds + radius, produces complete tessellation
- [ ] Leaf vein generator utility in `src/layout-engine/` — seeded RNG, deterministic output
- [ ] Easing functions (easeOutQuart, etc.) extracted as pure utilities
- [ ] Number formatter with abbreviation logic for large numbers (>1 billion)
- [ ] Vitest unit test: leaf vein generator determinism (same seed → same output)
- [ ] Vitest unit test: hex grid tessellation completeness
- [ ] Vitest unit test: number formatting with separators and abbreviations
- [ ] Vitest unit test: CaterpillarCreature state machine transitions (simulated events)
- [ ] Vitest unit test: counter values at t=0 (0) and t=duration (target value)

---

## Implementation order rationale

Phases are ordered simplest → most complex:

1. **Numbers Page** — No canvas, just DOM + CSS grid + rAF counter animation. Lowest risk.
2. **Antennae Page** — Pure canvas draw loop, no state machine, no Pretext coupling.
3. **Mimicry Page** — Canvas with `destination-out` compositing and coverage tracking.
4. **Compound Vision Page** — Canvas with hex grid + offscreen text sampling + animated transitions.
5. **Metamorphosis Page** — SVG state machine, multiple creature designs, path planning. Highest complexity.
6. **Shared Utilities + Tests** — Run in parallel with or after the feature phases. Tests verify pure functions, not canvas draw calls.
