/** Classic / ruthless hit points for a bid (0 → 10, N → 10 + N×11). */
export function classicBidPoints(bid: number): number {
  return bid === 0 ? 10 : 10 + bid * 11;
}

/** Bid button label — ruthless shows symmetric +/- (e.g. +21/-21). */
export function formatBidScoreHint(bid: number, ruthless: boolean): string {
  const pts = classicBidPoints(bid);
  return ruthless ? `+${pts}/-${pts}` : bid === 0 ? '+10' : `+${pts}`;
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

/** Ruthless hidden bids stay secret through bidding and play; revealed at round end. */
export function shouldHideRuthlessBids(phase: string | null | undefined): boolean {
  return phase === 'BIDDING' || phase === 'PLAYING';
}
