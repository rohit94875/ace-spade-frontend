import { resumeSession, rejoinRoom } from './api';
import { loadSession, saveSession, clearSession, StoredSession } from './sessionStorage';
import type { SessionResumeResponse } from '../types/game';

export interface RestoreResult {
  ok: boolean;
  resume?: SessionResumeResponse;
  stored?: StoredSession;
  rejoined?: boolean;
}

/** Try resume token, then authenticated rejoin for the room code. */
export async function restoreGameSession(
  getAccessToken: () => Promise<string | null>,
  roomCodeOverride?: string,
): Promise<RestoreResult> {
  const stored = loadSession();
  const roomCode = roomCodeOverride ?? stored?.roomCode;
  if (!roomCode) {
    return { ok: false };
  }

  if (stored?.sessionToken && stored.roomCode === roomCode && !stored.isSpectator) {
    try {
      const res = await resumeSession(stored.sessionToken);
      if (res.valid && res.room) {
        return { ok: true, resume: res, stored };
      }
    } catch {
      // fall through to rejoin
    }
  }

  const access = await getAccessToken();
  if (!access || stored?.isSpectator) {
    return { ok: false, stored: stored ?? undefined };
  }

  try {
    const joined = await rejoinRoom(roomCode);
    const next: StoredSession = {
      playerId: joined.playerId,
      sessionToken: joined.sessionToken,
      username: joined.username,
      roomCode: joined.roomCode,
      isHost: stored?.isHost ?? false,
      playWithBot: stored?.playWithBot,
      isSpectator: false,
    };
    saveSession(next);
    const res = await resumeSession(joined.sessionToken);
    if (res.valid && res.room) {
      return { ok: true, resume: res, stored: next, rejoined: true };
    }
  } catch {
    // room ended or no seat
  }

  if (stored?.roomCode === roomCode) {
    clearSession();
  }
  return { ok: false };
}
