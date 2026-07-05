import axios from 'axios';
import type { DisconnectPolicy } from '../types/game';

// BASE_URL is '/' in dev, '/acespade/' in production — strip trailing slash before appending.
const base = import.meta.env.BASE_URL.replace(/\/$/, '');
const api = axios.create({ baseURL: `${base}/api` });

export interface CreateRoomResponse {
  roomCode: string;
  playerId: string;
  sessionToken: string;
  username: string;
}

export interface JoinRoomResponse {
  roomCode: string;
  playerId: string;
  sessionToken: string;
  username: string;
}

export const createRoom = (
  username: string,
  playWithBot: boolean,
  disconnectPolicy: DisconnectPolicy,
): Promise<CreateRoomResponse> =>
  api.post('/rooms', { username, playWithBot, disconnectPolicy }).then((r) => r.data);

export const joinRoom = (code: string, username: string): Promise<JoinRoomResponse> =>
  api.post(`/rooms/${code}/join`, { username }).then((r) => r.data);

export const getRoom = (code: string) =>
  api.get(`/rooms/${code}`).then((r) => r.data);
