import { create } from 'zustand';
import {
  Card, GamePhase, PlayerDto, RoomStateDto, TrickCard,
  TrickEndedPayload, RoundEndedPayload, GameEvent,
} from '../types/game';

export interface RoundHistoryEntry {
  round: number;
  bids: Record<string, number>;
  tricksWon: Record<string, number>;
  roundScores: Record<string, number>;
}

interface LastTrick {
  winnerId: string;
  winnerUsername: string;
  trick: TrickCard[];
}

interface RoundSummary {
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

interface GameStore {
  // Session
  playerId: string | null;
  sessionToken: string | null;
  username: string | null;
  roomCode: string | null;
  isHost: boolean;

  // Game state
  phase: GamePhase | null;
  round: number;
  players: PlayerDto[];
  hand: Card[];
  currentTrick: TrickCard[];
  scores: Record<string, number>;
  currentTurnPlayerId: string | null;
  hostPlayerId: string | null;

  // Round-by-round history
  roundHistory: RoundHistoryEntry[];

  // UI overlays
  lastTrick: LastTrick | null;
  roundSummary: RoundSummary | null;
  errorMessage: string | null;
  wsConnected: boolean;
  playWithBot: boolean;
  paused: boolean;
  pausedAuto: boolean;
  autoStartGame: boolean;

