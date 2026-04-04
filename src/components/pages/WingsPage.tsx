import { PageSpread } from '../PageSpread'
import type { SpreadConfig } from '../PageSpread'
import {
  WINGS_TITLE,
  WINGS_CREDIT,
  WINGS_PULL_QUOTE,
  WINGS_BODY,
  PAGES,
} from '../../content/entomology-text'
import { IMG_DRAGONFLY_WING } from '../../content/image-urls'

const config: SpreadConfig = {
  title: WINGS_TITLE,
  credit: WINGS_CREDIT,
  pullQuote: WINGS_PULL_QUOTE,
  body: WINGS_BODY,
  figure: {
    src: IMG_DRAGONFLY_WING,
    alt: 'Dragonfly wing venation, scientific engraving',
    caption: 'Wing venation of \u{1D434}\u{1D45B}\u{1D44E}\u{1D465} \u{1D456}\u{1D45A}\u{1D45D}\u{1D452}\u{1D45F}\u{1D44E}\u{1D461}\u{1D45C}\u{1D45F} — the Emperor Dragonfly',
    placement: 'right',
  },
  pageNumber: PAGES[1].number,
}

export function WingsPage() {
  return <PageSpread config={config} />
}
