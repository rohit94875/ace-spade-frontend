export type DisconnectPolicy = 'FORFEIT_WIN' | 'BOT_TAKEOVER';

import type { MaxRounds } from '../constants/gameLength';
export type { MaxRounds };

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
  connected?: boolean;
  graceExpiresAt?: number | null;
  lastSeenAt?: number;
  presenceStatus?: string;
  autoPlayCount?: number;
  ready?: boolean;
  bidPlaced?: boolean;
  teamId?: number | null;
  /** Ranked tier badge after placement */
  tier?: string | null;
}

export type PresenceStatus = 'ONLINE' | 'AWAY' | 'DISCONNECTED' | 'GRACE' | 'PAUSED';

export interface PlayerPresenceDto {
  playerId: string;
  username: string;
  connected: boolean;
  bot: boolean;
  graceExpiresAt?: number | null;
  lastSeenAt: number;
  status: PresenceStatus;
  autoPlayCount?: number;
  /** Epoch millis when this away player's current turn will be auto-played. */
  turnTimeoutAt?: number | null;
}

export interface ChatMessageDto {
  id: string;
  playerId: string;
  username: string;
  text: string;
  mentions?: string[];
  sentAt: number;
}

export interface SpectatorDto {
  id: string;
  username: string;
  connected?: boolean;
}

export interface PublicRoomDto {
  roomCode: string;
  hostUsername: string;
  playerCount: number;
  maxPlayers: number;
  ranked: boolean;
  maxRounds: number;
  playWithBot: boolean;
  spectatable?: boolean;
  phase?: string;
  spectatorCount?: number;
  gameMode?: string;
}

export interface SessionResumeResponse {
  valid: boolean;
  playerId?: string;
  username?: string;
  host?: boolean;
  roomCode?: string;
  room?: RoomStateDto;
  hand?: Card[];
  currentTrick?: TrickCard[];
  chatMessages?: ChatMessageDto[];
  presence?: Record<string, PlayerPresenceDto>;
  message?: string;
  spectator?: boolean;
}

export type EventType =
  | 'ROOM_UPDATED' | 'ROUND_STARTED' | 'BID_PHASE' | 'BID_PLACED'
  | 'PLAY_PHASE' | 'CARD_PLAYED' | 'TRICK_ENDED' | 'ROUND_ENDED'
  | 'GAME_ENDED' | 'PLAYER_LEFT' | 'PLAYER_KICKED' | 'BOT_TAKEOVER' | 'GAME_PAUSED' | 'GAME_RESUMED'
  | 'GAME_SNAPSHOT' | 'PRESENCE_UPDATED' | 'CHAT_MESSAGE' | 'ERROR'
  | 'PLAYER_READY' | 'BOT_VOTE_UPDATED' | 'SPECTATOR_JOINED';

export interface GameEvent {
  type: EventType;
  payload: unknown;
}

export interface RoomStateDto {
  roomCode: string;
  phase: GamePhase;
  round: number;
  maxRounds?: MaxRounds;
  players: PlayerDto[];
  scores: Record<string, number>;
  currentTurnPlayerId: string;
  hostPlayerId: string;
  playWithBot?: boolean;
  ranked?: boolean;
  disconnectPolicy?: DisconnectPolicy;
  paused?: boolean;
  pausedByPlayerId?: string | null;
  chatMessages?: ChatMessageDto[];
  presence?: Record<string, PlayerPresenceDto>;
  spectators?: SpectatorDto[];
  botVotes?: Record<string, string[]>;
  gameMode?: import('../constants/gameModes').GameMode | string;
  teamScores?: Record<string, number>;
  team1Name?: string;
  team2Name?: string;
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
  teamRoundScores?: Record<string, number>;
  teamCumulativeScores?: Record<string, number>;
  teamBids?: Record<string, number>;
  teamTricksWon?: Record<string, number>;
  gameOver: boolean;
  winnerUsername?: string;
  winnerScore?: number;
  forfeit?: boolean;
  forfeitedUsername?: string;
  ratingUpdates?: Record<string, import('./auth').RatingDelta>;
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
