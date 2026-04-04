import { PageSpread } from '../PageSpread'
import type { SpreadConfig } from '../PageSpread'
import {
  COLOPHON_TITLE, COLOPHON_CREDIT, COLOPHON_BODY, PAGES,
} from '../../content/entomology-text'

const config: SpreadConfig = {
  title: COLOPHON_TITLE,
  credit: COLOPHON_CREDIT,
  body: COLOPHON_BODY,
  pageNumber: PAGES[10].number,
  bottomReserve: 420,
}

export function ColophonPage() {
  return (
    <PageSpread config={config}>
      <div className="colophon__toc-wrap">
        <p className="page-credit" style={{ textAlign: 'center', marginBottom: '1rem' }}>
          Contents
        </p>
        <ul className="colophon__toc">
          {PAGES.map((page) => (
            <li key={page.id}>
              <span
                className="colophon__toc-link"
                onClick={() => {
                  // @ts-ignore
                  window.__bookNav?.navigateTo(page.id)
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    // @ts-ignore
                    window.__bookNav?.navigateTo(page.id)
                  }
                }}
              >
                <span className="colophon__toc-number">{page.number}</span>
                <span className="colophon__toc-label">{page.label}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </PageSpread>
  )
}
