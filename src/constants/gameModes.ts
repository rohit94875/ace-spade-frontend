export type GameMode = 'CLASSIC' | 'RUTHLESS_HIDDEN' | 'CLAN_BATTLE';

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
    name: 'Ruthless & Hidden',
    description: 'Bids hidden until round ends. Miss your bid → negative of what you would have scored. Separate MMR.',
    rankedAllowed: true,
  },
  {
    id: 'CLAN_BATTLE',
    icon: '⚔️',
    name: 'Clan Battle',
    description: '2 teams, 4–6 players. Team scoring. Up to 13 rounds — unranked, history only.',
    rankedAllowed: false,
  },
];

export function gameModeLabel(mode: GameMode | string | undefined): string {
  return GAME_MODES.find((m) => m.id === mode)?.name ?? String(mode ?? 'Classic');
}
