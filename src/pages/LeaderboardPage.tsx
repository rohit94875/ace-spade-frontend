import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getLeaderboard } from '../services/authApi';
import type { LeaderboardEntry } from '../types/auth';

export const TIER_COLORS: Record<string, string> = {
  // Bottom
  "Please Don't Play": "#616161",

  // Sand
  "Sand 3": "#E8D5B7",
  "Sand 2": "#DCC29A",
  "Sand 1": "#D2B48C",

  // Bronze
  "Bronze 3": "#D89A5B",
  "Bronze 2": "#D18444",
  "Bronze 1": "#CD7F32",

  // Silver
  "Silver 3": "#E2E2E2",
  "Silver 2": "#D1D1D1",
  "Silver 1": "#C0C0C0",

  // Gold
  "Gold 3": "#F8DB72",
  "Gold 2": "#F4CF3D",
  "Gold 1": "#F1C40F",

  // Platinum
  "Platinum 3": "#C5F7F7",
  "Platinum 2": "#A4F1F1",
  "Platinum 1": "#81ECEC",

  // Diamond
  "Diamond 3": "#CCC7FF",
  "Diamond 2": "#B6B0FF",
  "Diamond 1": "#A29BFE",

  // Top Tiers
  "Master": "#8E44AD",
  "ACE KING": "#E74C3C",
  "Challenger": "#00CEC9",
};

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaderboard(50)
      .then(setEntries)
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Global Ranked Leaderboard</h1>
        <p style={styles.sub}>Season 1 · One global pool · Tier shown after 3 placement games · Casual (5 rounds) does not affect your rank</p>

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
                  <td style={styles.td}>{e.username}</td>
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
  back: { color: '#74c69d', fontSize: 14, textDecoration: 'none' },
};
