import {
  COLOPHON_TITLE,
  COLOPHON_CREDIT,
  COLOPHON_BODY,
  PAGES,
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

export function ColophonPage() {
  return (
    <div className="page-spread">
      <header className="page-spread__header">
        <h1 className="page-title">{COLOPHON_TITLE}</h1>
        <p className="page-credit">{COLOPHON_CREDIT}</p>
      </header>
      <div className="page-spread__content">
        {renderBodyWithDropCap(COLOPHON_BODY)}
        <hr className="ornamental-rule" />
        <div className="colophon__seeds">
          <p className="page-credit" style={{ textAlign: 'center', marginBottom: '1rem' }}>
            Contents
          </p>
          <ul className="colophon__toc">
            {PAGES.map((page) => (
              <li key={page.id}>
                <span className="colophon__toc-number">{page.number}</span>
                <span className="colophon__toc-label">{page.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
