import { useState, useCallback, useEffect, useRef, type ReactNode } from 'react'
import { PAGES } from '../content/entomology-text'

const TOTAL_PAGES = PAGES.length

/* ── BookShell: manages page state, keyboard/touch nav, page turn animation ── */

export function BookShell({
  children,
  sidebar,
  onPageChange,
}: {
  children: (pageIndex: number) => ReactNode
  sidebar?: ReactNode
  onPageChange?: (page: number) => void
}) {
  const [pageIndex, setPageIndex] = useState(0)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [transitioning, setTransitioning] = useState(false)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)

  const navigateTo = useCallback((nextIndex: number) => {
    if (transitioning || nextIndex === pageIndex) return
    if (nextIndex < 0 || nextIndex >= TOTAL_PAGES) return
    // Scroll all scroll containers to top before transitioning
    window.scrollTo(0, 0)
    const pageEl = document.querySelector('.book-page')
    if (pageEl) pageEl.scrollTop = 0
    setTransitioning(true)
    setIsInitialLoad(false)
    onPageChange?.(nextIndex)
    setPageIndex(nextIndex)
    setTimeout(() => setTransitioning(false), 550)
  }, [pageIndex, transitioning, onPageChange])

  const goNext = useCallback(() => navigateTo(pageIndex + 1), [navigateTo, pageIndex])
  const goPrev = useCallback(() => navigateTo(pageIndex - 1), [navigateTo, pageIndex])

  // ── Keyboard navigation ──────────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault()
        goNext()
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault()
        goPrev()
      } else if (e.key === 'Home') {
        e.preventDefault()
        navigateTo(0)
      } else if (e.key === 'End') {
        e.preventDefault()
        navigateTo(TOTAL_PAGES - 1)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [goNext, goPrev, navigateTo])

  // ── Touch swipe detection ────────────────────────────────────────────
  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0]!.clientX
      touchStartY.current = e.touches[0]!.clientY
    }
    const onTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0]!.clientX - touchStartX.current
      const dy = e.changedTouches[0]!.clientY - touchStartY.current
      if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx)) return
      if (dx < 0) goNext()
      else goPrev()
    }
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [goNext, goPrev])

  // ── Expose navigation globally for nav rail ──────────────────────────
  useEffect(() => {
    // @ts-ignore — simple global for nav rail communication
    window.__bookNav = { navigateTo, goNext, goPrev, pageIndex: () => pageIndex }
    return () => {
      // @ts-ignore
      delete window.__bookNav
    }
  }, [navigateTo, goNext, goPrev, pageIndex])

  return (
    <div className="book-container">
      {sidebar}
      <div
        className={`book-page ${isInitialLoad ? '' : 'page-enter'}`}
        key={pageIndex}
      >
        {children(pageIndex)}
      </div>
    </div>
  )
}
