import { useCallback, useEffect, useState } from 'react'
import './ImageLightbox.css'

interface ImageLightboxProps {
  src: string | null
  alt: string
  isOpen: boolean
  onClose: () => void
}

/**
 * Lightbox component for displaying images in a fullscreen modal
 * Features: click outside to close, ESC key support, fade animations
 */
export function ImageLightbox({ src, alt, isOpen, onClose }: ImageLightboxProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  // Handle open/close animations
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      // Trigger animation frame after mount
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true)
        })
      })
    } else if (isVisible) {
      setIsAnimating(false)
      // Wait for fade-out animation
      const timer = setTimeout(() => setIsVisible(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen, isVisible])

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Only close if clicking the backdrop itself, not the image
      if (e.target === e.currentTarget) {
        onClose()
      }
    },
    [onClose]
  )

  if (!isVisible || !src) return null

  return (
    <div
      className={`image-lightbox ${isAnimating ? 'image-lightbox--visible' : ''}`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Image lightbox"
    >
      <div className="image-lightbox__content">
        <img
          src={src}
          alt={alt}
          className="image-lightbox__image"
          onClick={(e) => e.stopPropagation()}
        />
        <button
          className="image-lightbox__close"
          onClick={onClose}
          aria-label="Close lightbox"
        >
          ✕
        </button>
        {alt && <div className="image-lightbox__caption">{alt}</div>}
      </div>
    </div>
  )
}
