# PRD: Interactive Canvas Pages — EXOSKELETON Digital Monograph

**Project:** `exoskeleton` — A Digital Monograph on Insect Morphology  
**Feature:** Five interactive, canvas-powered page experiences using Pretext  
**Status:** Draft — ready for implementation planning  
**Date:** 2026-04-05

---

## Problem Statement

The EXOSKELETON monograph is a beautifully typeset digital book using the Pretext text-layout engine for precise, DOM-free text flow. However, most pages beyond the Wings spread are static — they display text and images but offer no interactive engagement. The monograph's subject matter (insect biology, metamorphosis, sensory systems, mimicry) is inherently dramatic and visual, creating a strong opportunity to match the *form* of the page to its *content* through interactive animation.

The existing Wings page demonstrates the pattern with the Butterfly creature: an animated SVG obstacle that routes body text around it live, at 60fps, with zero DOM reflow. This same infrastructure needs to be extended to four additional pages, each with an effect that matches its thematic content.

---

## Solution

Add five new interactive page experiences. Each is a self-contained page component that wraps (or replaces) the existing `PageSpread` layout:

1. **Compound Vision** — A `<canvas>` overlay shatters text into a hexagonal compound-eye mosaic on hover, then reassembles on mouse-out.
2. **Metamorphosis** — An autonomous caterpillar SVG creature roams the page. Click it: it stops and forms a cocoon. Click the cocoon: it transforms into a butterfly that flies away.
3. **Antennae** — A `<canvas>` overlay draws a soft radial "pheromone plume" that trails the cursor across the page.
4. **Mimicry & Defense** — A `<canvas>` layer covers the body text with a leaf-vein camouflage pattern. The user scratches it away with the mouse to reveal the text beneath (scratch-card mechanic).
5. **By the Numbers** — A fully custom canvas + DOM hybrid page replaces the standard body copy with large animated stat counters that count up from zero on page entry.

---

## User Stories

### General (All Interactive Pages)

1. As a reader, I want each interactive page to feel thematically connected to its content, so that the animation reinforces what I am reading rather than distracting from it.
2. As a reader, I want all interactions to run at 60fps with no jank, so that the experience feels premium and not broken.
3. As a reader, I want each page's interactive layer to not block or distort the core typography, so that readability is preserved.
4. As a reader on mobile/tablet, I want touch events to behave equivalently to mouse events so the effects work on all devices.
5. As a reader, I want interactive page elements to have cursor hints (pointer, crosshair, etc.) so I know what is interactive without a tutorial.
6. As a reader, I want each effect to not auto-loop infinitely in a way that becomes visually fatiguing or distracting while I am reading.

---

### Page A: Compound Vision (Vision / Compound Eye page)

7. As a reader, I want the body text to appear normally when I first arrive at the page, so reading is the default state.
8. As a reader, I want the text to shatter into a hexagonal compound-eye mosaic when I hover over the body text area, so I get a visceral sense of the ommatidium structure described in the copy.
9. As a reader, I want the mosaic to reassemble back into readable text when I move my mouse away, so the reading experience is recoverable instantly.
10. As a reader, I want each hex cell in the mosaic to display a fragment or colour sampled from the underlying text, so the mosaic feels like a genuine transformation of content rather than a blank overlay.
11. As a reader, I want the transition into mosaic and back to text to be animated (not instant), so the transformation feels organic.
12. As a reader on mobile, I want a single tap on the body to toggle the mosaic effect on/off, so I can experience it on touch devices.

---

### Page B: Metamorphosis

