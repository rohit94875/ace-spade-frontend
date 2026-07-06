import axios from 'axios';
import type {
  AuthResponse, LeaderboardEntry, MatchHistoryEntry, UserProfile,
} from '../types/auth';

const base = import.meta.env.BASE_URL.replace(/\/$/, '');
const api = axios.create({ baseURL: `${base}/api` });

export const register = (email: string, password: string, username: string): Promise<AuthResponse> =>
  api.post('/auth/register', { email, password, username }).then((r) => r.data);

export const login = (email: string, password: string): Promise<AuthResponse> =>
  api.post('/auth/login', { email, password }).then((r) => r.data);

export const refresh = (refreshToken: string): Promise<AuthResponse> =>
  api.post('/auth/refresh', { refreshToken }).then((r) => r.data);

export const logout = (accessToken: string): Promise<void> =>
  api.post('/auth/logout', null, {
    headers: { Authorization: `Bearer ${accessToken}` },
  }).then(() => undefined);

export const getMe = (accessToken: string): Promise<UserProfile> =>
  api.get('/auth/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  }).then((r) => r.data);

export const getLeaderboard = (limit = 50): Promise<LeaderboardEntry[]> =>
  api.get('/rankings/leaderboard', { params: { limit } }).then((r) => r.data);

export const getMyHistory = (accessToken: string): Promise<MatchHistoryEntry[]> =>
  api.get('/rankings/history/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  }).then((r) => r.data);
