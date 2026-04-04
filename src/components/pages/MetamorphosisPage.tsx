import {
  METAMORPHOSIS_TITLE,
  METAMORPHOSIS_CREDIT,
  METAMORPHOSIS_PULL_QUOTE,
  METAMORPHOSIS_BODY,
} from '../../content/entomology-text'
import { IMG_BUTTERFLY_METAMORPHOSIS } from '../../content/image-urls'
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

export function MetamorphosisPage() {
  return (
    <div className="page-spread">
      <header className="page-spread__header">
        <h1 className="page-title">{METAMORPHOSIS_TITLE}</h1>
        <p className="page-credit">{METAMORPHOSIS_CREDIT}</p>
      </header>
      <div className="page-spread__content">
        <figure className="page-figure page-figure--wide">
          <img
            src={IMG_BUTTERFLY_METAMORPHOSIS}
            alt="Butterfly metamorphosis triptych"
            className="page-figure__img"
          />
          <figcaption className="page-figure__caption">
            The three acts: larva, pupa, imago — dissolution and reconstruction
          </figcaption>
        </figure>
        {renderBodyWithDropCap(METAMORPHOSIS_BODY)}
        <hr className="ornamental-rule" />
        <blockquote className="pull-quote">{METAMORPHOSIS_PULL_QUOTE}</blockquote>
      </div>
    </div>
  )
}
