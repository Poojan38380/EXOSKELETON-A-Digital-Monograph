# Implementation Plan: Numbers Page — Animated Stat Counters

> **Source**: `docs/PLANS/new/interactive-pretext-anitamation-design/plan.md` — Phase 1
> **PRD User Stories**: 37–45
> **Complexity**: Lowest (no canvas, pure DOM + rAF animation)

---

## Problem Space

The current `NumbersPage.tsx` is a simple `PageSpread` wrapper that renders the same prose-layout as every other page. The PRD calls for it to become a **fully custom component** (Pattern D, like `CoverPage`) that abandons the standard body-text spread in favour of a high-impact stat-card grid with animated counters. The title and credit must still render via Pretext at the top. The stat cards below must animate on mount, replay on each page visit, and respect the book's design palette.

### Constraints

1. **No `PageSpread` for body**: The Numbers page must NOT use `PageSpread` for its body content. Title/credit use Pretext directly; stat cards are pure DOM.
2. **Pretext title/credit**: The header ("By the Numbers" + "The scale of the insect world") must use the same `layoutText()` → positioned `<span>` pattern as `PageSpread` does for titles, so typography is consistent.
3. **60fps animation**: Counters use `requestAnimationFrame` with easeOutQuart easing. No `setInterval`, no CSS `transition` for the counting.
4. **One-shot per mount**: Counters run from 0 → target once per component mount. They re-play on remount (automatic via React lifecycle since `App.tsx` unmounts/remounts page components on navigation).
5. **No new dependencies**: Zero npm packages. Vanilla `requestAnimationFrame`, `Intl.NumberFormat`, CSS Grid.
6. **Book palette**: Ochre/amber `#c4963a` for numbers, ink `#2c2418` for labels, parchment `#e8dcc8` for card backgrounds.
7. **Responsive**: Must work on mobile (<768px) and desktop. CSS Grid adapts columns.
8. **Large number handling**: Numbers >1 billion display abbreviated ("10 quintillion") with the full raw number shown smaller below.

---

## File Manifest

| File | Type | Purpose |
|------|------|---------|
| `src/components/pages/NumbersPage.tsx` | **Modified** | Replace current `PageSpread` wrapper with fully custom layout |
| `src/components/StatCounter.tsx` | **New** | Individual animated counter component |
| `src/components/StatCard.tsx` | **New** | Card wrapper displaying number + label + note |
| `src/layout-engine/easing.ts` | **New** | Pure easing functions (easeOutQuart, etc.) |
| `src/layout-engine/number-format.ts` | **New** | Number formatting with abbreviation logic |
| `src/styles/pages/numbers.css` | **Modified** | Add stat grid + card styles |
| `src/content/stat-data.ts` | **New** | Stat data array (values, labels, notes) |

---

## Architecture

### Component Hierarchy

```
NumbersPage
├── Header (Pretext-rendered title + credit)
│   ├── Title <span> lines (from layoutText)
│   └── Credit <span>
├── StatGrid (CSS Grid container)
│   ├── StatCard × 8
│   │   ├── StatCounter (animated number)
│   │   ├── Unit label
│   │   └── Note/explanatory phrase
```

### Data Flow

```
stat-data.ts (STATS array)
  ↓
NumbersPage mounts
  ↓
For each stat → <StatCard> with target value
  ↓
<StatCard> renders <StatCounter>
  ↓
<StatCounter> starts rAF loop on mount
  ↓
rAF: progress = elapsed / duration → easedProgress = easeOutQuart(progress)
  ↓
displayValue = Math.round(easedProgress * target)
  ↓
Formatted via Intl.NumberFormat → DOM
```

### Mount/Unmount Lifecycle

- **Mount**: `StatCounter` starts its rAF loop immediately. All counters start simultaneously.
- **Unmount**: `cancelAnimationFrame` cleans up. No memory leaks.
- **Remount**: User navigates away and back → component remounts → counters restart from 0.

---

## Detailed Implementation Specs

### 1. `src/content/stat-data.ts` — Stat Data Array

