/**
 * easeOutQuart: starts fast, decelerates sharply toward the end.
 * t must be in [0, 1]. Returns value in [0, 1].
 */
export function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}
