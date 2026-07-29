import { resumeSession, rejoinRoom } from './api';
import { loadSession, saveSession, clearSession, StoredSession } from './sessionStorage';
import type { SessionResumeResponse } from '../types/game';

export interface RestoreResult {
  ok: boolean;
  resume?: SessionResumeResponse;
  stored?: StoredSession;
  rejoined?: boolean;
}

/** Try resume token, then authenticated rejoin for the same room code. */
export async function restoreGameSession(
  getAccessToken: () => Promise<string | null>,
): Promise<RestoreResult> {
  const stored = loadSession();
  if (!stored?.roomCode) {
    return { ok: false };
  }

  try {
    const res = await resumeSession(stored.sessionToken);
    if (res.valid && res.room) {
      return { ok: true, resume: res, stored };
    }
  } catch {
    // fall through to rejoin
  }

  const access = await getAccessToken();
  if (!access || stored.isSpectator) {
    return { ok: false, stored };
  }

  try {
    const joined = await rejoinRoom(stored.roomCode);
    const next: StoredSession = {
      ...stored,
      playerId: joined.playerId,
      sessionToken: joined.sessionToken,
      username: joined.username,
      roomCode: joined.roomCode,
    };
    saveSession(next);
    const res = await resumeSession(joined.sessionToken);
    if (res.valid && res.room) {
      return { ok: true, resume: res, stored: next, rejoined: true };
    }
  } catch {
    // room ended or no seat
  }

  clearSession();
  return { ok: false };
}
