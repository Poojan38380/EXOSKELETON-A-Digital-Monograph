import { useState, useCallback } from 'react'
import { BookShell } from './components/BookShell'
import { NavigationRail } from './components/NavigationRail'
import { MobileNav } from './components/MobileNav'
import { CoverPage } from './components/pages/CoverPage'
import { WingsPage } from './components/pages/WingsPage'
import { CompoundEyePage } from './components/pages/CompoundEyePage'
import { MetamorphosisPage } from './components/pages/MetamorphosisPage'
import { AntennaePage } from './components/pages/AntennaePage'
import { ColophonPage } from './components/pages/ColophonPage'
import { PAGES } from './content/entomology-text'
import './index.css'
import './styles/book.css'
import './styles/navigation.css'

const PAGE_COMPONENTS = [
  CoverPage,
  WingsPage,
  CompoundEyePage,
  MetamorphosisPage,
  AntennaePage,
  ColophonPage,
]

const TOTAL_PAGES = PAGES.length

export default function App() {
  const [currentPage, setCurrentPage] = useState(0)

  const handlePageSelect = useCallback((page: number) => {
    // @ts-ignore — BookShell exposes window.__bookNav
    window.__bookNav?.navigateTo(page)
  }, [])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  return (
    <BookShell onPageChange={handlePageChange}>
      {(pageIndex) => {
        const PageComponent = PAGE_COMPONENTS[pageIndex] ?? CoverPage
        return (
          <>
            <NavigationRail currentPage={currentPage} onPageSelect={handlePageSelect} />
            <div className="book-content">
              <PageComponent />
            </div>
            <MobileNav
              currentPage={currentPage}
              total={TOTAL_PAGES}
              onPrev={() => handlePageSelect(currentPage - 1)}
              onNext={() => handlePageSelect(currentPage + 1)}
            />
          </>
        )
      }}
    </BookShell>
  )
}
