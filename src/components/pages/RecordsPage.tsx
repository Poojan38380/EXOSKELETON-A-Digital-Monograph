import { PageSpread } from '../PageSpread'
import type { SpreadConfig } from '../PageSpread'
import {
  RECORDS_TITLE, RECORDS_CREDIT, RECORDS_PULL_QUOTE, RECORDS_BODY, PAGES,
} from '../../content/entomology-text'
import { IMG_ANTARCTIC_MIDGE, BG_INSECT_LEG, BG_INSECT_MACRO } from '../../content/image-urls'

const config: SpreadConfig = {
  title: RECORDS_TITLE,
  credit: RECORDS_CREDIT,
  pullQuote: RECORDS_PULL_QUOTE,
  body: RECORDS_BODY,
  figures: [
    {
      src: IMG_ANTARCTIC_MIDGE,
      alt: 'Antarctic wingless midge, scientific illustration',
      caption: 'Belgica antarctica — the only insect native to Antarctica, surviving on glycerol antifreeze',
      placement: 'left',
    },
    {
      src: BG_INSECT_LEG,
      alt: 'Insect leg showing specialized structures',
      caption: 'Insect leg — jointed lever system adapted for specific ecological roles',
      placement: 'right',
    },
    {
      src: BG_INSECT_MACRO,
      alt: 'Insect macro detail showing exoskeleton texture',
      caption: 'Exoskeleton detail — the armored exterior that protects and supports',
      placement: 'left',
    },
  ],
  pageNumber: PAGES[6].number,
}

export function RecordsPage() {
  return <PageSpread config={config} />
}
