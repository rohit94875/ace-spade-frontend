import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getLeaderboard, getMyHistory } from '../services/authApi';
import { getCurrentSeason } from '../services/seasonApi';
import type { LeaderboardEntry, MatchHistoryEntry } from '../types/auth';
import { TIER_COLORS } from '../constants/tiers';
import { GAME_MODES, gameModeLabel, type GameMode } from '../constants/gameModes';
import TierBadge from '../components/TierBadge';
import SeasonCountdownBanner from '../components/SeasonCountdownBanner';
import MatchHistoryCard from '../components/MatchHistoryCard';
import { useAuthStore } from '../store/authStore';

export { TIER_COLORS };

type LeaderboardTab = GameMode;

const TABS: { id: LeaderboardTab; label: string; icon: string }[] = GAME_MODES.map((m) => ({
  id: m.id,
  label: m.name,
  icon: m.icon,
}));

const HISTORY_ONLY: GameMode[] = ['CLAN_BATTLE', 'POKER'];

export default function LeaderboardPage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [tab, setTab] = useState<LeaderboardTab>('CLASSIC');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [modeHistory, setModeHistory] = useState<MatchHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [seasonName, setSeasonName] = useState('Current season');

  useEffect(() => {
    getCurrentSeason()
      .then((s) => setSeasonName(s.name))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    setLoading(true);
    if (HISTORY_ONLY.includes(tab)) {
      if (!accessToken) {
        setModeHistory([]);
        setLoading(false);
        return;
      }
      getMyHistory(accessToken)
        .then((rows) => {
          setModeHistory(rows.filter((m) => m.gameMode === tab).slice(0, 20));
        })
        .catch(() => setModeHistory([]))
        .finally(() => setLoading(false));
      return;
    }
    getLeaderboard(50, tab as 'CLASSIC' | 'RUTHLESS_HIDDEN')
      .then(setEntries)
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [tab, accessToken]);

  const modeMeta = useMemo(
    () => GAME_MODES.find((m) => m.id === tab),
    [tab],
  );

  const historyLabel = tab === 'POKER' ? 'poker' : 'clan battle';

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Leaderboard</h1>
        <SeasonCountdownBanner />
        <p style={styles.sub}>{seasonName}</p>

        <div style={styles.tabs} role="tablist" aria-label="Game mode">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                style={{ ...styles.tab, ...(active ? styles.tabActive : {}) }}
                onClick={() => setTab(t.id)}
              >
                <span aria-hidden>{t.icon}</span> {t.label}
              </button>
            );
          })}
        </div>

        {!HISTORY_ONLY.includes(tab) && (
          <p style={styles.hint}>
            {modeMeta?.description ?? 'Ranked MMR · tier after placement'}
          </p>
        )}

        {HISTORY_ONLY.includes(tab) && (
          <div style={styles.clanBanner}>
            <strong>{gameModeLabel(tab)} has no MMR.</strong>
            {' '}This tab shows your recent {historyLabel} matches only.
          </div>
        )}

        {loading ? (
          <p style={styles.muted}>Loading…</p>
        ) : HISTORY_ONLY.includes(tab) ? (
          !accessToken ? (
            <p style={styles.muted}>
              <Link to="/login" style={styles.playerLink}>Log in</Link>
              {' '}to see your {historyLabel} history.
            </p>
          ) : modeHistory.length === 0 ? (
            <p style={styles.muted}>
              No {historyLabel} games yet. Create a {gameModeLabel(tab)} room from the lobby.
            </p>
          ) : (
            <div style={styles.historyList}>
              {modeHistory.map((m) => (
                <MatchHistoryCard key={m.gameRecordId} match={m} />
              ))}
            </div>
          )
        ) : entries.length === 0 ? (
          <p style={styles.muted}>
            No {gameModeLabel(tab)} ranked players yet. Complete placement to appear here.
          </p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>#</th>
                <th style={styles.th}>Player</th>
                <th style={styles.th}>Tier</th>
                <th style={styles.th}>MMR</th>
                <th style={styles.th}>Games</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.userId}>
                  <td style={styles.td}>{e.rank}</td>
                  <td style={styles.td}>
                    <Link to={`/profile/${e.userId}`} style={styles.playerLink}>{e.username}</Link>
                  </td>
                  <td style={styles.td}><TierBadge tier={e.tier} size="sm" /></td>
                  <td style={styles.td}>{Math.round(e.mmr)}</td>
                  <td style={styles.td}>{e.gamesPlayed}</td>
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
  clanBanner: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    background: 'rgba(241,196,15,0.1)',
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
  },
  muted: { color: 'rgba(255,255,255,0.45)', marginTop: 20 },
  historyList: { display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 },
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
  playerLink: { color: '#74c69d', textDecoration: 'none' },
  back: {
    display: 'inline-block',
    marginTop: 20,
    color: 'rgba(255,255,255,0.55)',
    textDecoration: 'none',
  },
};
