import { PAGES } from '../content/entomology-text'

interface MobileNavProps {
  currentPage: number
  total: number
  onPrev: () => void
  onNext: () => void
}

export function MobileNav({ currentPage, total, onPrev, onNext }: MobileNavProps) {
  const page = PAGES[currentPage]
  return (
    <nav className="mobile-nav">
      <div className="mobile-nav__inner">
        <button
          className="mobile-nav__btn"
          onClick={onPrev}
          disabled={currentPage === 0}
          aria-label="Previous page"
        >
          ‹
        </button>
        <span className="mobile-nav__page">
          {page ? `${page.number} — ${page.label}` : ''}
        </span>
        <button
          className="mobile-nav__btn"
          onClick={onNext}
          disabled={currentPage === total - 1}
          aria-label="Next page"
        >
          ›
        </button>
      </div>
    </nav>
  )
}
