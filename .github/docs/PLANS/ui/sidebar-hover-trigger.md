# PRD: Sidebar Hover Trigger Refinement

## Problem Statement

The collapsed sidebar (48px wide) expands whenever the user's pointer enters its area — even when they're just moving their cursor *past* it toward the content. This creates an annoying, unpredictable interaction where the sidebar pops open during normal mouse movement across the screen, obstructing the content the user is trying to read. Users have no way to deliberately open the sidebar to preview a page thumbnail without triggering it accidentally.

## Solution

Introduce a narrow 12px invisible "hot strip" on the left edge of the collapsed sidebar that acts as the **only** trigger for expansion. The sidebar should only open when the pointer intentionally enters this strip. When the user moves their pointer away from the expanded sidebar, it collapses after a graceful delay, giving them an escape zone to move through without the sidebar snapping shut. Touch and keyboard users get tap/click-to-toggle behavior on the collapsed bar itself.

## User Stories

1. As a reader browsing a page, I want to move my cursor freely across the content without the sidebar accidentally popping open, so that my reading experience isn't interrupted.
2. As a reader wanting to check another page's thumbnail, I want to hover the left edge of the screen to deliberately open the sidebar, so I can see thumbnails and labels before clicking.
3. As a reader navigating between pages, I want the sidebar to stay open while my cursor is over it, so I can comfortably select a different page.
4. As a reader who moves my cursor away from the sidebar, I want it to collapse after a short delay, so it doesn't snap shut on me while I'm still interacting near it.
5. As a touch device user, I want to tap the collapsed sidebar to expand it and tap again (or outside it) to collapse it, so I have the same navigation capability without hover.
6. As a keyboard user, I want to Tab to the sidebar and press Enter/Space to toggle it, so I can navigate without a mouse.
7. As a reader, I want the sidebar to clearly indicate which page I'm currently on (via the golden dot/number), so I have "you are here" feedback even in the collapsed state.
8. As a reader, I want the expand/collapse animation to feel snappy and intentional, so the interaction feels responsive and deliberate.

## Implementation Decisions

### 1. Hot Strip Trigger Zone
- **Width**: 12px on the left edge of the collapsed sidebar (within the existing 48px collapsed width).
- **Visibility**: Completely invisible — no visual indication, no chevron, no edge highlight.
- **Trigger**: `onMouseEnter` on the hot strip element sets `expanded = true`. This replaces the current `onMouseEnter` on the entire nav rail.
- **Implementation**: Add a dedicated `<div>` element positioned absolutely at `left: 0` within the nav rail, spanning full height, 12px wide. This element receives `onMouseEnter`.

### 2. Delayed Collapse with Escape Zone
- **Escape zone**: The pointer must leave the expanded sidebar area (280px) entirely.
- **Delay**: 400ms `setTimeout` before collapsing. Timer is cancelled if the pointer re-enters the sidebar or the hot strip before the delay expires.
- **Implementation**: Move `onMouseLeave` from the nav rail to the nav rail element itself (the full 280px when expanded). The 12px hot strip also gets `onMouseLeave` — if the pointer leaves the hot strip without entering the expanded area, the collapse timer starts.
- **Existing timeoutRef** pattern is reused — the 200ms delay becomes 400ms.

### 3. Touch & Keyboard Support
- **Touch**: The collapsed sidebar (48px) acts as a tap target. `onClick` toggles `expanded` state when `expanded === false`. When `expanded === true`, clicking outside collapses it (handled by a document-level click listener or by making the content area clickable).
- **Keyboard**: Add `tabIndex={0}` to the nav rail. Handle `onKeyDown` for `Enter` and `Space` to toggle `expanded`. Add `role="navigation"` and `aria-expanded` for accessibility.
- **Mouse detection**: Use a CSS `@media (hover: hover)` query or a one-time `onMouseMove` listener to detect mouse-capable devices, so the hot strip behavior is only active for actual mouse users.

### 4. Transition Animation (Slide-Out Reveal)
- **Animation style**: The 12px hot strip remains fixed in place. The remaining 268px of the sidebar slides out from behind it, like a drawer. The collapsed state visually shows only the 48px strip; the rest is hidden with `overflow: hidden` and `translateX` offset.
- **Duration**: 200ms with `cubic-bezier(0.4, 0, 0.2, 1)` easing (faster than current 300ms for snappier feel).
- **Implementation**: The nav-rail element maintains a fixed width of 48px (the visible strip). Inside it, the content panel (280px wide) uses `transform: translateX(...)` to slide in/out. The 12px hot strip is a sibling element positioned on top, outside the sliding content panel.

