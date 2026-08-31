import type { GameMode } from './gameModes';

/** Casual classic/ruthless games are 5 rounds; ranked and clan battle support 8–13. */
export const CASUAL_MAX_ROUNDS = 5;
export const RANKED_MIN_ROUNDS = 8;
export const RANKED_MAX_ROUNDS = 13;
export const DEFAULT_RANKED_MAX_ROUNDS = 13;
export const DEFAULT_CLAN_MAX_ROUNDS = 13;

export type RankedMaxRounds = 8 | 9 | 10 | 11 | 12 | 13;
export type MaxRounds = 5 | RankedMaxRounds;

export const RANKED_ROUND_OPTIONS: RankedMaxRounds[] = [8, 9, 10, 11, 12, 13];

/** Host can pick 8–13 rounds in ranked games or clan battle (unranked). */
export function allowsLobbyRoundPicker(ranked: boolean, gameMode?: GameMode): boolean {
  return ranked || gameMode === 'CLAN_BATTLE';
}

export function resolveCreateMaxRounds(
  ranked: boolean,
  gameMode: GameMode,
  pickedRounds: RankedMaxRounds,
): MaxRounds {
  if (allowsLobbyRoundPicker(ranked, gameMode)) {
    return clampRankedMaxRounds(pickedRounds);
  }
  return CASUAL_MAX_ROUNDS;
}

export function clampRankedMaxRounds(value: number): RankedMaxRounds {
  const clamped = Math.min(RANKED_MAX_ROUNDS, Math.max(RANKED_MIN_ROUNDS, Math.round(value)));
  return clamped as RankedMaxRounds;
}

export function normalizeMaxRounds(value?: number): MaxRounds {
  if (value === CASUAL_MAX_ROUNDS) return CASUAL_MAX_ROUNDS;
  if (value != null && value >= RANKED_MIN_ROUNDS && value <= RANKED_MAX_ROUNDS) {
    return value as RankedMaxRounds;
  }
  return DEFAULT_RANKED_MAX_ROUNDS;
}
