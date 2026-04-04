import { PageSpread } from '../PageSpread'
import type { SpreadConfig } from '../PageSpread'
import {
  HUMANS_TITLE, HUMANS_CREDIT, HUMANS_PULL_QUOTE, HUMANS_BODY, PAGES,
} from '../../content/entomology-text'
import { IMG_MOSQUITO_PROBOSCIS } from '../../content/image-urls'

const config: SpreadConfig = {
  title: HUMANS_TITLE,
  credit: HUMANS_CREDIT,
  pullQuote: HUMANS_PULL_QUOTE,
  body: HUMANS_BODY,
  figure: {
    src: IMG_MOSQUITO_PROBOSCIS,
    alt: 'Mosquito proboscis cross-section, anatomical illustration',
    caption: '*Aedes aegypti* proboscis — the vector for dengue, Zika, and yellow fever',
    placement: 'right',
  },
  pageNumber: PAGES[9].number,
}

export function HumansPage() {
  return <PageSpread config={config} />
}
