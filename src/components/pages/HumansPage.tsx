import { PageSpread } from '../PageSpread'
import type { SpreadConfig } from '../PageSpread'
import {
  HUMANS_TITLE, HUMANS_CREDIT, HUMANS_PULL_QUOTE, HUMANS_BODY, PAGES,
} from '../../content/entomology-text'
import { IMG_MOSQUITO_PROBOSCIS, IMG_BLOW_FLY, BG_ANT_LIFTING } from '../../content/image-urls'

const config: SpreadConfig = {
  title: HUMANS_TITLE,
  credit: HUMANS_CREDIT,
  pullQuote: HUMANS_PULL_QUOTE,
  body: HUMANS_BODY,
  figures: [
    {
      src: IMG_MOSQUITO_PROBOSCIS,
      alt: 'Mosquito proboscis cross-section, anatomical illustration',
      caption: 'Aedes aegypti proboscis — the vector for dengue, Zika, and yellow fever',
      placement: 'right',
    },
    {
      src: IMG_BLOW_FLY,
      alt: 'Blow fly used in forensic entomology',
      caption: 'Blow fly — the first responder at death scenes, providing time-of-death evidence',
      placement: 'left',
    },
    {
      src: BG_ANT_LIFTING,
      alt: 'Ant demonstrating extraordinary strength',
      caption: 'Ants can carry 50 times their body weight — biomechanics that inspire robotics',
      placement: 'right',
    },
  ],
  pageNumber: PAGES[9].number,
}

export function HumansPage() {
  return <PageSpread config={config} />
}
