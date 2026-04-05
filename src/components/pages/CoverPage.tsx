import { COVER_TITLE, COVER_SUBTITLE, COVER_YEAR } from '../../content/entomology-text'
import { IMG_JEWEL_BEETLE } from '../../content/image-urls'
import { useGlobalLightbox } from '../../context/LightboxContext'

export function CoverPage() {
  const { openLightbox } = useGlobalLightbox()

  return (
    <div className="cover">
      <div className="cover__image-wrap">
        <img
          className="cover__image cover__image--clickable"
          src={IMG_JEWEL_BEETLE}
          alt="Jewel Beetle elytron, macro photograph"
          onClick={() => openLightbox(IMG_JEWEL_BEETLE, 'Jewel Beetle elytron, macro photograph')}
        />
        <div className="cover__image-overlay" />
      </div>
      <div className="cover__content">
        <h1 className="cover__title">{COVER_TITLE}</h1>
        <hr className="cover__rule" />
        <p className="cover__subtitle">{COVER_SUBTITLE}</p>
        <p className="cover__year">{COVER_YEAR}</p>
      </div>
    </div>
  )
}
