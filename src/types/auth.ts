export interface ModeRating {
  gameMode: string;
  mmr: number;
  tier: string | null;
  placementComplete: boolean;
  placementGames: number;
  placementRequired: number;
  gamesPlayed: number;
  /** 1-based ladder rank; null while placing */
  rank?: number | null;
}

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
  leaveCount: number;
  nextLeavePenaltyMmr: number;
  modeRatings?: ModeRating[];
}

/** Public profile view — no email. */
export type PublicUserProfile = Omit<UserProfile, 'email'>;

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
  ranked?: boolean;
  maxRounds?: number;
  playerCount?: number;
  placement?: number;
  winnerUsername?: string;
  winnerScore?: number;
  gameMode?: string;
  opponents?: { username: string; score: number }[];
}