### 5. Active Item Visibility — No Change
- The collapsed state continues to show only page numbers/icons.
- The active page indicator (golden dot/glow on the number) provides sufficient "you are here" feedback.
- The main content area already displays the page title, so no tooltip or label is needed in collapsed state.

### 6. Component Structure
**NavigationRail.tsx** will be restructured:
```tsx
<nav className="nav-rail" role="navigation" aria-expanded={expanded} tabIndex={0}>
  {/* 12px invisible hot strip — always present */}
  <div className="nav-rail__hot-strip" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} />
  
  {/* Sliding content panel (48px collapsed → 280px expanded visual width) */}
  <div className={`nav-rail__content ${expanded ? 'nav-rail__content--open' : ''}`}>
    <div className="nav-rail__spine" />
    <div className="nav-rail__pages">
      {/* ... nav items ... */}
    </div>
  </div>
</nav>
```

### 7. Files to Modify
1. `src/components/NavigationRail.tsx` — Restructure event handlers, add hot strip element, add touch/keyboard toggle, restructure animation.
2. `src/styles/navigation.css` — Update `.nav-rail` styles: add `.nav-rail__hot-strip`, change width transition to slide-out transform, update timing to 200ms, add touch/keyboard interaction styles.
3. `src/styles/book.css` — Minor: ensure `.book-content` margin-left accounts for the fixed 48px collapsed width (no change needed if hot strip is within this zone).

### 8. Architecture Preservation
- `App.tsx` wiring remains unchanged — `currentPage` and `onPageSelect` props work as before.
- `BookShell.tsx` global `window.__bookNav` API is unaffected.
- `MobileNav.tsx` is unaffected (separate component for `max-width: 768px`).

## Testing Decisions

### What to Test
- **NavigationRail component behavior** (deep module — simple interface: `currentPage`, `onPageSelect` props):
  - Sidebar starts collapsed on mount.
  - Mouse entering the hot strip expands the sidebar.
  - Mouse leaving the expanded sidebar triggers collapse after 400ms delay.
  - Mouse re-entering before delay cancels collapse.
  - Click/tap on collapsed sidebar toggles expansion.
  - Keyboard Enter/Space toggles expansion when focused.
  - Active page item has correct visual indicator.
  - Clicking a nav item calls `onPageSelect` with correct page index.

### Testing Approach
- Use React Testing Library for component tests (user-event for mouse/keyboard simulation).
- Test external behavior through props and DOM attributes (`aria-expanded`), not internal state.
- Mock `setTimeout` for collapse delay testing.
- Prior art: check if existing tests exist for NavigationRail; if not, establish the first test file.

### Manual Testing Checklist
- [ ] Hovering 12px strip expands sidebar; hovering elsewhere does not.
- [ ] Moving pointer away from sidebar collapses it after ~400ms delay.
- [ ] Moving pointer back before delay cancels collapse.
- [ ] Tap on collapsed sidebar expands it on touch devices.
- [ ] Tab + Enter toggles sidebar for keyboard navigation.
- [ ] Slide-out animation plays smoothly at 200ms.
- [ ] Active page indicator is visible in collapsed state.
- [ ] Content area margin is unaffected (48px gap maintained).
- [ ] No accidental expansion when moving cursor past sidebar toward content.

## Out of Scope

- Adding tooltips to the collapsed sidebar showing page titles.
- Adding a visible chevron, pull handle, or edge highlight to the hot strip.
- Changing the mobile bottom navigation bar (MobileNav component).
- Modifying page transition animations.
- Adding global sidebar toggle button or hamburger menu.
- Persisting sidebar expanded/collapsed state across page reloads.
- Changing the color theme or visual design of the sidebar.
- Adding swipe gestures for sidebar expansion.

## Further Notes

- The slide-out drawer animation (Option C from design discussion) is a significant departure from the current CSS `width` transition. The nav-rail element stays at a constant 48px width (visible collapsed bar), while an inner content panel uses `transform: translateX()` for the slide effect.
- The 12px hot strip width was chosen as a balance between discoverability and avoiding false positives. It's roughly the width of a standard scrollbar grab — noticeable enough to hit intentionally but narrow enough to avoid accidental triggers.
- The 400ms collapse delay provides a comfortable escape zone. This is longer than the 200ms currently implemented to give users more forgiveness when moving between the sidebar and content.
- Touch detection via `onClick` on the collapsed state is simpler and more reliable than trying to detect device type. If a user clicks the 48px bar and it's collapsed, it expands — no ambiguity.

---

*Created: April 5, 2026*
*Status: Ready for Implementation*
*Theme: Midnight Entomology (Museum Cabinet Aesthetic)*
