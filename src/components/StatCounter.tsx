import { useRef, useEffect, useState } from 'react'
import { easeOutQuart } from '../layout-engine/easing'
import { formatNumber, formatNumberWithAbbreviation } from '../layout-engine/number-format'

interface StatCounterProps {
  target: number | string
  durationMs?: number
}

export function StatCounter({ target, durationMs = 2000 }: StatCounterProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const rafRef = useRef<number | null>(null)

  // Determine if this is a large number needing abbreviation
  const numericValue = typeof target === 'string' ? Number(target) : target
  const { display: abbrDisplay, needsAbbreviation } = formatNumberWithAbbreviation(numericValue)

  // For large numbers, extract the coefficient to animate
  const [coefficient, suffix] = needsAbbreviation
    ? (abbrDisplay.split(' ') as [string, string])
    : [null, null]

  const animateTarget = coefficient != null ? parseFloat(coefficient) : numericValue

  useEffect(() => {
    const startTime = performance.now()

    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / durationMs, 1)
      const easedProgress = easeOutQuart(progress)
      const currentValue = Math.round(easedProgress * animateTarget)

      setDisplayValue(currentValue)

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [animateTarget, durationMs])

  if (needsAbbreviation && suffix) {
    return (
      <span className="stat-counter stat-counter--large">
        {displayValue} {suffix}
      </span>
    )
  }

  return (
    <span className="stat-counter">
      {formatNumber(displayValue)}
    </span>
  )
}
