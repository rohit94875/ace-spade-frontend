/** Classic / ruthless hit points for a bid (0 → 10, N → 10 + N×11). */
export function classicBidPoints(bid: number): number {
  return bid === 0 ? 10 : 10 + bid * 11;
}

/**
 * Ruthless miss penalty uses classic points of max(bid, tricksWon).
 * Bid buttons only know the bid + max tricks this round (round number).
 */
export function ruthlessMissPoints(bid: number, tricksWon: number): number {
  return classicBidPoints(Math.max(bid, tricksWon));
}

/**
 * Bid button label — ruthless: hit = classic(bid); miss can be worse if you take more
 * than you bid (up to classic(maxTricksThisRound)).
 */
export function formatBidScoreHint(bid: number, ruthless: boolean, maxTricksThisRound?: number): string {
  const hit = classicBidPoints(bid);
  if (!ruthless) {
    return bid === 0 ? '+10' : `+${hit}`;
  }
  const worstMiss = classicBidPoints(Math.max(bid, maxTricksThisRound ?? bid));
  if (worstMiss === hit) {
    return `+${hit}/-${hit}`;
  }
  return `+${hit}/-${hit}…-${worstMiss}`;
}

export function formatRoundScore(earned: number): string {
  if (earned > 0) return `+${earned}`;
  if (earned < 0) return `${earned}`;
  return '0';
}

export function roundScoreColor(earned: number, hit?: boolean): string {
  if (earned < 0) return '#e74c3c';
  if (earned > 0) return '#74c69d';
  if (hit === false) return 'rgba(255,255,255,0.4)';
  return 'rgba(255,255,255,0.4)';
}

/** @deprecated Bids are always visible; kept for any leftover call sites. */
export function shouldHideRuthlessBids(_phase: string | null | undefined): boolean {
  return false;
}

export function clanTeamHit(teamBid: number, teamTricks: number): boolean {
  return teamBid === teamTricks;
}