  // Actions
  setSession: (data: {
    playerId: string;
    sessionToken: string;
    username: string;
    roomCode: string;
    isHost: boolean;
    playWithBot?: boolean;
    autoStartGame?: boolean;
  }) => void;
  setWsConnected: (v: boolean) => void;
  handleGameEvent: (event: GameEvent) => void;
  setHand: (hand: Card[]) => void;
  dismissRoundSummary: () => void;
  dismissLastTrick: () => void;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  playerId: null,
  sessionToken: null,
  username: null,
  roomCode: null,
  isHost: false,
  phase: null as GamePhase | null,
  round: 0,
  players: [] as PlayerDto[],
  hand: [] as Card[],
  currentTrick: [] as TrickCard[],
  scores: {} as Record<string, number>,
  currentTurnPlayerId: null as string | null,
  hostPlayerId: null as string | null,
  roundHistory: [] as RoundHistoryEntry[],
  lastTrick: null as LastTrick | null,
  roundSummary: null as RoundSummary | null,
  errorMessage: null as string | null,
  wsConnected: false,
  playWithBot: false,
  paused: false,
  pausedAuto: false,
  autoStartGame: false,
};

export const useGameStore = create<GameStore>((set) => ({
  ...initialState,

  setSession: (data) =>
    set({
      playerId: data.playerId,
      sessionToken: data.sessionToken,
      username: data.username,
      roomCode: data.roomCode,
      isHost: data.isHost,
      playWithBot: data.playWithBot ?? false,
      autoStartGame: data.autoStartGame ?? false,
    }),

  setWsConnected: (v) => set({ wsConnected: v }),

  setHand: (hand) => set({ hand }),

  dismissRoundSummary: () => set({ roundSummary: null }),

  dismissLastTrick: () => set({ lastTrick: null }),

  clearError: () => set({ errorMessage: null }),

  reset: () => set(initialState),

  handleGameEvent: (event: GameEvent) => {
    const payload = event.payload as Record<string, unknown>;

    switch (event.type) {
      case 'ROOM_UPDATED': {
        const room = payload as unknown as RoomStateDto;
        set({
          phase: room.phase,
          players: room.players,
          scores: room.scores,
          currentTurnPlayerId: room.currentTurnPlayerId,
          hostPlayerId: room.hostPlayerId,
          round: room.round,
          playWithBot: room.playWithBot ?? false,
          paused: room.paused ?? false,
        });
        break;
      }

      case 'ROUND_STARTED': {
        set({
          phase: 'BIDDING',
          round: payload['round'] as number,
          players: payload['players'] as PlayerDto[],
          currentTurnPlayerId: payload['currentTurnPlayerId'] as string,
          currentTrick: [],
          lastTrick: null,
          roundSummary: null,
          paused: false,
          pausedAuto: false,
        });
        break;
      }

      case 'BID_PLACED': {
        const nextTurn = payload['nextTurnPlayerId'] as string;
        const phase = payload['phase'] as GamePhase;
        set((s) => ({
          phase,
          currentTurnPlayerId: nextTurn,
          players: s.players.map((p) =>
            p.id === payload['playerId']
              ? { ...p, bid: payload['amount'] as number }
              : p,
          ),
        }));
        break;
      }

      case 'PLAY_PHASE': {
        // currentTrick is NOT updated here — it is built incrementally via CARD_PLAYED
        // and cleared by TRICK_ENDED. Overwriting it here caused duplicate cards when
        // message ordering between CARD_PLAYED and PLAY_PHASE was non-deterministic.
        set({
          currentTurnPlayerId: payload['currentTurnPlayerId'] as string,
          phase: 'PLAYING',
        });
        break;
      }

      case 'CARD_PLAYED': {
        const playedPlayerId = payload['playerId'] as string;
        const card = payload['card'] as Card;
        const tc: TrickCard = {
          playerId: playedPlayerId,
          username: payload['username'] as string,
          card,
          playOrder: card.playOrder,
        };
        set((s) => ({
          currentTrick: [...s.currentTrick, tc],
          // Remove from local hand when it's our own card
          hand: s.playerId === playedPlayerId
            ? s.hand.filter(
                (c) => !(c.suit === card.suit && c.rank === card.rank && c.deckIndex === card.deckIndex),
              )
            : s.hand,
          players: s.players.map((p) =>
            p.id === playedPlayerId
              ? { ...p, cardCount: Math.max(0, p.cardCount - 1) }
              : p,
          ),
        }));
        break;
      }

      case 'TRICK_ENDED': {
        const p = payload as unknown as TrickEndedPayload;
        set((s) => ({
          lastTrick: { winnerId: p.winnerId, winnerUsername: p.winnerUsername, trick: p.trick },
          currentTrick: [],
          players: s.players.map((pl) => ({
            ...pl,
            tricksWon: p.trickCounts[pl.id] ?? pl.tricksWon,
          })),
        }));
        break;
      }

      case 'ROUND_ENDED':
      case 'GAME_ENDED': {
        const r = payload as unknown as RoundEndedPayload;
        const historyEntry: RoundHistoryEntry = {
          round: r.round,
          bids: r.bids,
          tricksWon: r.tricksWon,
          roundScores: r.roundScores,
        };
        set((s) => ({
          roundSummary: {
            round: r.round,
            roundScores: r.roundScores,
            cumulativeScores: r.cumulativeScores,
            bids: r.bids,
            tricksWon: r.tricksWon,
            gameOver: r.gameOver,
            winnerUsername: r.winnerUsername,
            winnerScore: r.winnerScore,
            forfeit: r.forfeit,
            forfeitedUsername: r.forfeitedUsername,
          },
          scores: r.cumulativeScores,
          phase: r.gameOver ? 'GAME_END' : 'ROUND_END',
          roundHistory: [...s.roundHistory, historyEntry],
          paused: false,
          pausedAuto: false,
        }));
        break;
      }

      case 'PLAYER_LEFT': {
        set({
          players: (payload['players'] as PlayerDto[]) ?? [],
        });
        break;
      }

      case 'BOT_TAKEOVER': {
        set({
          players: (payload['players'] as PlayerDto[]) ?? [],
          errorMessage: `${payload['botUsername'] ?? 'BOT Vitality'} took over the seat`,
        });
        break;
      }

      case 'GAME_PAUSED': {
        set({
          paused: true,
          pausedAuto: Boolean(payload['auto']),
        });
        break;
      }

      case 'GAME_RESUMED': {
        set({
          paused: false,
          pausedAuto: false,
        });
        break;
      }

      case 'ERROR': {
        set({ errorMessage: payload as unknown as string });
        break;
      }
    }
  },
}));
