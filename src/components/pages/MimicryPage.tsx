import { PageSpread } from '../PageSpread'
import type { SpreadConfig } from '../PageSpread'
import {
  MIMICRY_TITLE, MIMICRY_CREDIT, MIMICRY_PULL_QUOTE, MIMICRY_BODY, PAGES,
} from '../../content/entomology-text'
import { IMG_MONARCH_WING } from '../../content/image-urls'

const config: SpreadConfig = {
  title: MIMICRY_TITLE,
  credit: MIMICRY_CREDIT,
  pullQuote: MIMICRY_PULL_QUOTE,
  body: MIMICRY_BODY,
  figure: {
    src: IMG_MONARCH_WING,
    alt: 'Monarch butterfly wing scale close-up',
    caption: 'Monarch wing scales — colour from both pigment and physical nanostructure',
    placement: 'full',
  },
  pageNumber: PAGES[8].number,
}

export function MimicryPage() {
  return <PageSpread config={config} />
}
