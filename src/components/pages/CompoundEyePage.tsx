import { PageSpread } from '../PageSpread'
import type { SpreadConfig } from '../PageSpread'
import {
  COMPOUND_EYE_TITLE,
  COMPOUND_EYE_CREDIT,
  COMPOUND_EYE_PULL_QUOTE,
  COMPOUND_EYE_BODY,
  PAGES,
} from '../../content/entomology-text'
import { IMG_HORSEFLY_EYE } from '../../content/image-urls'

const config: SpreadConfig = {
  title: COMPOUND_EYE_TITLE,
  credit: COMPOUND_EYE_CREDIT,
  pullQuote: COMPOUND_EYE_PULL_QUOTE,
  body: COMPOUND_EYE_BODY,
  figure: {
    src: IMG_HORSEFLY_EYE,
    alt: 'Horsefly compound eye, macro photograph',
    caption: 'Ommatidia of a horsefly — each facet an independent optical instrument',
    placement: 'full',
  },
  pageNumber: PAGES[2].number,
}

export function CompoundEyePage() {
  return <PageSpread config={config} />
}
