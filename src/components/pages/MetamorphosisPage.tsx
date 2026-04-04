import { PageSpread } from '../PageSpread'
import type { SpreadConfig } from '../PageSpread'
import {
  METAMORPHOSIS_TITLE,
  METAMORPHOSIS_CREDIT,
  METAMORPHOSIS_PULL_QUOTE,
  METAMORPHOSIS_BODY,
  PAGES,
} from '../../content/entomology-text'
import { IMG_BUTTERFLY_METAMORPHOSIS } from '../../content/image-urls'

const config: SpreadConfig = {
  title: METAMORPHOSIS_TITLE,
  credit: METAMORPHOSIS_CREDIT,
  pullQuote: METAMORPHOSIS_PULL_QUOTE,
  body: METAMORPHOSIS_BODY,
  figure: {
    src: IMG_BUTTERFLY_METAMORPHOSIS,
    alt: 'Butterfly metamorphosis triptych',
    caption: 'The three acts: larva, pupa, imago — dissolution and reconstruction',
    placement: 'wide',
  },
  pageNumber: PAGES[3].number,
}

export function MetamorphosisPage() {
  return <PageSpread config={config} />
}
