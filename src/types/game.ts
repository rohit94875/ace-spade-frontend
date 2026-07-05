export type DisconnectPolicy = 'FORFEIT_WIN' | 'BOT_TAKEOVER';

export type Suit = 'SPADES' | 'CLUBS' | 'HEARTS' | 'DIAMONDS';
export type Rank =
  | 'TWO' | 'THREE' | 'FOUR' | 'FIVE' | 'SIX' | 'SEVEN' | 'EIGHT'
  | 'NINE' | 'TEN' | 'JACK' | 'QUEEN' | 'KING' | 'ACE';
export type GamePhase =
  | 'LOBBY' | 'BIDDING' | 'PLAYING' | 'TRICK_RESOLVE' | 'ROUND_END' | 'GAME_END';

export interface Card {
  suit: Suit;
  rank: Rank;
  deckIndex: number;
  playOrder: number;
}

export interface TrickCard {
  playerId: string;
  username: string;
  card: Card;
  playOrder: number;
}

export interface PlayerDto {
  id: string;
  username: string;
  bid: number | null;
  tricksWon: number;
  cardCount: number;
  currentTurn: boolean;
  host: boolean;
  bot?: boolean;
}

export type EventType =
  | 'ROOM_UPDATED' | 'ROUND_STARTED' | 'BID_PHASE' | 'BID_PLACED'
  | 'PLAY_PHASE' | 'CARD_PLAYED' | 'TRICK_ENDED' | 'ROUND_ENDED'
  | 'GAME_ENDED' | 'PLAYER_LEFT' | 'BOT_TAKEOVER' | 'GAME_PAUSED' | 'GAME_RESUMED' | 'ERROR';

export interface GameEvent {
  type: EventType;
  payload: unknown;
}

export interface RoomStateDto {
  roomCode: string;
  phase: GamePhase;
  round: number;
  players: PlayerDto[];
  scores: Record<string, number>;
  currentTurnPlayerId: string;
  hostPlayerId: string;
  playWithBot?: boolean;
  disconnectPolicy?: DisconnectPolicy;
  paused?: boolean;
  pausedByPlayerId?: string | null;
}

export interface HandUpdate {
  round: number;
  hand: Card[];
  playerId: string;
}

export interface TrickEndedPayload {
  winnerId: string;
  winnerUsername: string;
  trick: TrickCard[];
  trickCounts: Record<string, number>;
  tricksPlayedInRound: number;
  totalTricksInRound: number;
}

export interface RoundEndedPayload {
  round: number;
  roundScores: Record<string, number>;
  cumulativeScores: Record<string, number>;
  bids: Record<string, number>;
  tricksWon: Record<string, number>;
  gameOver: boolean;
  winnerUsername?: string;
  winnerScore?: number;
  forfeit?: boolean;
  forfeitedUsername?: string;
}

export const SUIT_SYMBOLS: Record<Suit, string> = {
  SPADES: '♠',
  CLUBS: '♣',
  HEARTS: '♥',
  DIAMONDS: '♦',
};

export const RANK_DISPLAY: Record<Rank, string> = {
  TWO: '2', THREE: '3', FOUR: '4', FIVE: '5', SIX: '6',
  SEVEN: '7', EIGHT: '8', NINE: '9', TEN: '10',
  JACK: 'J', QUEEN: 'Q', KING: 'K', ACE: 'A',
};

export const isRedSuit = (suit: Suit) => suit === 'HEARTS' || suit === 'DIAMONDS';
