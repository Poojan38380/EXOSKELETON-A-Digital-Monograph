# EXOSKELETON — A Digital Entomology Monograph

> **Project:** glypdfress  
> **Concept:** Victorian scientific plate meets computational generative art  
> **Aesthetic:** Ernst Haeckel's "Kunstformen der Natur" rendered through algorithmic processes, presented as a high-end interactive digital monograph.

---

## Phase 1: Content & Typography Foundation

### 1.1 Entomology Content
Create `src/content/entomology-text.ts` with ~400-600 words per page:

| Page | Title | Subject Matter |
|------|-------|---------------|
| 0 | **EXOSKELETON** (Cover) | Title page — "A Digital Monograph on Insect Morphology" |
| 1 | The Architecture of Wings | Dragonfly/damselfly wing venation, load-bearing structures, evolutionary convergence |
| 2 | Compound Vision | Ommatidia, spectral sensitivity, polarized light perception |
| 3 | Metamorphosis | Complete vs incomplete, hormonal triggers, the pupal mystery |
| 4 | The Language of Antennae | Chemoreception, mechanoreception, moth pheromone tracking |
| 5 | Colophon / Index | Typefaces, generative algorithms, acknowledgments |

### 1.2 Typography System
Import and configure Google Fonts:

| Role | Font | Usage |
|------|------|-------|
| Display | **Playfair Display** | Page titles, drop caps |
| Body | **EB Garamond** | All body text, captions |
| Captions | **Cormorant Garamond Italic** | Figure captions, marginalia |
| Navigation | **Source Code Pro** | Page numbers, seed values |

- Drop caps on each page opening (first letter, 5-line height, ornamental rule beneath)
- Import via `<link>` in `index.html` or `@import` in CSS

### 1.3 Color Palette
Define CSS custom properties in `src/index.css`:

```css
--parchment: #f5f0e1        /* Page background */
--ink: #1a1714              /* Primary text */
--iron-gall: #2c2418        /* Dark accent (headings) */
--ochre: #c4963a            /* Warm accent */
--verdigris: #4a8c7e        /* Cool accent (generative art tint) */
--carmine: #9b2335          /* Alert / active accent */
--rule: #d4c9b0             /* Decorative rules, dividers */
--marginalia: #8a7e6b       /* Secondary text, captions */
```

### 1.4 Deliverables
- [ ] `src/content/entomology-text.ts` — all page copy exports
- [ ] Font imports in `index.html`
- [ ] CSS variables in `src/index.css`
- [ ] Drop cap component style
- [ ] Ornamental rule divider style

---

## Phase 2: Book Shell & Page State

### 2.1 BookShell Component
Create `src/components/BookShell.tsx`:
- Manages current page index state (`useState<number>`)
- Wraps the entire book viewport
- Handles keyboard navigation (← → arrow keys, Page Up/Down)
- Handles touch swipe (left/right)
- Dispatches page change events

### 2.2 Page Turn Animation
CSS-only transition system:
1. Current page: fades to `opacity: 0.3`, scales down to `0.98`
2. New page: fades in from `opacity: 0.7`, scales from `1.02` → `1.0`
3. Generative art canvas re-seeds with page-specific seed
4. Total duration: `400ms` with `cubic-bezier(0.4, 0, 0.2, 1)`
5. Use CSS classes toggled by React state

### 2.3 Deliverables
- [ ] `src/components/BookShell.tsx` — state management + keyboard/touch handlers
- [ ] Page turn CSS transitions in `src/styles/book.css`
- [ ] Keyboard event listeners (arrow keys, Page Up/Down)
- [ ] Touch swipe detection

---

## Phase 3: Navigation Rail

### 3.1 Component
Create `src/components/NavigationRail.tsx`:
- Slim vertical spine on the left side
- **Collapsed:** 48px wide — embossed page numbers only
- **Hovered:** 200px wide — reveals page title + generative art thumbnail
- Current page highlighted in ochre (`--ochre`)
- Smooth CSS transition (`transition: width 300ms ease`)

### 3.2 Visual Design
```
│ ┃  1  │  The Architecture of Wings  │  ← collapsed: just numbers
│ ┃  2  │  Compound Vision            │
│ ┃●3●  │  Metamorphosis              │  ← current page (ochre dot)
│ ┃  4  │  Language of Antennae       │
│ ┃  5  │  Colophon                   │
```

### 3.3 Deliverables
- [ ] `src/components/NavigationRail.tsx`
- [ ] `src/styles/navigation.css`
- [ ] Hover expand animation
- [ ] Active page indicator
- [ ] Click handlers to change pages
- [ ] Responsive: hide on mobile, show hamburger

---

## Phase 4: Page Spread Layout Component

### 4.1 PageSpread Component
Create `src/components/PageSpread.tsx`:
- Uses the **Pretext layout engine** (already ported in `src/layout-engine/`)
- Takes content text, font config, and obstacle geometry
- Positions text in columns, flowing around generative art canvases and images
- Handles pull quotes, drop caps, ornamental dividers
- Responsive: single column on narrow screens

