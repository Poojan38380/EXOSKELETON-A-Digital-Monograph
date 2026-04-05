import { useState, useCallback, useEffect } from 'react'

interface LightboxState {
  isOpen: boolean
  src: string | null
  alt: string
}

interface UseLightboxReturn {
  lightbox: LightboxState
  openLightbox: (src: string, alt?: string) => void
  closeLightbox: () => void
}

/**
 * Hook to manage lightbox state for full-screen image viewing
 * Provides open/close functions and current lightbox state
 */
export function useLightbox(): UseLightboxReturn {
  const [lightbox, setLightbox] = useState<LightboxState>({
    isOpen: false,
    src: null,
    alt: '',
  })

  const openLightbox = useCallback((src: string, alt: string = '') => {
    setLightbox({ isOpen: true, src, alt })
  }, [])

  const closeLightbox = useCallback(() => {
    setLightbox({ isOpen: false, src: null, alt: '' })
  }, [])

  // Close lightbox on ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && lightbox.isOpen) {
        closeLightbox()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightbox.isOpen, closeLightbox])

  return { lightbox, openLightbox, closeLightbox }
}
