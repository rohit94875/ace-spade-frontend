import { Card, Rank, Suit } from '../types/game';

/** Incognito suit codes: ♦=1, ♥=2, ♣=3, ♠=4 */
export const SUIT_CODE: Record<Suit, number> = {
  DIAMONDS: 1,
  HEARTS: 2,
  CLUBS: 3,
  SPADES: 4,
};

/** Rank codes: 2–10, J=11, Q=12, K=13, A=14 */
export const RANK_CODE: Record<Rank, number> = {
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
  SIX: 6,
  SEVEN: 7,
  EIGHT: 8,
  NINE: 9,
  TEN: 10,
  JACK: 11,
  QUEEN: 12,
  KING: 13,
  ACE: 14,
};

export function incognitoLabel(card: Card): string {
  return `${SUIT_CODE[card.suit]}-${RANK_CODE[card.rank]}`;
}

/** Sort by suit (1–4) then rank high to low within suit. */
export function sortCards(hand: Card[]): Card[] {
  return [...hand].sort((a, b) => {
    const suitDiff = SUIT_CODE[a.suit] - SUIT_CODE[b.suit];
    if (suitDiff !== 0) return suitDiff;
    return RANK_CODE[b.rank] - RANK_CODE[a.rank];
  });
}

export function orderHand(hand: Card[], sortEnabled: boolean): Card[] {
  return sortEnabled ? sortCards(hand) : hand;
}
