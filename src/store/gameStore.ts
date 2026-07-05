import { create } from 'zustand';
import {
  Card, GamePhase, PlayerDto, RoomStateDto, TrickCard,
  TrickEndedPayload, RoundEndedPayload, GameEvent,
  ChatMessageDto, PlayerPresenceDto, SessionResumeResponse, ActivityItem,
} from '../types/game';
import { saveSession, clearSession, StoredSession } from '../services/sessionStorage';

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
  playerId: string | null;
  sessionToken: string | null;
  username: string | null;
  roomCode: string | null;
  isHost: boolean;
  phase: GamePhase | null;
  round: number;
  players: PlayerDto[];
  hand: Card[];
  currentTrick: TrickCard[];
  scores: Record<string, number>;
  currentTurnPlayerId: string | null;
  hostPlayerId: string | null;
  roundHistory: RoundHistoryEntry[];
  lastTrick: LastTrick | null;
  roundSummary: RoundSummary | null;
  errorMessage: string | null;
  wsConnected: boolean;
  playWithBot: boolean;
  paused: boolean;
  pausedAuto: boolean;
  autoStartGame: boolean;
  presence: Record<string, PlayerPresenceDto>;
  graceSeconds: number;
  chatMessages: ChatMessageDto[];
  activityFeed: ActivityItem[];
  turnAlert: string | null;

  setSession: (data: {
    playerId: string;
    sessionToken: string;
    username: string;
    roomCode: string;
    isHost: boolean;
    playWithBot?: boolean;
    autoStartGame?: boolean;
  }) => void;
  applyResume: (res: SessionResumeResponse, stored: StoredSession) => void;
  applySnapshot: (res: SessionResumeResponse) => void;
  setWsConnected: (v: boolean) => void;
  handleGameEvent: (event: GameEvent) => void;
  setHand: (hand: Card[]) => void;
  dismissRoundSummary: () => void;
  dismissLastTrick: () => void;
  clearError: () => void;
  clearTurnAlert: () => void;
  reset: () => void;
}

const MAX_ACTIVITY = 40;

const initialState = {
  playerId: null as string | null,
  sessionToken: null as string | null,
  username: null as string | null,
  roomCode: null as string | null,
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
  presence: {} as Record<string, PlayerPresenceDto>,
  graceSeconds: 120,
  chatMessages: [] as ChatMessageDto[],
  activityFeed: [] as ActivityItem[],
  turnAlert: null as string | null,
};

function pushActivity(
  feed: ActivityItem[],
  text: string,
  highlight = false,
): ActivityItem[] {
  const item: ActivityItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    text,
    ts: Date.now(),
    highlight,
  };
  return [item, ...feed].slice(0, MAX_ACTIVITY);
}

