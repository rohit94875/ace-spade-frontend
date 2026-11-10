export type GameMode = 'CLASSIC' | 'RUTHLESS_HIDDEN' | 'CLAN_BATTLE' | 'POKER';

export interface GameModeOption {
  id: GameMode;
  icon: string;
  name: string;
  description: string;
  rankedAllowed: boolean;
}

export const GAME_MODES: GameModeOption[] = [
  {
    id: 'CLASSIC',
    icon: '♠',
    name: 'Classic',
    description: 'Standard bidding and scoring. Ranked MMR.',
    rankedAllowed: true,
  },
  {
    id: 'RUTHLESS_HIDDEN',
    icon: '🎭',
    name: 'Ruthless',
    description:
      'Exact bid → classic points. Miss → negative of max(bid, tricks) ' +
      '(e.g. bid 4 / won 5 → −65). Separate MMR.',
    rankedAllowed: true,
  },
  {
    id: 'CLAN_BATTLE',
    icon: '⚔️',
    name: 'Clan Battle',
    description: '2 teams, 4–6 players. Team scoring. Up to 13 rounds — unranked, history only.',
    rankedAllowed: false,
  },
  {
    id: 'POKER',
    icon: '🃏',
    name: 'Poker',
    description:
      "Fixed-limit Texas Hold'em lite. SB 25 / BB 50 / bets of 50. " +
      '2–6 players, play until bust — unranked, no bots.',
    rankedAllowed: false,
  },
];

export function gameModeLabel(mode: GameMode | string | undefined): string {
  return GAME_MODES.find((m) => m.id === mode)?.name ?? String(mode ?? 'Classic');
}

export const RANKED_GAME_MODES = GAME_MODES.filter((m) => m.rankedAllowed);
