const NUMBER_FORMATTER = new Intl.NumberFormat('en-US')

const ABBREVIATIONS = [
  { threshold: 1_000_000_000_000_000_000, suffix: 'quintillion', divisor: 1_000_000_000_000_000_000 },
  { threshold: 1_000_000_000_000_000, suffix: 'quadrillion', divisor: 1_000_000_000_000_000 },
  { threshold: 1_000_000_000_000, suffix: 'trillion', divisor: 1_000_000_000_000 },
  { threshold: 1_000_000_000, suffix: 'billion', divisor: 1_000_000_000 },
  { threshold: 1_000_000, suffix: 'million', divisor: 1_000_000 },
]

/**
 * Format a number with locale separators.
 * e.g. 1_000_000 → "1,000,000"
 */
export function formatNumber(value: number): string {
  return NUMBER_FORMATTER.format(value)
}

/**
 * Format a number with abbreviation if >= 1 billion.
 * Returns { display: "10 quintillion", raw: "10,000,000,000,000,000,000" }
 * For numbers < 1 billion, display === formatted raw.
 */
export function formatNumberWithAbbreviation(value: number): {
  display: string
  raw: string
  needsAbbreviation: boolean
} {
  const raw = NUMBER_FORMATTER.format(value)

  for (const abbr of ABBREVIATIONS) {
    if (value >= abbr.threshold) {
      const short = value / abbr.divisor
      return {
        display: `${short} ${abbr.suffix}`,
        raw,
        needsAbbreviation: true,
      }
    }
  }

  return { display: raw, raw, needsAbbreviation: false }
}
