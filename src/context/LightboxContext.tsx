import { createContext, useContext, type ReactNode } from 'react'
import { useLightbox } from '../hooks/useLightbox'

interface LightboxContextValue {
  openLightbox: (src: string, alt?: string) => void
}

const LightboxContext = createContext<LightboxContextValue | undefined>(undefined)

/**
 * Hook to access the global lightbox
 * Must be used within a LightboxProvider
 */
export function useGlobalLightbox(): LightboxContextValue {
  const context = useContext(LightboxContext)
  if (!context) {
    throw new Error('useGlobalLightbox must be used within a LightboxProvider')
  }
  return context
}

/**
 * Provider component that makes lightbox available throughout the app
 */
export function LightboxProvider({ children }: { children: ReactNode }) {
  const { lightbox, openLightbox, closeLightbox } = useLightbox()

  return (
    <LightboxContext.Provider value={{ openLightbox }}>
      {children}
      {lightbox.src && (
        <ImageLightbox
          src={lightbox.src}
          alt={lightbox.alt}
          isOpen={lightbox.isOpen}
          onClose={closeLightbox}
        />
      )}
    </LightboxContext.Provider>
  )
}

// Import here to avoid circular dependency
import { ImageLightbox } from '../components/ImageLightbox'
