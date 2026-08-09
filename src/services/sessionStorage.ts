const STORAGE_KEY = 'acespade_session';

export interface StoredSession {
  playerId: string;
  sessionToken: string;
  username: string;
  roomCode: string;
  isHost: boolean;
  playWithBot?: boolean;
  isSpectator?: boolean;
}

export function saveSession(data: StoredSession): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore quota / private mode
  }
}

export function loadSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredSession;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
