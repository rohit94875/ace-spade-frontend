import axios from 'axios';
import type { CurrentSeason, SeasonDetail, SeasonReward, SeasonRewardsGroup, SeasonSummary } from '../types/season';
import { loadAuth } from './authStorage';

const base = import.meta.env.BASE_URL.replace(/\/$/, '');
const api = axios.create({ baseURL: `${base}/api` });

function authHeaders() {
  const stored = loadAuth();
  return stored ? { Authorization: `Bearer ${stored.accessToken}` } : {};
}

export const getCurrentSeason = (): Promise<CurrentSeason> =>
  api.get('/seasons/current').then((r) => r.data);

export const listSeasons = (): Promise<SeasonSummary[]> =>
  api.get('/seasons').then((r) => r.data);

export const getSeasonDetail = (id: number): Promise<SeasonDetail> =>
  api.get(`/seasons/${id}`).then((r) => r.data);

export const getSeasonLeaderboard = (id: number, limit = 10) =>
  api.get(`/seasons/${id}/leaderboard`, { params: { limit } }).then((r) => r.data);

export const getAllMySeasonRewards = (): Promise<SeasonRewardsGroup[]> =>
  api.get('/seasons/rewards/me', { headers: authHeaders() }).then((r) => r.data);

export const getMySeasonRewards = (seasonId: number): Promise<SeasonReward[]> => {
  return api.get(`/seasons/${seasonId}/rewards/me`, {
    headers: authHeaders(),
  }).then((r) => r.data);
};
