import { PageSpread } from '../PageSpread'
import type { SpreadConfig } from '../PageSpread'
import {
  ANTENNAE_TITLE,
  ANTENNAE_CREDIT,
  ANTENNAE_PULL_QUOTE,
  ANTENNAE_BODY,
  PAGES,
} from '../../content/entomology-text'
import { IMG_SATURNIID_MOTH } from '../../content/image-urls'

const config: SpreadConfig = {
  title: ANTENNAE_TITLE,
  credit: ANTENNAE_CREDIT,
  pullQuote: ANTENNAE_PULL_QUOTE,
  body: ANTENNAE_BODY,
  figure: {
    src: IMG_SATURNIID_MOTH,
    alt: 'Saturniid moth antennae, watercolor and ink',
    caption: 'Bipectinate antennae of a Saturniid moth — each branch a chemosensory array',
    placement: 'left',
  },
  pageNumber: PAGES[4].number,
}

export function AntennaePage() {
  return <PageSpread config={config} />
}
