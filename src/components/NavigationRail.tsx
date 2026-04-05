import { useRef, useEffect, useCallback } from 'react'
import { useLayout } from '../context/LayoutContext'
import { PAGES } from '../content/entomology-text'
import {
  IMG_JEWEL_BEETLE, IMG_DRAGONFLY_WING, IMG_HORSEFLY_EYE,
  IMG_BUTTERFLY_METAMORPHOSIS, IMG_SATURNIID_MOTH,
  IMG_HOUSEFLY_FOOT, IMG_ANTARCTIC_MIDGE, IMG_DUNG_BEETLE,
  IMG_MONARCH_WING, IMG_MOSQUITO_PROBOSCIS,
} from '../content/image-urls'

/* One representative image per page for the nav rail thumbnails */
const PAGE_THUMB = [
  IMG_JEWEL_BEETLE,          // 1  Cover
  IMG_DRAGONFLY_WING,        // 2  Wings
  IMG_HORSEFLY_EYE,          // 3  Vision
  IMG_BUTTERFLY_METAMORPHOSIS,// 4  Metamorphosis
  IMG_SATURNIID_MOTH,        // 5  Antennae
  IMG_HOUSEFLY_FOOT,         // 6  By the Numbers
  IMG_ANTARCTIC_MIDGE,       // 7  Records
  IMG_DUNG_BEETLE,           // 8  Strange Behavior
  IMG_MONARCH_WING,          // 9  Mimicry
  IMG_MOSQUITO_PROBOSCIS,    // 10 Insects & Humans
  '',                        // 11 Colophon — no image
]

/* ── NavigationRail: collapsible spine nav with page thumbnails ── */

interface NavRailProps {
  currentPage: number
  onPageSelect: (page: number) => void
}

export function NavigationRail({ currentPage, onPageSelect }: NavRailProps) {
  const { navExpanded: expanded, setNavExpanded } = useLayout()
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleMouseEnter = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setNavExpanded(true)
  }, [setNavExpanded])

  const handleMouseLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => setNavExpanded(false), 200)
  }, [setNavExpanded])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return (
    <nav
      className={`nav-rail ${expanded ? 'nav-rail--expanded' : 'nav-rail--collapsed'}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="nav-rail__spine" />
      <div className="nav-rail__pages">
        {PAGES.map((page, i) => (
          <button
            key={page.id}
            className={`nav-rail__item ${i === currentPage ? 'nav-rail__item--active' : ''}`}
            onClick={() => {
              onPageSelect(i)
              setNavExpanded(false)
              if (timeoutRef.current) clearTimeout(timeoutRef.current)
            }}
            aria-label={`Go to page ${page.number}: ${page.label}`}
          >
            <span className="nav-rail__number">
              {i === currentPage ? '●' : page.number}
            </span>
            <span className="nav-rail__thumb-wrap">
              <img src={PAGE_THUMB[i]} alt="" className="nav-rail__thumb" />
            </span>
            <span className="nav-rail__label">{page.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
