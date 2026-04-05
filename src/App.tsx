import { useState, useCallback } from 'react'
import { BookShell } from './components/BookShell'
import { NavigationRail } from './components/NavigationRail'
import { MobileNav } from './components/MobileNav'
import { PageReveal } from './components/PageReveal'
import { LayoutProvider, useLayout } from './context/LayoutContext'
import { PageThemeProvider } from './context/PageThemeContext'
import { CoverPage } from './components/pages/CoverPage'
import { WingsPage } from './components/pages/WingsPage'
import { CompoundEyePage } from './components/pages/CompoundEyePage'
import { MetamorphosisPage } from './components/pages/MetamorphosisPage'
import { AntennaePage } from './components/pages/AntennaePage'
import { NumbersPage } from './components/pages/NumbersPage'
import { RecordsPage } from './components/pages/RecordsPage'
import { BehaviorPage } from './components/pages/BehaviorPage'
import { MimicryPage } from './components/pages/MimicryPage'
import { HumansPage } from './components/pages/HumansPage'
import { ColophonPage } from './components/pages/ColophonPage'
import { PAGES } from './content/entomology-text'
import './index.css'
import './styles/book.css'
import './styles/navigation.css'
import './styles/depth.css'
import './styles/animations.css'
import './styles/pages/cover.css'
import './styles/pages/wings.css'
import './styles/pages/vision.css'
import './styles/pages/metamorphosis.css'
import './styles/pages/antennae.css'
import './styles/pages/numbers.css'
import './styles/pages/records.css'
import './styles/pages/behavior.css'
import './styles/pages/mimicry.css'
import './styles/pages/humans.css'
import './styles/pages/colophon.css'

const PAGE_COMPONENTS = [
  CoverPage,
  WingsPage,
  CompoundEyePage,
  MetamorphosisPage,
  AntennaePage,
  NumbersPage,
  RecordsPage,
  BehaviorPage,
  MimicryPage,
  HumansPage,
  ColophonPage,
]

const PAGE_IDS = [
  'cover',
  'wings',
  'vision',
  'metamorphosis',
  'antennae',
  'numbers',
  'records',
  'behavior',
  'mimicry',
  'humans',
  'colophon',
]

const TOTAL_PAGES = PAGES.length

export default function App() {
  return (
    <LayoutProvider>
      <AppContent />
    </LayoutProvider>
  )
}

function AppContent() {
  const [currentPage, setCurrentPage] = useState(0)
  const { navExpanded } = useLayout()

  const handlePageSelect = useCallback((page: number) => {
    // @ts-ignore — BookShell exposes window.__bookNav
    window.__bookNav?.navigateTo(page)
  }, [])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  return (
    <BookShell
      onPageChange={handlePageChange}
      sidebar={
        <NavigationRail
          currentPage={currentPage}
          onPageSelect={handlePageSelect}
        />
      }
    >
      {(pageIndex) => {
        const PageComponent = PAGE_COMPONENTS[pageIndex] ?? CoverPage
        const pageId = PAGE_IDS[pageIndex] ?? 'cover'
        return (
          <PageThemeProvider pageIndex={pageIndex} pageId={pageId}>
            <div
              className="book-content"
              style={{
                marginLeft: navExpanded ? 280 : 48,
                transition: 'margin-left 300ms cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <PageReveal>
                <PageComponent />
              </PageReveal>
            </div>
            <MobileNav
              currentPage={currentPage}
              total={TOTAL_PAGES}
              onPrev={() => handlePageSelect(currentPage - 1)}
              onNext={() => handlePageSelect(currentPage + 1)}
            />
          </PageThemeProvider>
        )
      }}
    </BookShell>
  )
}
