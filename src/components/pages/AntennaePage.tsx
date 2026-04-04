import {
  ANTENNAE_TITLE,
  ANTENNAE_CREDIT,
  ANTENNAE_PULL_QUOTE,
  ANTENNAE_BODY,
} from '../../content/entomology-text'
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

export function AntennaePage() {
  return (
    <div className="page-spread">
      <header className="page-spread__header">
        <h1 className="page-title">{ANTENNAE_TITLE}</h1>
        <p className="page-credit">{ANTENNAE_CREDIT}</p>
      </header>
      <div className="page-spread__content">
        {renderBodyWithDropCap(ANTENNAE_BODY)}
        <hr className="ornamental-rule" />
        <blockquote className="pull-quote">{ANTENNAE_PULL_QUOTE}</blockquote>
      </div>
    </div>
  )
}
