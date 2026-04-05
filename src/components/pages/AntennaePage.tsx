import { PageSpread } from '../PageSpread'
import type { SpreadConfig } from '../PageSpread'
import {
  ANTENNAE_TITLE,
  ANTENNAE_CREDIT,
  ANTENNAE_PULL_QUOTE,
  ANTENNAE_BODY,
  PAGES,
} from '../../content/entomology-text'
import { IMG_SATURNIID_MOTH, IMG_MOSQUITO_PROBOSCIS, BG_VINTAGE_COLLECTION } from '../../content/image-urls'
import { PheromoneCanvas } from '../PheromoneCanvas'

const config: SpreadConfig = {
  title: ANTENNAE_TITLE,
  credit: ANTENNAE_CREDIT,
  pullQuote: ANTENNAE_PULL_QUOTE,
  body: ANTENNAE_BODY,
  figures: [
    {
      src: IMG_SATURNIID_MOTH,
      alt: 'Saturniid moth antennae, watercolor and ink',
      caption: 'Bipectinate antennae of a Saturniid moth — each branch a chemosensory array',
      placement: 'left',
    },
    {
      src: IMG_MOSQUITO_PROBOSCIS,
      alt: 'Mosquito proboscis with sensory structures',
      caption: 'Mosquito antennae and proboscis — detecting CO₂ and chemical cues from meters away',
      placement: 'right',
    },
    {
      src: BG_VINTAGE_COLLECTION,
      alt: 'Vintage insect collection display',
      caption: 'Historical entomological collection — centuries of insect study documented',
      placement: 'full',
    },
  ],
  pageNumber: PAGES[4].number,
}

export function AntennaePage() {
  return (
    <div style={{ position: 'relative', overflow: 'visible' }}>
      <PageSpread config={config} />
      <PheromoneCanvas />
    </div>
  )
}
