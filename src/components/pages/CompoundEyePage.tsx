import {
  COMPOUND_EYE_TITLE,
  COMPOUND_EYE_CREDIT,
  COMPOUND_EYE_PULL_QUOTE,
  COMPOUND_EYE_BODY,
} from '../../content/entomology-text'
import { IMG_HORSEFLY_EYE } from '../../content/image-urls'
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

export function CompoundEyePage() {
  return (
    <div className="page-spread">
      <header className="page-spread__header">
        <h1 className="page-title">{COMPOUND_EYE_TITLE}</h1>
        <p className="page-credit">{COMPOUND_EYE_CREDIT}</p>
      </header>
      <div className="page-spread__content">
        <figure className="page-figure page-figure--full">
          <img
            src={IMG_HORSEFLY_EYE}
            alt="Horsefly compound eye, macro photograph"
            className="page-figure__img"
          />
          <figcaption className="page-figure__caption">
            Ommatidia of a horsefly — each facet an independent optical instrument
          </figcaption>
        </figure>
        {renderBodyWithDropCap(COMPOUND_EYE_BODY)}
        <hr className="ornamental-rule" />
        <blockquote className="pull-quote">{COMPOUND_EYE_PULL_QUOTE}</blockquote>
      </div>
    </div>
  )
}
