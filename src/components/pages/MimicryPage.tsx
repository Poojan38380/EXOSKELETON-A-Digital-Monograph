import { PageSpread } from '../PageSpread'
import type { SpreadConfig } from '../PageSpread'
import {
  MIMICRY_TITLE, MIMICRY_CREDIT, MIMICRY_PULL_QUOTE, MIMICRY_BODY, PAGES,
} from '../../content/entomology-text'
import { IMG_MONARCH_WING, BG_DANAUS_PLEXIPPUS, BG_BEETLE_CARAPACE } from '../../content/image-urls'

const config: SpreadConfig = {
  title: MIMICRY_TITLE,
  credit: MIMICRY_CREDIT,
  pullQuote: MIMICRY_PULL_QUOTE,
  body: MIMICRY_BODY,
  figures: [
    {
      src: IMG_MONARCH_WING,
      alt: 'Monarch butterfly wing scale close-up',
      caption: 'Monarch wing scales — colour from both pigment and physical nanostructure',
      placement: 'full',
    },
    {
      src: BG_DANAUS_PLEXIPPUS,
      alt: 'Danaus plexippus - Monarch butterfly',
      caption: 'Monarch butterfly — toxic warning coloration mimicked by the viceroy',
      placement: 'left',
    },
    {
      src: BG_BEETLE_CARAPACE,
      alt: 'Beetle carapace showing structural coloration',
      caption: 'Beetle carapace — iridescent coloration from physical structure, not pigment',
      placement: 'right',
    },
  ],
  pageNumber: PAGES[8].number,
}

export function MimicryPage() {
  return <PageSpread config={config} />
}
