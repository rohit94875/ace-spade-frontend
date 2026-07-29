import axios from 'axios';
import type { DisconnectPolicy, MaxRounds, PublicRoomDto, SessionResumeResponse } from '../types/game';
import { loadAuth, saveAuth } from './authStorage';
import { refresh as refreshAuth } from './authApi';

const base = import.meta.env.BASE_URL.replace(/\/$/, '');
const api = axios.create({ baseURL: `${base}/api` });

api.interceptors.request.use(async (config) => {
  const stored = loadAuth();
  if (!stored) return config;
  let token = stored.accessToken;
  if (Date.now() >= stored.expiresAt - 30_000) {
    try {
      const res = await refreshAuth(stored.refreshToken);
      token = res.accessToken;
      saveAuth({
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
        expiresAt: Date.now() + res.expiresInMs,
        user: res.user,
      });
    } catch {
      return config;
    }
  }
  config.headers = config.headers ?? {};
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

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
  ranked = false,
  maxRounds: MaxRounds = 13,
  publicRoom = false,
): Promise<CreateRoomResponse> =>
  api.post('/rooms', { username, playWithBot, disconnectPolicy, ranked, maxRounds, publicRoom }).then((r) => r.data);

export const joinRoom = (code: string, username: string): Promise<JoinRoomResponse> =>
  api.post(`/rooms/${code}/join`, { username }).then((r) => r.data);

export const rejoinRoom = (code: string): Promise<JoinRoomResponse> =>
  api.post(`/rooms/${code}/rejoin`, {}).then((r) => r.data);

export const spectateRoom = (code: string, username: string): Promise<JoinRoomResponse> =>
  api.post(`/rooms/${code}/spectate`, { username }).then((r) => r.data);

export const listPublicRooms = (): Promise<PublicRoomDto[]> =>
  api.get('/rooms/public').then((r) => r.data);

export const updateNickname = (
  roomCode: string,
  sessionToken: string,
  nickname: string,
): Promise<{ nickname: string }> =>
  api.patch(`/rooms/${roomCode}/nickname`, { nickname }, {
    headers: { 'X-Session-Token': sessionToken },
  }).then((r) => r.data);

export const getRoom = (code: string) =>
  api.get(`/rooms/${code}`).then((r) => r.data);

export const resumeSession = (sessionToken: string): Promise<SessionResumeResponse> =>
  api.get('/sessions/me', {
    headers: { 'X-Session-Token': sessionToken },
  }).then((r) => r.data);
