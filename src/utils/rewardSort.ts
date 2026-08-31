import type { RewardSymbolType, SeasonReward } from '../types/season';
import { isAwardBadge, isTierCard } from '../types/season';

/** Award badges: highest prestige first (Top MMR → …). */
const AWARD_PRESTIGE: RewardSymbolType[] = [
  'TOP_MMR', 'MOST_WINS', 'WIN_STREAK', 'FINISHER',
  'MOST_MATCHES', 'MOST_LOSSES', 'LOSS_STREAK', 'BID_MASTER',
];

/** Tier cards: highest tier first (for display only). */
const TIER_PRESTIGE: RewardSymbolType[] = [
  'ACE_CARD', 'DIAMOND_CARD', 'PLATINUM_CARD', 'GOLD_CARD',
  'SILVER_CARD', 'BRONZE_CARD', 'SAND_CARD',
];

function prestigeIndex(symbol: RewardSymbolType, order: RewardSymbolType[]): number {
  const i = order.indexOf(symbol);
  return i === -1 ? 99 : i;
}

export function sortSeasonRewards(rewards: SeasonReward[]): SeasonReward[] {
  return [...rewards].sort((a, b) => {
    const aTier = isTierCard(a.symbolType);
    const bTier = isTierCard(b.symbolType);
    if (aTier !== bTier) return aTier ? 1 : -1; // awards before tier cards in mixed lists
    if (isAwardBadge(a.symbolType) && isAwardBadge(b.symbolType)) {
      return prestigeIndex(a.symbolType, AWARD_PRESTIGE) - prestigeIndex(b.symbolType, AWARD_PRESTIGE);
    }
    if (aTier && bTier) {
      return prestigeIndex(a.symbolType, TIER_PRESTIGE) - prestigeIndex(b.symbolType, TIER_PRESTIGE);
    }
    return 0;
  });
}

export function sortAwardWinners<T extends { symbolType: RewardSymbolType }>(winners: T[]): T[] {
  return [...winners].sort(
    (a, b) => prestigeIndex(a.symbolType, AWARD_PRESTIGE) - prestigeIndex(b.symbolType, AWARD_PRESTIGE),
  );
}
