import type { UserProfile } from '../types/auth';

const AUTH_KEY = 'ace-spade-auth';

export interface StoredAuth {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: UserProfile;
}

export function loadAuth(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredAuth;
  } catch {
    return null;
  }
}

export function saveAuth(auth: StoredAuth): void {
  localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
}

export function clearAuth(): void {
  localStorage.removeItem(AUTH_KEY);
}

export function isAccessTokenExpired(auth: StoredAuth): boolean {
  return Date.now() >= auth.expiresAt - 30_000;
}