### 4.2 Layout Patterns
Each page uses a different spread pattern:

| Page | Pattern |
|------|---------|
| 0 (Cover) | Centered title, large generative mandala behind |
| 1 (Wings) | Two-column text, generative art right sidebar, pull quote |
| 2 (Compound Eye) | Asymmetric — narrow left column, wide right with hex grid |
| 3 (Metamorphosis) | Horizontal triptych — three stages across the spread |
| 4 (Antennae) | Single narrow column, L-system art as left sidebar |
| 5 (Colophon) | Minimal grid — seed gallery, credits |

### 4.3 Deliverables
- [ ] `src/components/PageSpread.tsx` — reusable layout component
- [ ] Obstacle routing for generative art canvases
- [ ] Pull quote component (larger, indented, italic)
- [ ] Drop cap rendering (first letter, ornamental)
- [ ] Responsive fallback (single column < 768px)

---

## Phase 5: Generative Art System (p5.js)

### 5.1 p5.js Wrapper
Create `src/components/GenerativeArt.tsx`:
- React component wrapping a p5.js instance
- Uses `useRef` for canvas container
- `useEffect` initializes p5 instance with the provided algorithm
- Accepts `seed`, `width`, `height`, `algorithm` props
- Cleans up p5 instance on unmount

### 5.2 Generative Art Pieces

Each algorithm is a self-contained p5.js sketch that generates insect-inspired art from seeded randomness.

| File | Algorithm | Canvas Size | Seed Source |
|------|-----------|-------------|-------------|
| `src/art/elytra-mandala.js` | Concentric beetle wing case pattern | 400×400 | Page 0 |
| `src/art/wing-venation.js` | Flow-field tracing insect wing veins | 350×450 | Page 1 |
| `src/art/compound-eye.js` | Hexagonal ommatidia packing + moiré | 300×300 | Page 2 |
| `src/art/metamorphosis.js` | Recursive subdivision (larva→pupa→imago) | 3× 200×200 | Page 3 |
| `src/art/antennae-lsystem.js` | L-system branching antennae | 250×400 | Page 4 |

### 5.3 Algorithm Specifications

#### A. Elytra Mandala (Cover)
- Concentric rings with radial symmetry (12-fold)
- Striated lines within each ring following beetle elytra patterns
- Iridescent color palette: greens, golds, deep blacks
- Seeded randomness controls ring thickness, striation density

#### B. Wing Venation (Page 1)
- Flow-field driven by layered Perlin noise
- Particles trace wing vein branching patterns
- Main vein (thick) → cross-veins (thin) → cell network
- Engraving style: black ink on parchment, varying line weights

#### C. Compound Eye (Page 2)
- Hexagonal grid of circles (ommatidia)
- Phase interference between adjacent hex rows creates moiré
- Golden amber to deep brown color gradient
- Some hex cells "activated" (brighter) based on noise field

#### D. Metamorphosis Triptych (Page 3)
- Three small canvases side by side:
  - **Larva:** Linear recursive subdivision (elongated segments)
  - **Pupa:** Spiral subdivision (tightening logarithmic spiral)
  - **Imago:** Radial subdivision (butterfly wing emergence)

#### E. Antennal L-System (Page 4)
- Lindenmayer system with production rules mimicking moth antennae
- Bipectinate branching (feathery bilateral segments)
- Axiom: `F` → Rules: `F → F[+F]F[-F]F`
- Angle: 25°, Iterations: 5
- Watercolor-style rendering with translucent layering

### 5.4 Deliverables
- [ ] `src/components/GenerativeArt.tsx` — p5.js React wrapper
- [ ] `src/art/elytra-mandala.js`
- [ ] `src/art/wing-venation.js`
- [ ] `src/art/compound-eye.js`
- [ ] `src/art/metamorphosis.js`
- [ ] `src/art/antennae-lsystem.js`
- [ ] All canvases properly sized and seeded
- [ ] Clean p5 instance lifecycle (no memory leaks)

---

## Phase 6: Individual Page Components

### 6.1 Page Components
Create each page in `src/components/pages/`:

| File | Component | Special Features |
|------|-----------|-----------------|
| `CoverPage.tsx` | `<CoverPage />` | Full-bleed title + elytra mandala behind |
| `WingsPage.tsx` | `<WingsPage />` | Two columns, pull quote, wing venation art |
| `CompoundEyePage.tsx` | `<CompoundEyePage />` | Asymmetric, hex grid generative art |
| `MetamorphosisPage.tsx` | `<MetamorphosisPage />` | Three-stage triptych layout |
| `AntennaePage.tsx` | `<AntennaePage />` | Narrow single column, L-system sidebar |
| `ColophonPage.tsx` | `<ColophonPage />` | Minimal grid, seed gallery |