```ts
export interface StatData {
  value: number
  label: string
  note: string
}

export const STATS: StatData[] = [
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

**Design decision**: Separate file from `entomology-text.ts` because this data has a different shape (structured objects vs. prose strings). Keeps stat data isolated from page text content.

---

### 2. `src/layout-engine/easing.ts` — Pure Easing Functions

```ts
/**
 * easeOutQuart: starts fast, decelerates sharply toward the end.
 * t must be in [0, 1]. Returns value in [0, 1].
 */
export function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}
```

**Design decision**: Single function for now. Other easings (easeInOutCubic, etc.) can be added in Phase 6 when shared utilities are extracted. This is the only easing needed for Phase 1.

---

### 3. `src/layout-engine/number-format.ts` — Number Formatting

```ts
const NUMBER_FORMATTER = new Intl.NumberFormat('en-US')

const ABBREVIATIONS = [
  { threshold: 1_000_000_000_000_000_000, suffix: 'quintillion', divisor: 1_000_000_000_000_000_000 },
  { threshold: 1_000_000_000_000_000, suffix: 'quadrillion', divisor: 1_000_000_000_000_000 },
  { threshold: 1_000_000_000_000, suffix: 'trillion', divisor: 1_000_000_000_000 },
  { threshold: 1_000_000_000, suffix: 'billion', divisor: 1_000_000_000 },
  { threshold: 1_000_000, suffix: 'million', divisor: 1_000_000 },
]

/**
 * Format a number with locale separators.
 * e.g. 1_000_000 → "1,000,000"
 */
export function formatNumber(value: number): string {
  return NUMBER_FORMATTER.format(value)
}

/**
 * Format a number with abbreviation if > 1 billion.
 * Returns { display: "10 quintillion", raw: "10,000,000,000,000,000,000" }
 * For numbers <= 1 billion, display === formatted raw.
 */
export function formatNumberWithAbbreviation(value: number): {
  display: string
  raw: string
  needsAbbreviation: boolean
} {
  const raw = NUMBER_FORMATTER.format(value)

  for (const abbr of ABBREVIATIONS) {
    if (value >= abbr.threshold) {
      const short = value / abbr.divisor
      return {
        display: `${short} ${abbr.suffix}`,
        raw,
        needsAbbreviation: true,
      }
    }
  }

  return { display: raw, raw, needsAbbreviation: false }
}
```

**Design decision**: `ABBREVIATIONS` array is ordered largest → smallest for early exit. Threshold at 1 billion (not million) because the PRD specifies "large numbers (>1 billion)" get abbreviations. Numbers like 400,000 and 10,000,000 format normally with commas.

---

### 4. `src/components/StatCounter.tsx` — Animated Counter

**Props**:
```ts
interface StatCounterProps {
  target: number
  durationMs?: number  // default 2000
  onComplete?: () => void
}
```

**Behaviour**:
- On mount, records `startTime = performance.now()`
- Each rAF frame: calculates `progress = Math.min((now - startTime) / durationMs, 1)`
- Applies `easeOutQuart(progress)` → `currentValue = Math.round(eased * target)`
- Renders formatted number via `formatNumber(currentValue)`
- When `progress >= 1`, cancels rAF, calls `onComplete` (if provided)
- Cleanup: `cancelAnimationFrame` on unmount

**Implementation approach** (Agent 3 — Optimize for common case):

```tsx
import { useRef, useEffect, useState } from 'react'
import { easeOutQuart } from '../layout-engine/easing'
import { formatNumber } from '../layout-engine/number-format'

export function StatCounter({ target, durationMs = 2000 }: StatCounterProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const startTime = performance.now()

    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / durationMs, 1)
      const easedProgress = easeOutQuart(progress)
      const currentValue = Math.round(easedProgress * target)

      setDisplayValue(currentValue)

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [target, durationMs])

  return <span className="stat-counter">{formatNumber(displayValue)}</span>
}
```

**Key detail**: The `target` and `durationMs` are stable per mount (from the `STATS` array), so the effect runs exactly once. No dependency churn. Counters replay on remount because the component unmounts/remounts via `App.tsx` page navigation.

---

### 5. `src/components/StatCard.tsx` — Stat Card Wrapper

**Props**:
```ts
import type { StatData } from '../content/stat-data'

