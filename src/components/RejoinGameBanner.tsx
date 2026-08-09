import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useGameStore } from '../store/gameStore';
import { getActiveGame } from '../services/api';
import { loadSession } from '../services/sessionStorage';
import { restoreGameSession } from '../services/sessionRestore';

export default function RejoinGameBanner() {
  const navigate = useNavigate();
  const getAccessToken = useAuthStore((s) => s.getAccessToken);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const applyResume = useGameStore((s) => s.applyResume);
  const inGameRoom = useGameStore((s) => s.roomCode);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoggedIn() || inGameRoom) {
      setRoomCode(null);
      return;
    }
    const stored = loadSession();
    if (stored?.roomCode && !stored.isSpectator) {
      setRoomCode(stored.roomCode);
      return;
    }
    getActiveGame()
      .then((active) => {
        if (active?.roomCode) setRoomCode(active.roomCode);
      })
      .catch(() => setRoomCode(null));
  }, [isLoggedIn, inGameRoom]);

  if (!roomCode || inGameRoom) return null;

  async function handleRejoin() {
    setLoading(true);
    setError('');
    try {
      const result = await restoreGameSession(getAccessToken, roomCode ?? undefined);
      if (result.ok && result.resume && result.stored) {
        applyResume(result.resume, result.stored);
        navigate('/game');
        return;
      }
      setError('Could not rejoin — the game may have ended.');
      setRoomCode(null);
    } catch {
      setError('Rejoin failed. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.banner}>
      <div style={styles.text}>
        <strong>You have an open game</strong>
        <span style={styles.sub}>Room {roomCode} — reconnect to your seat</span>
        {error && <span style={styles.error}>{error}</span>}
      </div>
      <button type="button" style={styles.btn} disabled={loading} onClick={handleRejoin}>
        {loading ? 'Rejoining…' : 'Rejoin game'}
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  banner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
    padding: '12px 16px',
    marginBottom: 16,
    borderRadius: 12,
    background: 'rgba(52, 152, 219, 0.18)',
    border: '1px solid rgba(52, 152, 219, 0.45)',
  },
  text: { display: 'flex', flexDirection: 'column', gap: 2, color: '#fff', fontSize: 13 },
  sub: { color: 'rgba(255,255,255,0.65)', fontSize: 12 },
  error: { color: '#e74c3c', fontSize: 11, marginTop: 4 },
  btn: {
    padding: '8px 16px',
    borderRadius: 8,
    border: 'none',
    background: '#3498db',
    color: '#fff',
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
};
