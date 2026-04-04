import { PageSpread } from '../PageSpread'
import type { SpreadConfig } from '../PageSpread'
import {
  NUMBERS_TITLE, NUMBERS_CREDIT, NUMBERS_PULL_QUOTE, NUMBERS_BODY, PAGES,
} from '../../content/entomology-text'
import { IMG_HOUSEFLY_FOOT } from '../../content/image-urls'

const config: SpreadConfig = {
  title: NUMBERS_TITLE,
  credit: NUMBERS_CREDIT,
  pullQuote: NUMBERS_PULL_QUOTE,
  body: NUMBERS_BODY,
  figure: {
    src: IMG_HOUSEFLY_FOOT,
    alt: 'Housefly foot macro, SEM photograph',
    caption: 'Tarsal chemoreceptors — ten million times more sensitive to sugar than the human tongue',
    placement: 'right',
  },
  pageNumber: PAGES[5].number,
}

export function NumbersPage() {
  return <PageSpread config={config} />
}