interface StatCardProps {
  stat: StatData
}
```

**Renders**:
```tsx
<div className="stat-card">
  <div className="stat-card__number">
    <StatCounter target={stat.value} />
    {needsAbbreviation && (
      <span className="stat-card__raw">{formatted.raw}</span>
    )}
  </div>
  <div className="stat-card__label">{stat.label}</div>
  <div className="stat-card__note">{stat.note}</div>
</div>
```

**Logic**: Uses `formatNumberWithAbbreviation(stat.value)` to determine if abbreviation is needed. For numbers like `10_000_000_000_000_000_000`, the animated counter shows "10 quintillion" as the large display number, with the full "10,000,000,000,000,000,000" shown smaller below.

**Abbreviation animation challenge**: The counter animates from 0 → target. During animation, the display should show the *formatted running number* (e.g. "3,247,891" climbing toward "10,000,000,000,000,000,000"). For very large numbers, animating every integer is visually useless (10 quintillion frames at 60fps = 5 billion years). 

**Solution for large numbers**: For values > 1 billion, the counter should animate the *abbreviated coefficient* (0 → 10 for "10 quintillion") and display the abbreviation statically. The raw number is shown below as static text. This means `StatCounter` needs to accept an optional `abbreviatedTarget` and `abbreviationSuffix`.

**Revised StatCounter for large numbers**:

```tsx
// For 10 quintillion:
// - Animate 0 → 10 (the coefficient)
// - Display: "7 quintillion" (climbing), then "10 quintillion"
// - Show raw: "10,000,000,000,000,000,000" below

interface StatCounterProps {
  target: number           // the actual value (e.g. 10_000_000_000_000_000_000)
  durationMs?: number
}

// Internally:
// If target >= 1 billion, find the abbreviation coefficient
// Animate 0 → coefficient, display with suffix
// If target < 1 billion, animate 0 → target, display formatted
```

**Revised StatCounter implementation**:

```tsx
import { useRef, useEffect, useState } from 'react'
import { easeOutQuart } from '../layout-engine/easing'
import { formatNumber, formatNumberWithAbbreviation } from '../layout-engine/number-format'

export function StatCounter({ target, durationMs = 2000 }: StatCounterProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const rafRef = useRef<number | null>(null)
  const { display: abbrDisplay, needsAbbreviation } = formatNumberWithAbbreviation(target)

  // For large numbers, extract the coefficient to animate
  const [coefficient, suffix] = needsAbbreviation
    ? abbrDisplay.split(' ') as [string, string]
    : [null, null]

  const animateTarget = coefficient ? parseFloat(coefficient) : target

  useEffect(() => {
    const startTime = performance.now()

    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / durationMs, 1)
      const easedProgress = easeOutQuart(progress)
      const currentValue = Math.round(easedProgress * animateTarget)

      setDisplayValue(currentValue)

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [animateTarget, durationMs])

  if (needsAbbreviation && suffix) {
    return (
      <span className="stat-counter stat-counter--large">
        {displayValue} {suffix}
      </span>
    )
  }

  return (
    <span className="stat-counter">
      {formatNumber(displayValue)}
    </span>
  )
}
```

**This handles the edge case cleanly**: The counter animates a manageable number (0→10, 0→1.4, etc.) with the suffix visible throughout. For normal numbers (<1 billion), it animates the full value with comma formatting.

---

### 6. `src/components/pages/NumbersPage.tsx` — Main Page Component

**Pattern**: Custom layout (Pattern D, like `CoverPage`). Does NOT use `PageSpread`.

**Structure**:
```tsx
<div className="page-spread numbers-page" ref={containerRef}>
  {/* Pretext-rendered header */}
  <div className="numbers-page__header">
    {layout && (
      <>
        {layout.titleLines.map((line, i) => (
          <span key={i} className="spread-line spread-line--title" style={...}>
            {line.text}
          </span>
        ))}
        {layout.creditPos && (
          <span className="spread-line spread-line--credit" style={...}>
            {NUMBERS_CREDIT}
          </span>
        )}
      </>
    )}
  </div>

  {/* Stat grid */}
  <div className="numbers-page__grid">
    {STATS.map((stat, i) => (
      <StatCard key={i} stat={stat} />
    ))}
  </div>

  {/* Page number */}
  <div className="spread-page-number">{PAGES[5].number}</div>
