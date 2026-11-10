import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllTimeLeaderboard } from '../services/authApi';
import type { AllTimeEntry } from '../types/auth';
import SeasonCountdownBanner from '../components/SeasonCountdownBanner';

type Sort = 'wins' | 'winPct';

const TABS: { id: Sort; label: string }[] = [
  { id: 'wins', label: 'Most wins' },
  { id: 'winPct', label: 'Best win %' },
];

const MIN_GAMES = 25;

export default function AllTimeLeaderboardPage() {
  const [sort, setSort] = useState<Sort>('wins');
  const [entries, setEntries] = useState<AllTimeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getAllTimeLeaderboard(sort, 50)
      .then(setEntries)
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [sort]);

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>All-time leaderboard</h1>
        <SeasonCountdownBanner />
        <p style={styles.sub}>All seasons combined · Classic and Ruthless</p>

        <div style={styles.tabs} role="tablist" aria-label="Sort by">
          {TABS.map((t) => {
            const active = sort === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                style={{ ...styles.tab, ...(active ? styles.tabActive : {}) }}
                onClick={() => setSort(t.id)}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <p style={styles.hint}>
          Ranked games across every season. Minimum {MIN_GAMES} games to be listed.
        </p>

        {loading ? (
          <p style={styles.muted}>Loading…</p>
        ) : entries.length === 0 ? (
          <p style={styles.muted}>No players with {MIN_GAMES}+ ranked games yet.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>#</th>
                <th style={styles.th}>Player</th>
                <th style={styles.th}>Games</th>
                <th style={styles.th}>Wins</th>
                <th style={styles.th}>Win %</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.userId}>
                  <td style={{ ...styles.td, ...(e.rank <= 3 ? styles.gold : {}) }}>{e.rank}</td>
                  <td style={styles.td}>
                    <Link to={`/profile/${e.userId}`} style={styles.playerLink}>{e.username}</Link>
                  </td>
                  <td style={styles.td}>{e.games}</td>
                  <td style={styles.td}>{e.wins}</td>
                  <td style={styles.td}>{e.winPct.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <Link to="/" style={styles.back}>← Lobby</Link>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    padding: '24px 16px',
    background: 'radial-gradient(ellipse at top, #1b4332 0%, #081c15 55%)',
  },
  card: {
    width: '100%',
    maxWidth: 720,
    background: 'rgba(0,0,0,0.35)',
    borderRadius: 16,
    padding: 24,
    border: '1px solid rgba(255,255,255,0.08)',
  },
  title: { margin: 0, color: '#fff', fontSize: 28 },
  sub: { color: 'rgba(255,255,255,0.55)', marginTop: 4 },
  tabs: { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  tab: {
    padding: '8px 12px',
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'transparent',
    color: 'rgba(255,255,255,0.7)',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
  },
  tabActive: {
    background: 'rgba(116,198,157,0.2)',
    borderColor: '#74c69d',
    color: '#fff',
  },
  hint: { fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 12 },
  muted: { color: 'rgba(255,255,255,0.45)', marginTop: 20 },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: 16 },
  th: {
    textAlign: 'left',
    padding: '8px 6px',
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  td: {
    padding: '10px 6px',
    color: '#fff',
    fontSize: 14,
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  gold: { color: '#f1c40f' },
  playerLink: { color: '#74c69d', textDecoration: 'none' },
  back: {
    display: 'inline-block',
    marginTop: 20,
    color: 'rgba(255,255,255,0.55)',
    textDecoration: 'none',
  },
};
