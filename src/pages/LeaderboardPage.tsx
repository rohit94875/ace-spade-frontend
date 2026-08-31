import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getLeaderboard } from '../services/authApi';
import { getCurrentSeason } from '../services/seasonApi';
import type { LeaderboardEntry } from '../types/auth';
import { TIER_COLORS } from '../constants/tiers';
import TierBadge from '../components/TierBadge';
import SeasonCountdownBanner from '../components/SeasonCountdownBanner';

export { TIER_COLORS };

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [seasonName, setSeasonName] = useState('Current season');

  useEffect(() => {
    getCurrentSeason()
      .then((s) => setSeasonName(s.name))
      .catch(() => undefined);
    getLeaderboard(50)
      .then(setEntries)
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Global Ranked Leaderboard</h1>
        <SeasonCountdownBanner />
        <p style={styles.sub}>{seasonName} · Classic ranked · Tier after placement</p>

        {loading ? (
          <p style={styles.muted}>Loading…</p>
        ) : entries.length === 0 ? (
          <p style={styles.muted}>No ranked players yet. Complete placement to appear here.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>#</th>
                <th style={styles.th}>Player</th>
                <th style={styles.th}>Tier</th>
                <th style={styles.th}>Games</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.userId}>
                  <td style={styles.td}>{e.rank}</td>
                  <td style={styles.td}>
                    <Link to={`/profile/${e.userId}`} style={styles.playerLink}>
                      <TierBadge tier={e.tier} size="sm" />
                      {' '}{e.username}
                    </Link>
                  </td>
                  <td style={{ ...styles.td, color: TIER_COLORS[e.tier] ?? '#fff', fontWeight: 600 }}>{e.tier}</td>
                  <td style={styles.td}>{e.gamesPlayed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <Link to="/" style={styles.back}>← Back to lobby</Link>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#0d2b1a', padding: 24, display: 'flex', justifyContent: 'center' },
  card: { background: 'linear-gradient(135deg, #1b4332, #0d2b1a)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 640 },
  title: { color: '#fff', fontSize: 22, fontWeight: 800, margin: '0 0 6px' },
  sub: { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 20 },
  muted: { color: 'rgba(255,255,255,0.45)' },
  table: { width: '100%', borderCollapse: 'collapse' as const, marginBottom: 20 },
  th: { textAlign: 'left' as const, fontSize: 12, color: 'rgba(255,255,255,0.45)', paddingBottom: 8 },
  td: { fontSize: 14, color: 'rgba(255,255,255,0.85)', padding: '8px 4px', borderTop: '1px solid rgba(255,255,255,0.06)' },
  playerLink: { color: '#74c69d', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 },
  back: { color: '#74c69d', fontSize: 14, textDecoration: 'none' },
};
