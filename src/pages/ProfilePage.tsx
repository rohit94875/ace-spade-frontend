import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getMyHistory } from '../services/authApi';
import type { MatchHistoryEntry } from '../types/auth';

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const getAccessToken = useAuthStore((s) => s.getAccessToken);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const logout = useAuthStore((s) => s.logout);
  const [history, setHistory] = useState<MatchHistoryEntry[]>([]);

  useEffect(() => {
    refreshProfile().catch(() => undefined);
    getAccessToken().then((token) => {
      if (token) getMyHistory(token).then(setHistory).catch(() => setHistory([]));
    });
  }, []);

  if (!user) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <p style={styles.muted}>Sign in to view your profile and ranked stats.</p>
          <Link to="/login" style={styles.link}>Sign in</Link>
        </div>
      </div>
    );
  }

  const placementLeft = Math.max(0, user.placementRequired - user.placementGames);

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>{user.username}</h1>
          <button type="button" style={styles.logoutBtn} onClick={() => logout()}>Log out</button>
        </div>
        <p style={styles.email}>{user.email}</p>

        <div style={styles.statGrid}>
          <div style={styles.stat}>
            <span style={styles.statLabel}>MMR</span>
            <span style={styles.statValue}>{user.mmr.toFixed(1)}</span>
          </div>
          <div style={styles.stat}>
            <span style={styles.statLabel}>Tier</span>
            <span style={styles.statValue}>
              {user.tier ?? (placementLeft > 0 ? `Placement (${user.placementGames}/${user.placementRequired})` : '—')}
            </span>
          </div>
          <div style={styles.stat}>
            <span style={styles.statLabel}>Games</span>
            <span style={styles.statValue}>{user.gamesPlayed}</span>
          </div>
          <div style={styles.stat}>
            <span style={styles.statLabel}>Season</span>
            <span style={styles.statValue}>{user.seasonId}</span>
          </div>
        </div>

        {!user.placementComplete && (
          <p style={styles.placementNote}>
            Play {placementLeft} more ranked game{placementLeft === 1 ? '' : 's'} to reveal your tier badge. MMR is always visible.
          </p>
        )}

        <h2 style={styles.sectionTitle}>Ranked match history</h2>
        {history.length === 0 ? (
          <p style={styles.muted}>No ranked games yet.</p>
        ) : (
          <div style={styles.historyList}>
            {history.slice(0, 20).map((h) => (
              <div key={h.gameRecordId} style={styles.historyRow}>
                <span>{h.won ? '🏆' : '•'} Room {h.roomCode}</span>
                <span>{h.score} pts</span>
                {h.ratingDelta != null && (
                  <span style={{ color: h.ratingDelta >= 0 ? '#74c69d' : '#e74c3c' }}>
                    {h.ratingDelta >= 0 ? '+' : ''}{h.ratingDelta.toFixed(1)} MMR
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        <div style={styles.navLinks}>
          <Link to="/leaderboard" style={styles.link}>Leaderboard</Link>
          <Link to="/" style={styles.link}>Lobby</Link>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#0d2b1a', padding: 24, display: 'flex', justifyContent: 'center' },
  card: { background: 'linear-gradient(135deg, #1b4332, #0d2b1a)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 520 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: '#fff', fontSize: 22, fontWeight: 800, margin: 0 },
  logoutBtn: { background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12 },
  email: { color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: '4px 0 20px' },
  statGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 },
  stat: { background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: 12 },
  statLabel: { display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 4 },
  statValue: { color: '#fff', fontWeight: 700, fontSize: 16 },
  placementNote: { fontSize: 12, color: '#f1c40f', marginBottom: 16 },
  sectionTitle: { color: '#fff', fontSize: 16, margin: '8px 0 12px' },
  muted: { color: 'rgba(255,255,255,0.45)', fontSize: 13 },
  historyList: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 },
  historyRow: { display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.75)', background: 'rgba(0,0,0,0.15)', borderRadius: 8, padding: '8px 10px' },
  navLinks: { display: 'flex', gap: 16 },
  link: { color: '#74c69d', fontSize: 14, textDecoration: 'none' },
};