</div>
```

**Layout computation**: Uses the same `layoutText()` function from `spread-layout.ts` to position the title and credit. This is the Pretext-powered title rendering, identical to how `PageSpread` does it. The body text is replaced by the stat grid.

**Resize handling**: Same pattern as `PageSpread` — `ResizeObserver` or `window.resize` + `document.fonts.ready` trigger re-layout.

---

### 7. `src/styles/pages/numbers.css` — Stat Grid + Card Styles

**CSS Grid layout**:
```css
/* Numbers page override — no page-spread body text */
.numbers-page {
  composes: page-spread;
  padding: 3rem 3.5rem 4rem;
}

.numbers-page__header {
  margin-bottom: 3rem;
  position: relative;
  min-height: 80px; /* reserve for Pretext title */
}

.numbers-page__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

/* Stat card */
.stat-card {
  position: relative;
  border-radius: 4px;
  background: var(--parchment);
  border: 1px solid var(--rule-light);
  box-shadow: var(--depth-1);
  padding: 1.5rem;
  transition: transform 300ms cubic-bezier(0.22, 1, 0.36, 1),
              box-shadow 300ms ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--depth-2);
}

.stat-card__number {
  font-family: "Playfair Display", Georgia, serif;
  font-size: clamp(2rem, 4vw, 3.5rem);
  font-weight: 700;
  color: var(--ochre);
  line-height: 1.1;
  margin-bottom: 0.75rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.stat-card__raw {
  display: block;
  font-family: "Source Code Pro", monospace;
  font-size: 0.75rem;
  color: var(--marginalia);
  margin-top: 0.25rem;
  letter-spacing: 0.05em;
}

.stat-card__label {
  font-family: "Cormorant Garamond", Georgia, serif;
  font-style: italic;
  font-size: 1.1rem;
  color: var(--ink);
  margin-bottom: 0.5rem;
  letter-spacing: var(--tracking-wide);
}

.stat-card__note {
  font-family: "EB Garamond", Georgia, serif;
  font-size: 0.9rem;
  color: var(--marginalia);
  line-height: 1.5;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .numbers-page {
    padding: 1.5rem 1rem 2rem;
  }

  .numbers-page__grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .stat-card {
    padding: 1.25rem;
  }

  .stat-card__number {
    font-size: clamp(1.75rem, 6vw, 2.5rem);
  }
}
```

**Staggered card entrance animation** (optional polish):
```css
@keyframes cardFadeUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stat-card {
  animation: cardFadeUp 500ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.stat-card:nth-child(1) { animation-delay: 100ms; }
.stat-card:nth-child(2) { animation-delay: 180ms; }
.stat-card:nth-child(3) { animation-delay: 260ms; }
.stat-card:nth-child(4) { animation-delay: 340ms; }
.stat-card:nth-child(5) { animation-delay: 420ms; }
.stat-card:nth-child(6) { animation-delay: 500ms; }
.stat-card:nth-child(7) { animation-delay: 580ms; }
.stat-card:nth-child(8) { animation-delay: 660ms; }
```

This gives cards a staggered fade-in as they appear, independent of the counter animation.

---

## Task Breakdown for AI Worker Agents

Each task is independently implementable except where noted. Recommended execution order: **T1 → T2 → T3 → T4 → T5 → T6 → T7**.

### T1: Pure Utilities (No React)

**Agent A**: `src/layout-engine/easing.ts`
- Implement `easeOutQuart(t: number): number`
- Add JSDoc with input/output contract
- No dependencies, no tests required for this phase (tested in Phase 6)

**Agent B**: `src/layout-engine/number-format.ts`
- Implement `formatNumber(value: number): string` using `Intl.NumberFormat`
- Implement `formatNumberWithAbbreviation(value: number): { display, raw, needsAbbreviation }`
- `ABBREVIATIONS` array with quintillion → million thresholds
- Handle edge case: `value = 0` returns `{ display: "0", raw: "0", needsAbbreviation: false }`

**Dependencies**: None. Can run in parallel.

---

### T2: Stat Data

**Agent C**: `src/content/stat-data.ts`
- Define `StatData` interface
- Export `STATS` array with all 8 stat entries from the PRD
- Verify numeric literals use underscore separators for readability

**Dependencies**: None. Can run in parallel with T1.

---

### T3: StatCounter Component

**Agent D**: `src/components/StatCounter.tsx`
- Props: `{ target: number; durationMs?: number }`
- rAF animation from 0 → target with easeOutQuart
- Large number handling: animate coefficient + display suffix
- Cleanup: `cancelAnimationFrame` on unmount
- Uses easing.ts (T1) and number-format.ts (T1)

**Dependencies**: T1 (easing, number-format). Must wait.

---

### T4: StatCard Component

**Agent E**: `src/components/StatCard.tsx`
- Props: `{ stat: StatData }`
- Renders `StatCounter` + label + note
- Uses stat-data.ts (T2) for type
- CSS class names matching numbers.css (T6)

**Dependencies**: T2 (stat-data), T3 (StatCounter). Must wait.

---

### T5: NumbersPage Component

**Agent F**: `src/components/pages/NumbersPage.tsx`
- Replace current `PageSpread` wrapper
- Pretext title + credit via `layoutText()` from `spread-layout.ts`
- Stat grid rendering `StatCard` for each entry in `STATS`
- Resize handling: `window.resize` + `document.fonts.ready`
- Page number at bottom
- Uses stat-data.ts (T2), StatCard.tsx (T4)

**Dependencies**: T2 (stat-data), T4 (StatCard). Must wait.

---

### T6: Styles

**Agent G**: `src/styles/pages/numbers.css`
- Stat grid CSS Grid layout with responsive breakpoints
- Stat card styles with book palette colours
- Staggered card entrance animation
- Mobile responsive (<768px: single column)
- Remove old `.page--numbers .stat-number` and `.page--numbers .stat-label` rules (replaced by new card styles)

**Dependencies**: T4, T5 (to match class names). Can draft in parallel but needs final review after T5.

---

### T7: Integration + Cleanup

**Single agent**: 
- Update `src/App.tsx` — NumbersPage import stays the same (no change needed, component signature is identical)
- Remove old `PageSpread` usage from `NumbersPage.tsx` (handled in T5)
- Remove unused imports from `NumbersPage.tsx` (`SpreadConfig`, `IMG_HOUSEFLY_FOOT`, etc.)
- Verify `NUMBERS_PULL_QUOTE` and `NUMBERS_BODY` are no longer imported (unused in new layout)
- Test: navigate to Numbers page, verify title renders, 8 stat cards appear, counters animate from 0, large numbers show abbreviations, responsive on mobile

**Dependencies**: All previous tasks. Runs last.

---

## Acceptance Criteria Checklist

- [ ] NumbersPage does NOT import or render `PageSpread`
- [ ] Page title "By the Numbers" renders via `layoutText()` → positioned `<span>` elements
- [ ] Credit line "The scale of the insect world" renders below title
- [ ] 8 stat cards display in a CSS Grid layout
- [ ] Each counter animates from 0 → target on mount using easeOutQuart over ~2000ms
- [ ] Counters run once per mount (no looping, no re-trigger)
- [ ] Counters replay when navigating away and back (component remounts)
- [ ] Numbers <1 billion formatted with `Intl.NumberFormat` separators (e.g. "400,000")
- [ ] Numbers ≥1 billion show abbreviated form ("10 quintillion", "1.4 billion")
- [ ] Large numbers also show full raw number in smaller text below (e.g. "10,000,000,000,000,000,000")
- [ ] Each card displays: animated number, unit label, and explanatory note
- [ ] Card colours use book palette (ochre `#c4963a` for numbers, ink for labels)
- [ ] Cards have staggered fade-in entrance animation
- [ ] Mobile responsive: single-column grid at <768px, readable card sizes
- [ ] No TypeScript errors or lint warnings
- [ ] No runtime errors in browser console
- [ ] Old `PageSpread`-based NumbersPage code fully removed (no dead imports)

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Pretext title layout misaligned | Medium | Medium | Reuse exact same `layoutText()` call pattern from `PageSpread.tsx` with identical font constants |
| Large number coefficient animation precision loss | Low | Low | `parseFloat` on "10" from "10 quintillion" is exact. "1.4" also exact. No precision issue for current data |
| rAF animation jank on low-end devices | Low | Low | Single `rAF` per card, minimal DOM updates (one `<span>` text change). 8 cards × 60fps = trivial |
| Card grid overflow on narrow screens | Low | Medium | `auto-fit, minmax(280px, 1fr)` handles gracefully. Tested at 320px width |
| `STATS` array value exceeds `Number.MAX_SAFE_INTEGER` | **HIGH** | **HIGH** | `10_000_000_000_000_000_000` (10 quintillion) exceeds `2^53 - 1` (~9 quadrillion). **Must use string or BigInt workaround** — see Known Issues below |

---

## Known Issues & Resolutions

### CRITICAL: `10_000_000_000_000_000_000` exceeds `Number.MAX_SAFE_INTEGER`

JavaScript's `Number.MAX_SAFE_INTEGER` is `9,007,199,254,740,991` (~9 quadrillion). The value `10,000,000,000,000,000,000` (10 quintillion) **cannot be precisely represented** as a JavaScript `number`. It will lose precision.

**Resolution**: Store this value as a `string` in `stat-data.ts` and handle it specially:

```ts
// Option A: Store as string, parse as BigInt for display only
{ value: '10000000000000000000', label: 'insects alive right now', note: '10 quintillion' }

// The counter animates the coefficient (0 → 10), not the raw value
// The raw string is displayed as-is below the animated counter
// No numeric operations on the BigInt value needed
```

**StatData interface revision**:
```ts
export interface StatData {
  value: number | string  // string for values > MAX_SAFE_INTEGER
  label: string
  note: string
}
```

**In StatCounter**: If `typeof stat.value === 'string'`, treat it as a large number. Animate the coefficient only. Display the raw string as static text below.

**In number-format.ts**: `formatNumberWithAbbreviation` should accept `number | string`. For string inputs, return the raw string directly and compute the abbreviation display from the coefficient.

This is a **design-time decision** that must be implemented correctly — it cannot be deferred.

---

## Agent Execution Summary

| Task | Agent | Dependencies | Can Parallelize With |
|------|-------|-------------|---------------------|
| T1A: easing.ts | A | None | T1B, T2 |
| T1B: number-format.ts | B | None | T1A, T2 |
| T2: stat-data.ts | C | None | T1A, T1B |
| T3: StatCounter.tsx | D | T1A, T1B | — |
| T4: StatCard.tsx | E | T2, T3 | — |
| T5: NumbersPage.tsx | F | T2, T4 | T6 (draft) |
| T6: numbers.css | G | T4, T5 (class names) | T5 (draft in parallel) |
| T7: Integration | H | T1–T6 | — |

**Minimum critical path**: T1 → T3 → T4 → T5 → T7 (sequential)
**Parallel opportunities**: T1A + T1B + T2 can run simultaneously. T6 can draft while T5 is built.

**Estimated minimum phases**: 6 sequential waves with full parallelism:
1. Wave 1: T1A, T1B, T2 (parallel)
2. Wave 2: T3 (waits for T1)
3. Wave 3: T4 (waits for T2, T3)
4. Wave 4: T5 + T6 draft (waits for T4)
5. Wave 5: T6 final (waits for T5 class names)
6. Wave 6: T7 integration
