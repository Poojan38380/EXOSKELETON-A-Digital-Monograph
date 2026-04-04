import {
  WINGS_TITLE,
  WINGS_CREDIT,
  WINGS_PULL_QUOTE,
  WINGS_BODY,
} from '../../content/entomology-text'
import { IMG_DRAGONFLY_WING } from '../../content/image-urls'
import type { ReactNode } from 'react'

function renderBodyWithDropCap(text: string): ReactNode[] {
  const paragraphs = text.split('\n\n').filter(Boolean)
  return paragraphs.map((p, i) => {
    if (i === 0) {
      return (
        <p key={i}>
          <span className="drop-cap">{p[0]}</span>
          {p.slice(1)}
        </p>
      )
    }
    return <p key={i}>{p}</p>
  })
}

export function WingsPage() {
  return (
    <div className="page-spread">
      <header className="page-spread__header">
        <h1 className="page-title">{WINGS_TITLE}</h1>
        <p className="page-credit">{WINGS_CREDIT}</p>
      </header>
      <div className="page-spread__content">
        <figure className="page-figure page-figure--right">
          <img
            src={IMG_DRAGONFLY_WING}
            alt="Dragonfly wing venation, scientific engraving"
            className="page-figure__img"
          />
          <figcaption className="page-figure__caption">
            Wing venation of <em>Anax imperator</em> — the Emperor Dragonfly
          </figcaption>
        </figure>
        {renderBodyWithDropCap(WINGS_BODY)}
        <hr className="ornamental-rule" />
        <blockquote className="pull-quote">{WINGS_PULL_QUOTE}</blockquote>
      </div>
    </div>
  )
}
