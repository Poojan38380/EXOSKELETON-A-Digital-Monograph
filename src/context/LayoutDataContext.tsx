import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { PositionedLine } from '../components/spread-layout'
import type { Rect } from '../layout-engine/wrap-geometry'

export interface LayoutData {
  bodyLines: PositionedLine[]
  titleLines: PositionedLine[]
  pullQuoteBlock: { x: number; y: number; width: number; height: number } | null
  figureRect: Rect | null
}

interface LayoutDataContextType {
  layout: LayoutData | null
  registerLayout: (data: LayoutData) => void
}

const LayoutDataContext = createContext<LayoutDataContextType | undefined>(undefined)

export function LayoutDataProvider({ children }: { children: ReactNode }) {
  const [layout, setLayout] = useState<LayoutData | null>(null)

  const registerLayout = useCallback((data: LayoutData) => {
    setLayout(data)
  }, [])

  return (
    <LayoutDataContext.Provider value={{ layout, registerLayout }}>
      {children}
    </LayoutDataContext.Provider>
  )
}

export function useLayoutData() {
  const context = useContext(LayoutDataContext)
  if (!context) {
    throw new Error('useLayoutData must be used within a LayoutDataProvider')
  }
  return context
}
