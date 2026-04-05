import { PageSpread } from '../PageSpread'
import type { SpreadConfig } from '../PageSpread'
import {
  BEHAVIOR_TITLE, BEHAVIOR_CREDIT, BEHAVIOR_PULL_QUOTE, BEHAVIOR_BODY, PAGES,
} from '../../content/entomology-text'
import { IMG_DUNG_BEETLE, BG_INSECT_BEHAVIOR, BG_STAG_BEETLE } from '../../content/image-urls'

const config: SpreadConfig = {
  title: BEHAVIOR_TITLE,
  credit: BEHAVIOR_CREDIT,
  pullQuote: BEHAVIOR_PULL_QUOTE,
  body: BEHAVIOR_BODY,
  figures: [
    {
      src: IMG_DUNG_BEETLE,
      alt: 'Dung beetle rolling dung ball, scientific illustration',
      caption: 'Dung beetles imported to Australia to process cattle droppings — an ecosystem service delivered by insects',
      placement: 'right',
    },
    {
      src: BG_INSECT_BEHAVIOR,
      alt: 'Insect behavior in natural habitat',
      caption: 'Insects in their natural environment — complex behaviors beyond simple instinct',
      placement: 'left',
    },
    {
      src: BG_STAG_BEETLE,
      alt: 'Stag beetle displaying mandibles',
      caption: 'Stag beetle mandibles — weapons in male competition rituals',
      placement: 'right',
    },
  ],
  pageNumber: PAGES[7].number,
}

export function BehaviorPage() {
  return <PageSpread config={config} />
}
