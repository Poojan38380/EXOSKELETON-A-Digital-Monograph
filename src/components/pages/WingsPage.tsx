import {
  WINGS_TITLE,
  WINGS_CREDIT,
  WINGS_PULL_QUOTE,
  WINGS_BODY,
} from '../../content/entomology-text'
import type { ReactNode } from 'react'

/* Shared helper for rendering body paragraphs with a drop cap */
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
        {renderBodyWithDropCap(WINGS_BODY)}
        <hr className="ornamental-rule" />
        <blockquote className="pull-quote">{WINGS_PULL_QUOTE}</blockquote>
      </div>
    </div>
  )
}