### 6.2 Each Page Must
- Use `PageSpread` for text layout
- Embed its generative art via `GenerativeArt`
- Include a drop cap on the first paragraph
- Include at least one pull quote or ornamental divider
- Pass its page number as the generative art seed

### 6.3 Deliverables
- [ ] All 6 page components
- [ ] Each page renders correctly in isolation
- [ ] Page turn transitions work between all pages
- [ ] Generative art re-seeds on page change

---

## Phase 7: App Wiring & Polish

### 7.1 App.tsx
Wire everything together:
```
App
 └── BookShell
      ├── NavigationRail
      └── PageSpread (current page component)
           ├── Page Content (entomology text)
           ├── Generative Art (p5.js canvas)
           └── Decorative elements (drop caps, rules, pull quotes)
```

### 7.2 Responsive Design
- **Desktop (> 1024px):** Full two-column spreads, visible nav rail
- **Tablet (768–1024px):** Single column, collapsible nav rail
- **Mobile (< 768px):** Single column, hidden nav, swipe-only navigation

### 7.3 Performance
- Lazy-load p5.js canvases (only render when page is visible)
- Unmount p5 instances when navigating away
- Memoize content text and layout calculations
- Use `React.lazy` + `Suspense` for page components

### 7.4 Final Polish
- Loading state while fonts + p5.js initialize
- Smooth scroll-to-top on page change
- Print-friendly CSS (hide navigation, show all content)
- Favicon: beetle icon or generative elytra pattern
- Meta tags for sharing (OG image, description)

### 7.5 Deliverables
- [ ] `src/App.tsx` — complete wiring
- [ ] Responsive breakpoints for all components
- [ ] Lazy loading for generative art canvases
- [ ] Loading states and error boundaries
- [ ] Print stylesheet
- [ ] Favicon and meta tags

---

## Phase 8: Testing & Deployment

### 8.1 Testing
- [ ] All 6 pages render without errors
- [ ] Navigation works (click, keyboard, touch)
- [ ] Page turn animations are smooth
- [ ] Generative art seeds correctly per page
- [ ] Text flows correctly around obstacles
- [ ] Responsive layouts work at all breakpoints
- [ ] TypeScript compilation passes (`npx tsc -b`)
- [ ] Production build succeeds (`npm run build`)

### 8.2 Deployment
- [ ] `npm run build` produces clean output in `dist/`
- [ ] Preview with `npm run preview`
- [ ] Deploy-ready static files

---

## Optional: Generated Image Assets

If photographic references are desired alongside the generative art, generate these with the prompts below. **Not required** — the site is fully functional with algorithmic art alone.

| # | Description | Size | Style | Purpose |
|---|------------|------|-------|---------|
| 1 | Jewel Beetle (*Chrysochroa fulgidissima*) elytron macro, iridescent green/gold striations, black background | 800×800 | Photorealistic macro | Cover hero image |
| 2 | Dragonfly wing venation, engraved style, fine black lines on cream parchment | 600×800 | 19th-century scientific engraving | Page 1 reference illustration |
| 3 | Horsefly compound eye, individual hexagonal facets, golden amber, shallow DOF | 600×600 | Scientific journal macro | Page 2 reference |
| 4 | Butterfly metamorphosis triptych: caterpillar → chrysalis → adult, copperplate engraving | 1200×400 | Copperplate engraving | Page 3 reference |
| 5 | Saturniid moth bipectinate antennae, watercolor and ink on cream paper | 500×700 | Watercolor scientific plate | Page 4 reference |

---

## Dependencies

Already installed:
- React 19 + TypeScript + Vite
- Pretext layout engine (ported to `src/layout-engine/`)

To install:
- `p5` — `npm install p5 @types/p5` (for TypeScript support, or load via CDN)

---

## File Structure (Target)

```
glypdfress/
├── src/
│   ├── layout-engine/            # Pretext engine (already ported)
│   │   ├── layout.ts
│   │   ├── analysis.ts
│   │   ├── bidi.ts
│   │   ├── measurement.ts
│   │   ├── line-break.ts
│   │   └── wrap-geometry.ts
│   ├── components/
│   │   ├── BookShell.tsx
│   │   ├── PageSpread.tsx
│   │   ├── NavigationRail.tsx
│   │   ├── GenerativeArt.tsx
│   │   └── pages/
│   │       ├── CoverPage.tsx
│   │       ├── WingsPage.tsx
│   │       ├── CompoundEyePage.tsx
│   │       ├── MetamorphosisPage.tsx
│   │       ├── AntennaePage.tsx
│   │       └── ColophonPage.tsx
│   ├── content/
│   │   └── entomology-text.ts
│   ├── art/
│   │   ├── elytra-mandala.js
│   │   ├── wing-venation.js
│   │   ├── compound-eye.js
│   │   ├── metamorphosis.js
│   │   └── antennae-lsystem.js
│   ├── styles/
│   │   ├── book.css
│   │   └── navigation.css
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── PLAN.md
```
