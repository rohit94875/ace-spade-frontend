import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { GameEvent, HandUpdate, SessionResumeResponse } from '../types/game';

type EventCallback = (event: GameEvent) => void;
type HandCallback = (update: HandUpdate) => void;
type ErrorCallback = (msg: GameEvent) => void;
type SnapshotCallback = (snapshot: SessionResumeResponse) => void;

const HEARTBEAT_MS = 10_000;
/** Delay teardown on React effect cleanup so StrictMode remounts do not drop the socket. */
const CLEANUP_DISCONNECT_MS = 500;

let stompClient: Client | null = null;
let activeConnectionKey: string | null = null;
let pendingDisconnectTimer: ReturnType<typeof setTimeout> | null = null;

function subscribeToGame(
  client: Client,
  roomCode: string,
  onEvent: EventCallback,
  onHand: HandCallback,
  onError: ErrorCallback,
  onSnapshot: SnapshotCallback,
) {
  client.subscribe(`/topic/game/${roomCode}`, (msg: IMessage) => {
    onEvent(JSON.parse(msg.body) as GameEvent);
  });
  client.subscribe('/user/queue/hand', (msg: IMessage) => {
    onHand(JSON.parse(msg.body) as HandUpdate);
  });
  client.subscribe('/user/queue/errors', (msg: IMessage) => {
    onError(JSON.parse(msg.body) as GameEvent);
  });
  client.subscribe('/user/queue/snapshot', (msg: IMessage) => {
    onSnapshot(JSON.parse(msg.body) as SessionResumeResponse);
  });
}

export function connect(
  roomCode: string,
  sessionToken: string,
  onEvent: EventCallback,
  onHand: HandCallback,
  onError: ErrorCallback,
  onSnapshot: SnapshotCallback,
  onConnected?: () => void,
  onDisconnected?: () => void,
) {
  const connectionKey = `${roomCode}:${sessionToken}`;
  cancelScheduledDisconnect();

  if (stompClient?.active && activeConnectionKey === connectionKey) {
    onConnected?.();
    return;
  }

  if (stompClient) {
    stompClient.deactivate();
    stompClient = null;
    activeConnectionKey = null;
  }

  activeConnectionKey = connectionKey;
  const wsBase = import.meta.env.BASE_URL.replace(/\/$/, '');

  stompClient = new Client({
    webSocketFactory: () => new SockJS(`${wsBase}/ws`) as WebSocket,
    connectHeaders: { 'X-Session-Token': sessionToken },
    reconnectDelay: 2000,
    heartbeatIncoming: HEARTBEAT_MS,
    heartbeatOutgoing: HEARTBEAT_MS,
    onConnect: () => {
      subscribeToGame(stompClient!, roomCode, onEvent, onHand, onError, onSnapshot);
      onConnected?.();
    },
    onDisconnect: () => {
      onDisconnected?.();
    },
    onWebSocketClose: () => {
      onDisconnected?.();
    },
    onStompError: (frame) => {
      console.error('STOMP error', frame);
      onDisconnected?.();
    },
  });
  stompClient.activate();
}

export function scheduleDisconnect(delayMs = CLEANUP_DISCONNECT_MS) {
  cancelScheduledDisconnect();
  pendingDisconnectTimer = setTimeout(() => {
    pendingDisconnectTimer = null;
    disconnect();
  }, delayMs);
}

export function cancelScheduledDisconnect() {
  if (pendingDisconnectTimer) {
    clearTimeout(pendingDisconnectTimer);
    pendingDisconnectTimer = null;
  }
}

export function sendLeave(roomCode: string) {
  stompClient?.publish({ destination: `/app/game/${roomCode}/leave`, body: '{}' });
}

export function sendPause(roomCode: string) {
  stompClient?.publish({ destination: `/app/game/${roomCode}/pause`, body: '{}' });
}

export function sendResume(roomCode: string) {
  stompClient?.publish({ destination: `/app/game/${roomCode}/resume`, body: '{}' });
}

export interface ChatSendPayload {
  text: string;
  mentions?: string[];
}

export function sendChat(roomCode: string, payload: ChatSendPayload | string) {
  const body = typeof payload === 'string'
    ? { text: payload }
    : payload;
  stompClient?.publish({
    destination: `/app/game/${roomCode}/chat`,
    body: JSON.stringify(body),
  });
}

export function disconnect() {
  cancelScheduledDisconnect();
  stompClient?.deactivate();
  stompClient = null;
  activeConnectionKey = null;
}

export function sendStart(roomCode: string) {
  stompClient?.publish({ destination: `/app/game/${roomCode}/start`, body: '{}' });
}

export function sendReady(roomCode: string, ready: boolean) {
  stompClient?.publish({
    destination: `/app/game/${roomCode}/ready`,
    body: JSON.stringify({ ready }),
  });
}

export function sendVoteBot(roomCode: string, targetPlayerId: string) {
  stompClient?.publish({
    destination: `/app/game/${roomCode}/vote-bot`,
    body: JSON.stringify({ targetPlayerId }),
  });
}

export function sendKick(roomCode: string, targetPlayerId: string) {
  stompClient?.publish({
    destination: `/app/game/${roomCode}/kick`,
    body: JSON.stringify({ targetPlayerId }),
  });
}

export function sendTeam(roomCode: string, team: 1 | 2) {
  stompClient?.publish({
    destination: `/app/game/${roomCode}/team`,
    body: JSON.stringify({ team }),
  });
}

export function sendBid(roomCode: string, amount: number) {
  stompClient?.publish({
    destination: `/app/game/${roomCode}/bid`,
    body: JSON.stringify({ amount }),
  });
}

export function sendPlayCard(
  roomCode: string,
  suit: string,
  rank: string,
  deckIndex: number,
) {
  stompClient?.publish({
    destination: `/app/game/${roomCode}/play`,
    body: JSON.stringify({ suit, rank, deckIndex }),
  });
}
