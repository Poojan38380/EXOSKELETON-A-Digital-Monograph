import { PageSpread } from '../PageSpread'
import type { SpreadConfig } from '../PageSpread'
import {
  COMPOUND_EYE_TITLE,
  COMPOUND_EYE_CREDIT,
  COMPOUND_EYE_PULL_QUOTE,
  COMPOUND_EYE_BODY,
  PAGES,
} from '../../content/entomology-text'
import { IMG_HORSEFLY_EYE, BG_COMPOUND_EYE, BG_AEDES_PROBOSCIS } from '../../content/image-urls'
import { CompoundEyeCursor } from '../CompoundEyeCursor'

const config: SpreadConfig = {
  title: COMPOUND_EYE_TITLE,
  credit: COMPOUND_EYE_CREDIT,
  pullQuote: COMPOUND_EYE_PULL_QUOTE,
  body: COMPOUND_EYE_BODY,
  figures: [
    {
      src: IMG_HORSEFLY_EYE,
      alt: 'Horsefly compound eye, macro photograph',
      caption: 'Ommatidia of a horsefly — each facet an independent optical instrument',
      placement: 'full',
    },
    {
      src: BG_COMPOUND_EYE,
      alt: 'Close-up of insect compound eye structure',
      caption: 'The hexagonal mosaic of ommatidia revealing the tessellated design',
      placement: 'left',
    },
    {
      src: BG_AEDES_PROBOSCIS,
      alt: 'Mosquito proboscis and sensory structures',
      caption: 'Aedes proboscis — sensory hairs detect chemical signatures in the air',
      placement: 'right',
    },
  ],
  pageNumber: PAGES[2].number,
}

export function CompoundEyePage() {
  return (
    <div className="compound-eye-wrapper">
      <PageSpread config={config} />
      <CompoundEyeCursor />
    </div>
  )
}
