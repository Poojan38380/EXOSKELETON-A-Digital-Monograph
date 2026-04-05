import type { StatData } from '../content/stat-data'
import { StatCounter } from './StatCounter'
import { formatNumberWithAbbreviation } from '../layout-engine/number-format'

interface StatCardProps {
  stat: StatData
}

export function StatCard({ stat }: StatCardProps) {
  const numericValue = typeof stat.value === 'string' ? Number(stat.value) : stat.value
  const { needsAbbreviation, raw } = formatNumberWithAbbreviation(numericValue)

  return (
    <div className="stat-card">
      <div className="stat-card__number">
        <StatCounter target={stat.value} />
        {needsAbbreviation && (
          <span className="stat-card__raw">{raw}</span>
        )}
      </div>
      <div className="stat-card__label">{stat.label}</div>
      <div className="stat-card__note">{stat.note}</div>
    </div>
  )
}