function applyRoomState(
  room: RoomStateDto,
  extra: Partial<GameStore> = {},
): Partial<GameStore> {
  return {
    phase: room.phase,
    players: room.players,
    scores: room.scores,
    currentTurnPlayerId: room.currentTurnPlayerId,
    hostPlayerId: room.hostPlayerId,
    round: room.round,
    playWithBot: room.playWithBot ?? false,
    paused: room.paused ?? false,
    presence: room.presence ?? {},
    chatMessages: room.chatMessages ?? [],
    ...extra,
  };
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  setSession: (data) => {
    saveSession({
      playerId: data.playerId,
      sessionToken: data.sessionToken,
      username: data.username,
      roomCode: data.roomCode,
      isHost: data.isHost,
      playWithBot: data.playWithBot,
    });
    set({
      playerId: data.playerId,
      sessionToken: data.sessionToken,
      username: data.username,
      roomCode: data.roomCode,
      isHost: data.isHost,
      playWithBot: data.playWithBot ?? false,
      autoStartGame: data.autoStartGame ?? false,
    });
  },

  applyResume: (res, stored) => {
    saveSession(stored);
    const room = res.room!;
    set({
      playerId: res.playerId ?? stored.playerId,
      sessionToken: stored.sessionToken,
      username: res.username ?? stored.username,
      roomCode: res.roomCode ?? stored.roomCode,
      isHost: res.host ?? stored.isHost,
      hand: res.hand ?? [],
      currentTrick: res.currentTrick ?? [],
      ...applyRoomState(room),
      activityFeed: pushActivity([], 'Rejoined the game — you are still in your seat', true),
    });
  },

  applySnapshot: (res) => {
    if (!res.valid || !res.room) return;
    const s = get();
    set({
      hand: res.hand ?? s.hand,
      currentTrick: res.currentTrick ?? s.currentTrick,
      ...applyRoomState(res.room),
      activityFeed: pushActivity(s.activityFeed, 'Game state synced', false),
    });
  },

  setWsConnected: (v) => set({ wsConnected: v }),

  setHand: (hand) => set({ hand }),

  dismissRoundSummary: () => set({ roundSummary: null }),

  dismissLastTrick: () => set({ lastTrick: null }),

  clearError: () => set({ errorMessage: null }),

  clearTurnAlert: () => set({ turnAlert: null }),

  reset: () => {
    clearSession();
    set(initialState);
  },

  handleGameEvent: (event: GameEvent) => {
    const payload = event.payload as Record<string, unknown>;
    const s = get();

    switch (event.type) {
      case 'ROOM_UPDATED': {
        const room = payload as unknown as RoomStateDto;
        set(applyRoomState(room));
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
          activityFeed: pushActivity(s.activityFeed, `Round ${payload['round']} started — place your bids`),
        });
        break;
      }

      case 'BID_PLACED': {
        const nextTurn = payload['nextTurnPlayerId'] as string;
        const phase = payload['phase'] as GamePhase;
        const bidder = payload['username'] as string;
        const amount = payload['amount'] as number;
        const isMyTurnNext = nextTurn === s.playerId;
        set({
          phase,
          currentTurnPlayerId: nextTurn,
          players: s.players.map((p) =>
            p.id === payload['playerId'] ? { ...p, bid: amount } : p,
          ),
          activityFeed: pushActivity(
            s.activityFeed,
            `${bidder} bid ${amount}`,
            isMyTurnNext,
          ),
          turnAlert: isMyTurnNext && phase === 'BIDDING'
            ? 'Your turn to bid!'
            : isMyTurnNext && phase === 'PLAYING'
              ? 'Your turn to play!'
              : s.turnAlert,
        });
        break;
      }

      case 'PLAY_PHASE': {
        const turnId = payload['currentTurnPlayerId'] as string;
        const isMyTurn = turnId === s.playerId;
        set({
          currentTurnPlayerId: turnId,
          phase: 'PLAYING',
          turnAlert: isMyTurn ? 'Your turn to play!' : s.turnAlert,
          activityFeed: isMyTurn
            ? pushActivity(s.activityFeed, 'Your turn to play!', true)
            : s.activityFeed,
        });
        break;
      }

      case 'CARD_PLAYED': {
        const playedPlayerId = payload['playerId'] as string;
        const card = payload['card'] as Card;
        const playedName = payload['username'] as string;
        const tc: TrickCard = {
          playerId: playedPlayerId,
          username: playedName,
          card,
          playOrder: card.playOrder,
        };
        set({
          currentTrick: [...s.currentTrick, tc],
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
          activityFeed: pushActivity(s.activityFeed, `${playedName} played a card`),
        });
        break;
      }

      case 'TRICK_ENDED': {
        const p = payload as unknown as TrickEndedPayload;
        set({
          lastTrick: { winnerId: p.winnerId, winnerUsername: p.winnerUsername, trick: p.trick },
          currentTrick: [],
          players: s.players.map((pl) => ({
            ...pl,
            tricksWon: p.trickCounts[pl.id] ?? pl.tricksWon,
          })),
          activityFeed: pushActivity(
            s.activityFeed,
            `${p.winnerUsername} won the trick`,
            p.winnerId === s.playerId,
          ),
        });
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
        set({
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
          turnAlert: null,
          activityFeed: pushActivity(
            s.activityFeed,
            r.gameOver ? `Game over — ${r.winnerUsername} wins!` : `Round ${r.round} complete`,
            true,
          ),
        });
        break;
      }

      case 'PLAYER_LEFT':
        set({
          players: (payload['players'] as PlayerDto[]) ?? [],
          activityFeed: pushActivity(s.activityFeed, 'A player left the room'),
        });
        break;

      case 'BOT_TAKEOVER':
        set({
          players: (payload['players'] as PlayerDto[]) ?? [],
          errorMessage: `${payload['botUsername'] ?? 'BOT Vitality'} took over the seat`,
          activityFeed: pushActivity(
            s.activityFeed,
            `${payload['botUsername'] ?? 'BOT'} took over a seat`,
          ),
        });
        break;

      case 'GAME_PAUSED':
        set({
          paused: true,
          pausedAuto: Boolean(payload['auto']),
          activityFeed: pushActivity(
            s.activityFeed,
            Boolean(payload['auto'])
              ? `${payload['pausedByUsername'] ?? 'Player'} disconnected — game paused`
              : 'Game paused',
            true,
          ),
        });
        break;

      case 'GAME_RESUMED':
        set({
          paused: false,
          pausedAuto: false,
          activityFeed: pushActivity(s.activityFeed, 'Game resumed'),
        });
        break;

      case 'PRESENCE_UPDATED': {
        const presence = (payload['presence'] as Record<string, PlayerPresenceDto>) ?? {};
        const graceSeconds = (payload['graceSeconds'] as number) ?? s.graceSeconds;
        let activityFeed = s.activityFeed;
        Object.values(presence).forEach((pr) => {
          const prev = s.presence[pr.playerId];
          if (pr.playerId === s.playerId) return;
          if (pr.status === 'GRACE' && prev?.status !== 'GRACE') {
            activityFeed = pushActivity(
              activityFeed,
              `${pr.username} disconnected — rejoin within ${graceSeconds}s`,
              true,
            );
          } else if (pr.status === 'ONLINE' && prev && prev.status !== 'ONLINE') {
            activityFeed = pushActivity(activityFeed, `${pr.username} reconnected`);
          } else if (pr.status === 'PAUSED' && prev?.status !== 'PAUSED') {
            activityFeed = pushActivity(activityFeed, `${pr.username} paused the game`, true);
          }
        });
        set({
          presence,
          graceSeconds,
          players: s.players.map((p) => {
            const pr = presence[p.id];
            if (!pr) return p;
            return {
              ...p,
              connected: pr.connected,
              graceExpiresAt: pr.graceExpiresAt,
              presenceStatus: pr.status,
            };
          }),
          activityFeed,
        });
        break;
      }

      case 'CHAT_MESSAGE': {
        const msg = payload as unknown as ChatMessageDto;
        set({
          chatMessages: [...s.chatMessages, msg].slice(-100),
          activityFeed: pushActivity(s.activityFeed, `${msg.username}: ${msg.text}`),
        });
        break;
      }

      case 'ERROR':
        set({ errorMessage: payload as unknown as string });
        break;
    }
  },
}));
