import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { GameEvent, HandUpdate, SessionResumeResponse } from '../types/game';

type EventCallback = (event: GameEvent) => void;
type HandCallback = (update: HandUpdate) => void;
type ErrorCallback = (msg: GameEvent) => void;
type SnapshotCallback = (snapshot: SessionResumeResponse) => void;

let stompClient: Client | null = null;

export function connect(
  roomCode: string,
  sessionToken: string,
  onEvent: EventCallback,
  onHand: HandCallback,
  onError: ErrorCallback,
  onSnapshot: SnapshotCallback,
  onConnected?: () => void,
) {
  // BASE_URL is '/' in dev, '/acespade/' in production — strip trailing slash for URL concat.
  const wsBase = import.meta.env.BASE_URL.replace(/\/$/, '');

  stompClient = new Client({
    webSocketFactory: () => new SockJS(`${wsBase}/ws`) as WebSocket,
    connectHeaders: { 'X-Session-Token': sessionToken },
    reconnectDelay: 3000,
    onConnect: () => {
      stompClient!.subscribe(`/topic/game/${roomCode}`, (msg: IMessage) => {
        onEvent(JSON.parse(msg.body) as GameEvent);
      });
      stompClient!.subscribe('/user/queue/hand', (msg: IMessage) => {
        onHand(JSON.parse(msg.body) as HandUpdate);
      });
      stompClient!.subscribe('/user/queue/errors', (msg: IMessage) => {
        onError(JSON.parse(msg.body) as GameEvent);
      });
      stompClient!.subscribe('/user/queue/snapshot', (msg: IMessage) => {
        onSnapshot(JSON.parse(msg.body) as SessionResumeResponse);
      });
      onConnected?.();
    },
    onStompError: (frame) => {
      console.error('STOMP error', frame);
    },
  });
  stompClient.activate();
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

export function sendChat(roomCode: string, text: string) {
  stompClient?.publish({
    destination: `/app/game/${roomCode}/chat`,
    body: JSON.stringify({ text }),
  });
}

export function disconnect() {
  stompClient?.deactivate();
  stompClient = null;
}

export function sendStart(roomCode: string) {
  stompClient?.publish({ destination: `/app/game/${roomCode}/start`, body: '{}' });
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
