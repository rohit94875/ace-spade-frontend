export type SeasonStatus = 'SCHEDULED' | 'ACTIVE' | 'COMPLETED';

export type RewardSymbolType =
  | 'SAND_CARD' | 'BRONZE_CARD' | 'SILVER_CARD' | 'GOLD_CARD'
  | 'PLATINUM_CARD' | 'DIAMOND_CARD' | 'ACE_CARD'
  | 'TOP_MMR' | 'MOST_MATCHES' | 'MOST_WINS' | 'MOST_LOSSES'
  | 'WIN_STREAK' | 'LOSS_STREAK' | 'BID_MASTER' | 'FINISHER';

export interface CurrentSeason {
  seasonId: number;
  name: string;
  status: SeasonStatus;
  startsAt: string;
  endsAt: string;
  graceEndsAt: string;
  rewardsTracked: boolean;
  showCountdown: boolean;
  secondsRemaining: number;
  countdownMessage?: string | null;
}

export interface SeasonSummary {
  seasonId: number;
  name: string;
  status: SeasonStatus;
  startsAt: string;
  endsAt: string;
  rewardsTracked: boolean;
}

export interface SeasonRewardWinner {
  symbolType: RewardSymbolType;
  userId: number;
  username: string;
  statValue?: number | null;
}

export interface SeasonDetail extends SeasonSummary {
  graceEndsAt: string;
  awardWinners: SeasonRewardWinner[];
}

export interface SeasonReward {
  symbolType: RewardSymbolType;
  statValue?: number | null;
}

export interface SeasonRewardsGroup {
  seasonId: number;
  seasonName: string;
  status: SeasonStatus;
  rewardsTracked: boolean;
  rewards: SeasonReward[];
}

export const REWARD_LABELS: Record<RewardSymbolType, string> = {
  SAND_CARD: 'Sand Card',
  BRONZE_CARD: 'Bronze Card',
  SILVER_CARD: 'Silver Card',
  GOLD_CARD: 'Gold Card',
  PLATINUM_CARD: 'Platinum Card',
  DIAMOND_CARD: 'Diamond Card',
  ACE_CARD: 'Ace Card',
  TOP_MMR: 'Top MMR',
  MOST_MATCHES: 'Most Matches',
  MOST_WINS: 'Most Wins',
  MOST_LOSSES: 'Most Losses',
  WIN_STREAK: 'Win Streak',
  LOSS_STREAK: 'Loss Streak',
  BID_MASTER: 'Bid Master',
  FINISHER: 'Finisher',
};

export const MIN_RANKED_GAMES_FOR_REWARDS = 5;

const TIER_CARDS: RewardSymbolType[] = [
  'SAND_CARD', 'BRONZE_CARD', 'SILVER_CARD', 'GOLD_CARD',
  'PLATINUM_CARD', 'DIAMOND_CARD', 'ACE_CARD',
];

const AWARD_BADGES: RewardSymbolType[] = [
  'TOP_MMR', 'MOST_MATCHES', 'MOST_WINS', 'MOST_LOSSES',
  'WIN_STREAK', 'LOSS_STREAK', 'BID_MASTER', 'FINISHER',
];

export function isTierCard(symbol: RewardSymbolType): boolean {
  return TIER_CARDS.includes(symbol);
}

export function isAwardBadge(symbol: RewardSymbolType): boolean {
  return AWARD_BADGES.includes(symbol);
}
