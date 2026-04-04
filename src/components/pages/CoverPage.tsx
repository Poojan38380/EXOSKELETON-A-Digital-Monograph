import { COVER_TITLE, COVER_SUBTITLE, COVER_YEAR } from '../../content/entomology-text'

export function CoverPage() {
  return (
    <div className="cover">
      <h1 className="cover__title">{COVER_TITLE}</h1>
      <hr className="cover__rule" />
      <p className="cover__subtitle">{COVER_SUBTITLE}</p>
      <p className="cover__year">{COVER_YEAR}</p>
    </div>
  )
}
