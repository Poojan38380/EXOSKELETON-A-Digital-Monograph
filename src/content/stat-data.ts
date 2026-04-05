export interface StatData {
  value: number | string
  label: string
  note: string
}

export const STATS: StatData[] = [
  { value: 1_000_000, label: 'named species', note: 'with ~9M more unnamed' },
  { value: '10000000000000000000', label: 'insects alive right now', note: '10 quintillion' },
  { value: 70, label: '× human biomass', note: 'in collective insect weight' },
  { value: 90, label: '% of all animal species', note: 'that are insects' },
  { value: 350_000_000, label: 'years of insect history', note: 'predating dinosaurs' },
  { value: 400_000, label: 'beetle species', note: "Haldane's inordinate fondness" },
  { value: 10_000_000, label: 'nectar trips', note: 'to make one pound of honey' },
  { value: 1_400_000_000, label: 'insects per human', note: 'on Earth right now' },
]
