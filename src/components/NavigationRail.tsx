import { useState, useRef, useEffect } from 'react'
import { PAGES } from '../content/entomology-text'

/* ── NavigationRail: collapsible spine nav with page thumbnails ── */

interface NavRailProps {
  currentPage: number
  onPageSelect: (page: number) => void
}

export function NavigationRail({ currentPage, onPageSelect }: NavRailProps) {
  const [expanded, setExpanded] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setExpanded(true)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setExpanded(false), 200)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return (
    <nav
      className={`nav-rail ${expanded ? 'nav-rail--expanded' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="nav-rail__spine" />
      <div className="nav-rail__pages">
        {PAGES.map((page, i) => (
          <button
            key={page.id}
            className={`nav-rail__item ${i === currentPage ? 'nav-rail__item--active' : ''}`}
            onClick={() => onPageSelect(i)}
            aria-label={`Go to page ${page.number}: ${page.label}`}
          >
            <span className="nav-rail__number">
              {i === currentPage ? '●' : page.number}
            </span>
            <span className="nav-rail__label">{page.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
