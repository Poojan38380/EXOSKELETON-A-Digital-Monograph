import { PageSpread } from '../PageSpread'
import type { SpreadConfig } from '../PageSpread'
import {
  METAMORPHOSIS_TITLE,
  METAMORPHOSIS_CREDIT,
  METAMORPHOSIS_PULL_QUOTE,
  METAMORPHOSIS_BODY,
  PAGES,
} from '../../content/entomology-text'
import { IMG_BUTTERFLY_METAMORPHOSIS, IMG_SATURNIID_MOTH, IMG_SILKWORM_COCOONS } from '../../content/image-urls'

const config: SpreadConfig = {
  title: METAMORPHOSIS_TITLE,
  credit: METAMORPHOSIS_CREDIT,
  pullQuote: METAMORPHOSIS_PULL_QUOTE,
  body: METAMORPHOSIS_BODY,
  figures: [
    {
      src: IMG_BUTTERFLY_METAMORPHOSIS,
      alt: 'Butterfly metamorphosis triptych',
      caption: 'The three acts: larva, pupa, imago — dissolution and reconstruction',
      placement: 'wide',
    },
    {
      src: IMG_SATURNIID_MOTH,
      alt: 'Saturniid moth showing complete metamorphosis',
      caption: 'Saturniid moth — the adult stage after extraordinary transformation',
      placement: 'right',
    },
    {
      src: IMG_SILKWORM_COCOONS,
      alt: 'Silkworm cocoons',
      caption: 'Silkworm cocoons — each one containing a transforming pupa',
      placement: 'left',
    },
  ],
  pageNumber: PAGES[3].number,
}

export function MetamorphosisPage() {
  return <PageSpread config={config} />
}
