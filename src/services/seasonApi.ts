import axios from 'axios';
import type { CurrentSeason, SeasonDetail, SeasonReward, SeasonSummary } from '../types/season';
import { loadAuth } from './authStorage';

const base = import.meta.env.BASE_URL.replace(/\/$/, '');
const api = axios.create({ baseURL: `${base}/api` });

export const getCurrentSeason = (): Promise<CurrentSeason> =>
  api.get('/seasons/current').then((r) => r.data);

export const listSeasons = (): Promise<SeasonSummary[]> =>
  api.get('/seasons').then((r) => r.data);

export const getSeasonDetail = (id: number): Promise<SeasonDetail> =>
  api.get(`/seasons/${id}`).then((r) => r.data);

export const getMySeasonRewards = (seasonId: number): Promise<SeasonReward[]> => {
  const stored = loadAuth();
  return api.get(`/seasons/${seasonId}/rewards/me`, {
    headers: stored ? { Authorization: `Bearer ${stored.accessToken}` } : {},
  }).then((r) => r.data);
};
