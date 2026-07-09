export interface UserProfile {
  id: number;
  email: string;
  username: string;
  mmr: number;
  tier: string | null;
  placementComplete: boolean;
  placementGames: number;
  placementRequired: number;
  gamesPlayed: number;
  seasonId: number;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresInMs: number;
  user: UserProfile;
}

export interface RatingDelta {
  userId: number;
  username: string;
  ratingBefore: number;
  ratingAfter: number;
  ratingDelta: number;
  tier: string | null;
  placementComplete: boolean;
  placementGames: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: number;
  username: string;
  mmr: number;
  tier: string;
  gamesPlayed: number;
}

export interface MatchHistoryEntry {
  gameRecordId: number;
  roomCode: string;
  score: number;
  won: boolean;
  ratingBefore?: number;
  ratingAfter?: number;
  ratingDelta?: number;
  playedAt: string;
}