13. As a reader, I want to see a small caterpillar SVG creature roaming slowly and autonomously across the page, so I have a living visual companion to the metamorphosis essay.
14. As a reader, I want the caterpillar to move in a natural, non-linear path (like a real caterpillar exploring), so it feels alive rather than mechanical.
15. As a reader, I want the caterpillar's body to animate (undulate/wiggle) as it moves, so it reads as a creature not an icon.
16. As a reader, I want to click/tap the caterpillar and see it stop and wrap into a cocoon shape, so I can trigger the metamorphosis sequence myself.
17. As a reader, I want the cocoon to appear inert and still (no movement animation), so it matches the "dormant pupa" described in the text.
18. As a reader, I want to click/tap the cocoon and see it split open and transform into a butterfly SVG, so I complete the metamorphosis arc.
19. As a reader, I want the butterfly to then fly away off-screen (or behave like the Wings-page butterfly), so the transformation feels conclusive and magical.
20. As a reader, I want the creature to wrap around page boundaries (not disappear off-screen), so it stays visible while roaming.
21. As a reader, I want the caterpillar to restart its journey after the butterfly departs (optional reset), so the page remains interactive after the full cycle.
22. As a reader, I do NOT want the caterpillar to be a Pretext obstacle — it moves freely over text without routing text around it, so the implementation stays simple and bug-free.

---

### Page C: Antennae

23. As a reader, I want to see a soft, radial gradient "pheromone plume" follow my cursor across the Antennae page, so I feel like I am the silkmoth described in the text, chemically sensing my surroundings.
24. As a reader, I want the plume to have a slow fade-out tail (not disappear instantly), so the effect feels like a drifting chemical cloud, not a cursor glow.
25. As a reader, I want the plume to be subtle enough that I can still read the body text through it, so readability is preserved.
26. As a reader, I want the plume to not appear when the cursor leaves the page area, so the canvas is clean on entry and exit.
27. As a reader on mobile, I want a touch-drag equivalent that draws the plume trail as I drag my finger, so the effect works on touch.
28. As a reader, I want the canvas overlay to sit above the page text but never intercept click events on images or navigation elements, so no existing interaction is broken.

---

### Page D: Mimicry & Defense

