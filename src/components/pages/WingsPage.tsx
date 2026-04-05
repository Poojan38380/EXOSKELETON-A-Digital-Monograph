import { useRef, useState } from 'react'
import { PageSpread } from '../PageSpread'
import type { SpreadConfig, AnchorPositions } from '../PageSpread'
import type { BandObstacle } from '../spread-layout'
import {
  WINGS_TITLE,
  WINGS_CREDIT,
  WINGS_PULL_QUOTE,
  WINGS_BODY,
  PAGES,
} from '../../content/entomology-text'
import { IMG_DRAGONFLY_WING, BG_DRAGONFLY_DETAIL, BG_WING_MONARCH } from '../../content/image-urls'
import { Butterfly } from '../Butterfly'

const config: SpreadConfig = {
  title: WINGS_TITLE,
  credit: WINGS_CREDIT,
  pullQuote: WINGS_PULL_QUOTE,
  body: WINGS_BODY,
  figures: [
    {
      src: IMG_DRAGONFLY_WING,
      alt: 'Dragonfly wing venation, scientific engraving',
      caption: 'Wing venation of Anax imperator — the Emperor Dragonfly',
      placement: 'right',
    },
    {
      src: BG_DRAGONFLY_DETAIL,
      alt: 'Dragonfly wing detail showing membrane structure',
      caption: 'Close-up of wing membrane revealing the microscopic architecture',
      placement: 'left',
    },
    {
      src: BG_WING_MONARCH,
      alt: 'Monarch butterfly wing pattern',
      caption: 'Monarch wing scales — each one a modified hair containing pigment',
      placement: 'right',
    },
  ],
  pageNumber: PAGES[1].number,
}

export function WingsPage() {
  const spreadRef = useRef<HTMLDivElement>(null)
  const [anchorPositions, setAnchorPositions] = useState<AnchorPositions | null>(null)
  const [butterflyObstacle, setButterflyObstacle] = useState<BandObstacle | null>(null)

  return (
    <div style={{ position: 'relative', overflow: 'visible' }}>
      <PageSpread
        config={config}
        ref={spreadRef}
        onAnchorPositions={setAnchorPositions}
        butterflyObstacle={butterflyObstacle}
      />
      <Butterfly
        containerRef={spreadRef}
        anchorPositions={anchorPositions}
        onObstacleChange={setButterflyObstacle}
      />
    </div>
  )
}
