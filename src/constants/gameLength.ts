/** Casual games are always 5 rounds; ranked supports 10 or 13. */
export const CASUAL_MAX_ROUNDS = 5;
export const DEFAULT_RANKED_MAX_ROUNDS = 13;

export type MaxRounds = 5 | 10 | 13;

export function normalizeMaxRounds(value?: number): MaxRounds {
  if (value === 5) return 5;
  if (value === 10) return 10;
  return 13;
}