29. As a reader, I want the Mimicry page body text to initially appear hidden under a leaf-vein camouflage canvas pattern, so the page content is intentionally obscured — mimicking concealment.
30. As a reader, I want to scratch the camouflage away by clicking and dragging my mouse, so I feel like I am peeling back the disguise to find the text beneath.
31. As a reader, I want the scratch reveal to be permanent within a session (I don't have to re-scratch on every hover), so the act of discovery has weight.
32. As a reader, I want the leaf-vein pattern to match the book's colour palette (ochre, verdigris, parchment), so it feels like a natural extension of the book design rather than a generic effect.
33. As a reader on mobile, I want to use a touch-drag to scratch, so the mechanic works on touch screens.
34. As a reader, I want a subtle hint text at the top of the canvas ("drag to reveal") that fades once I begin scratching, so I know what to do without reading documentation.
35. As a reader, I want the body text to be normally readable once most (>80%) of the canvas has been scratched away, so the payoff is clear.
36. As a reader, I do NOT want a "reset" button — the scratch is one-directional per session, so the reveal feels meaningful.

---

### Page E: By the Numbers

37. As a reader, I want the "By the Numbers" page to forego the standard body text layout and instead present the key insect statistics as large animated number counters, so the numbers have maximum visual impact.
38. As a reader, I want each counter to start at zero and count up to its target number when the page is first opened, so I get a sense of scale building up.
39. As a reader, I want each counter to count up only once per page visit (not loop), so the effect doesn't become irritating.
40. As a reader, I want the counting animation to use an easing curve (ease-out), so large numbers feel weighty rather than mechanical.
41. As a reader, I want each stat card to show: the animated number, a unit label ("species", "× human biomass", etc.), and a short explanatory phrase, so the stats are contextualised.
42. As a reader, I want the stat cards to be arranged in a visually rich grid, not a plain list, so the page feels like a designed data spread.
43. As a reader, I want the Pretext-rendered page title ("By the Numbers") and credit line to remain at the top of the page, so the page maintains its monograph identity.
44. As a reader, I want the stat counters to still animate correctly even if I navigate away and return — the counter re-plays on each page entry, so it works on every visit.
45. As a reader, I want numbers formatted with locale-appropriate separators (e.g. "1,000,000" not "1000000") so they are immediately legible.

---

## Implementation Decisions

### Architecture

- **Rendering surface**: Each interactive page is a self-contained React component. The `PageSpread` component remains untouched. Interactive effects are added by wrapping `PageSpread` with an additional `<canvas>` overlay (for Vision, Antennae, Mimicry) or by building a fully custom layout (Metamorphosis, Numbers).
- **Canvas overlay pattern**: The canvas is absolutely positioned, fills the same bounding box as the spread, and uses `pointer-events: none` by default unless the page requires pointer capture (Mimicry uses `pointer-events: all`).
- **60fps target**: All animation uses `requestAnimationFrame`. No `setInterval`, no CSS `transition` in the hot path (except for SVG creature state transitions).
- **Pretext measurements drive canvas coordinates**: Body line positions from `layoutText()` and `layoutWithLines()` are used to position canvas effects precisely. The canvas never guesses pixel coordinates.

---

### Module A: `CompoundEyeCanvas.tsx`

- Accepts `bodyLines: PositionedLine[]` (from parent `PageSpread` layout result, exposed via callback).
- On mount, renders transparent canvas over the body text area.
- On `mouseenter` the body region: enters mosaic mode.
- On `mouseleave`: exits mosaic mode.
- **Mosaic construction**: Uses a hex grid generator (pure JS, no external lib) to tessellate the body bounding box with hexagons of fixed radius (~14px). Each hex is filled with the average rendered text luminance at that position (sampled from an offscreen canvas that renders the text beforehand), or a simplified colour derivation from the page's ink palette.
- **Transition**: Each hex cell has an independent `animationPhase` value (0–1) driven by distance from cursor entry point, creating a wave-like shatter pattern. Controlled by a single `rAF` loop.
- **Mobile**: `touchstart` on body toggles mosaic mode instead of hover.
- All SVG path data for hex cells is pre-generated at layout time, not re-computed per frame.

---

### Module B: `CaterpillarCreature.tsx`

- Fully self-contained. No `PageSpread` props required. No Pretext obstacle.
- **State machine**: `roaming` → `cocooning` (transition animation) → `cocooned` → `hatching` (transition animation) → `butterfly-flying` → `gone` → (reset back to `roaming` after delay).
- **Roaming phase**: Caterpillar follows a seeded random walk (similar to the Wings butterfly's waypoint system). Uses Catmull-Rom spline for smooth paths. Wraps at page boundaries. Speed: slow (~80px/s). Path regenerated after each waypoint sequence completes.
- **Caterpillar SVG**: Segmented body (5–6 ellipse segments), animated using SMIL `<animate>` for an undulating wave motion. Colour: deep green with lighter segment borders. Small antennae at head. Direction of travel updates the SVG's `transform` so it always faces its heading.
- **Cocoon SVG**: A teardrop/oval shape with fibrous texture lines drawn as SVG `<path>` elements. Slightly swaying idle animation.
- **Butterfly SVG**: Reuses the same SVG wing path data from the existing `Butterfly.tsx` component. When hatched, transitions to a flight animation and moves off the top of the viewport.
- **Transitions**: `cocooning` and `hatching` use short CSS opacity + scale transitions on SVG element swap (300ms ease). No complex morphing — just a clean swap.
- **Click/tap guard**: Clicks on the creature are ignored during transitions (`cocooning`, `hatching`, `butterfly-flying`).
- **Positioning**: Absolute within the page's `position: relative` wrapper. `z-index` above text but below navigation.

---

### Module C: `PheromoneCanvas.tsx`

- Canvas overlay, `pointer-events: none`.
- Tracks `mousemove` on the parent page element.
- Maintains a **trail buffer**: a `Float32Array` of (x, y, age) triples for the last N mouse positions (N ≈ 40).
- Each `rAF` frame: clears canvas, ages all trail points. For each trail point, draws a radial gradient circle whose alpha is `(1 - age/MAX_AGE) * BASE_ALPHA` (where `BASE_ALPHA ≈ 0.12`). Colour: amber/gold tone matching the book palette.
- The net effect: a soft, slow-fading chemical plume behind the cursor.
- No Pretext involvement — this is a pure canvas overlay.
- On `mouseleave` page: clears trail (canvas fades naturally via aging).
- Mobile: listens to `touchmove`. Adds points to trail from `touch.clientX/Y`.

---

### Module D: `ScratchRevealCanvas.tsx`

- Canvas sits **above** the body text (not below). `pointer-events: all` (must capture drag).
- **Initial state**: Canvas is fully painted with a leaf-vein camouflage pattern generated procedurally:
  - Background: a parchment/ochre fill (`#e8dcc8`).
  - Veins: 12–18 branching polylines drawn with `ctx.stroke()`, colour `#7a9c6a` (verdigris green), `lineWidth` 1–2.
  - Hint text: "drag to reveal" drawn centred on canvas in a faint ink colour.
- **Reveal mechanic**: On `mousedown` + `mousemove` (and `touchmove`), draws circles at cursor position using `ctx.globalCompositeOperation = 'destination-out'`. This erases the canvas, revealing the DOM text below.
- **Brush size**: ~28px radius. Not configurable by user.
- **Hint fade**: Once first `mousedown` event fires, fade the hint text alpha to 0 over 800ms (controlled by a separate overlay canvas or a CSS element above the scratch canvas).
- **Coverage tracking**: Sample a grid of points on the canvas every 500ms (not every frame) to estimate revealed %. Once >80% revealed, remove the canvas element from DOM entirely so text is fully accessible.
- **No reset**: Canvas is not regenerated during the session unless the user navigates away and returns (page component remounts).
- **Leaf vein generator**: A pure JS function that generates the vein polylines from a seeded RNG. Runs once on mount.

---

### Module E: `NumbersPage.tsx` (full page replacement)

- Does NOT use `PageSpread`. Is its own standalone page component.
- **Title**: Pretext-rendered headline using `layoutText()` with the existing `TITLE_FONT` constant. Displayed as DOM `<span>` elements exactly as other pages.
- **Stat grid**: A CSS grid of stat cards below the title. No canvas for the grid itself.
- **Stat data**: A `STATS` array defined in `entomology-text.ts` or inline:
  ```
  [
    { value: 1_000_000, label: 'named species', note: 'with ~9M more unnamed' },
    { value: 10_000_000_000_000_000_000, label: 'insects alive right now', note: '10 quintillion' },
    { value: 70, label: '× human biomass', note: 'in collective insect weight' },
    { value: 90, label: '% of all animal species', note: 'that are insects' },
    { value: 350_000_000, label: 'years of insect history', note: 'predating dinosaurs' },
    { value: 400_000, label: 'beetle species', note: "Haldane's inordinate fondness" },
    { value: 10_000_000, label: 'nectar trips', note: 'to make one pound of honey' },
    { value: 1_400_000_000, label: 'insects per human', note: 'on Earth right now' },
  ]
  ```
- **Counter animation**: Each card runs an independent `rAF` loop. Easeing: `easeOutQuart`. Duration: 2000ms. All start simultaneously on page mount.
- **Number display**: Large (~4rem–6rem) serif display font. Formatted using `Intl.NumberFormat` with `'en-US'` locale. Very large numbers (>1 billion) formatted as abbreviated form ("10 quintillion") with the raw number shown smaller below.
- **Card design**: Dark ink card with large number in display colour (amber/ochre), unit label in smaller serif below, note in smallest caption. Book palette throughout.
- **Animation trigger**: Runs on page mount. Re-runs each time the user navigates to this page (component unmounts/remounts, so state resets automatically).

---

### Shared Infrastructure

- **No new Pretext API usage beyond what exists**: All pages use `layoutText()`, `layoutWithLines()`, and `prepareWithSegments()` from the existing `spread-layout.ts` module. No new Pretext primitives needed.
- **Canvas sizing**: All canvas elements are sized to `containerWidth × contentHeight` matching the `PageSpread` container. They listen to `ResizeObserver` (or `window.resize`) and redraw on size change.
- **HiDPI**: All canvas elements scale for `window.devicePixelRatio`. Canvas physical size = logical size × DPR. All draw calls use logical coordinates.
- **No external dependencies**: Zero new npm packages. All effects use vanilla Canvas 2D API, SVG SMIL animations, and `requestAnimationFrame`.

---

## Testing Decisions

> **What makes a good test:** Test external behaviour (rendered output, state transitions, event responses), not implementation details (internal state variables, private functions, canvas draw call counts).

### Modules to test

| Module | What to test |
|---|---|
| `CaterpillarCreature` | State machine transitions (roaming → cocooned → butterfly via simulated click events). Verify each phase renders the correct SVG element. |
| `ScratchRevealCanvas` | Coverage estimation logic (the % revealed calculator), hint text visibility toggle. |
| `NumbersPage` stat counters | Counter values at t=0 (should be 0), at t=duration (should be target value), and that `Intl.NumberFormat` is applied correctly. |
| Leaf vein generator (pure fn) | Given the same seed, produces the same vein polylines (determinism). |
| Hex grid generator (pure fn) | Given bounds and radius, tessellates the area completely with no gaps outside a tolerance. |

### Testing is NOT required for

- Canvas draw calls themselves (untestable without visual regression tools)
- The `rAF` animation loops (timing-dependent, not unit-testable)
- The pheromone trail buffer (pure visual effect, no branching logic)

### Prior art

- The project has no existing test suite. Tests to be written as simple Vitest unit tests for pure functions (vein generator, hex grid generator, number formatter, state machine transitions).

---

## Out of Scope

- **Vision page SVG Export**: The hex mosaic is not exportable as an image.
- **Metamorphosis creature as Pretext obstacle**: The caterpillar does NOT push text around. Only the Wings butterfly does that.
- **Caterpillar on Wings page**: The Wings page keeps only the existing butterfly. The caterpillar lives exclusively on the Metamorphosis page.
- **Sound effects**: No audio on any interactive page.
- **Accessibility beyond ARIA labels**: Screen reader users will experience the standard text content; interactive effects are progressive enhancement only.
- **Server-side rendering**: All effects are client-only. SSR is not a goal for this project.
- **Knuth-Plass justification or custom text rendering**: Body text continues to render as DOM `<span>` positioned by Pretext; no canvas text rendering of body copy.
- **By the Numbers canvas**: The Numbers page stat cards use DOM + CSS grid, not canvas. Only the Antennae, Vision, and Mimicry pages use a canvas overlay.
- **Saving scratch progress**: The Mimicry scratch state is not persisted across navigation or sessions.
- **Multiplayer / shared state**: All interactions are local to the current browser session.
- **Caterpillar as food (click → eaten by bird)**: Rejected on grounds of being terrifying.

---

## Further Notes

### Design palette reference

All new interactive elements must respect the existing book palette:
- **Ink / dark**: `#2c2418` (near-black brown)
- **Parchment**: `#e8dcc8` (warm off-white)
- **Ochre / amber**: `#c4963a` (the butterfly wing colour)
- **Verdigris green**: `#4a8c7e` (the butterfly hindwing colour / leaf vein fill)
- **Body text**: rendered in ink on parchment via existing `PageSpread` styles

### Caterpillar SVG design brief

The caterpillar should look like a generalised moth/butterfly larva — not photorealistic:
- Body: 5–6 overlapping ellipses in a chain
- Colour: deep green (`#3a6b35`) with lighter segment dividers
- Head: slightly larger circle, with two short antennae (`<line>` elements)
- Legs: 3 pairs of small `<rect>` or `<path>` stubs under the body
- Undulation: SMIL `<animate>` on each body ellipse's `cy` offset, staggered by segment index
- Size: ~48×20px bounding box (same size as the butterfly)

### Implementation order recommendation

The five pages should be implemented in this order (simplest → most complex):

1. **By the Numbers** — no canvas, just DOM stat cards with counter animation
2. **Antennae / Pheromone** — pure canvas draw, no state machine, no Pretext coupling  
3. **Mimicry / Scratch Reveal** — canvas with `destination-out` compositing  
4. **Compound Vision / Mosaic** — canvas with hex grid + offscreen rendering  
5. **Metamorphosis / Caterpillar** — SVG state machine (most components, highest complexity)

### File location convention

New files should follow the existing pattern:
- Page components → `src/components/pages/[Name]Page.tsx`
- Effect components → `src/components/[EffectName].tsx`
- Shared pure utilities → `src/layout-engine/[utility-name].ts`

---

*End of PRD. This document is the source of truth for all five interactive page implementations. Individual implementation plans (task breakdowns) should be derived from each section above.*
