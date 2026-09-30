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

type LeaderboardTab = 'CLASSIC' | 'RUTHLESS_HIDDEN' | 'CLAN_BATTLE';

const TABS: { id: LeaderboardTab; label: string; icon: string }[] = GAME_MODES.map((m) => ({
  id: m.id,
  label: m.name,
  icon: m.icon,
}));

export default function LeaderboardPage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [tab, setTab] = useState<LeaderboardTab>('CLASSIC');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [clanHistory, setClanHistory] = useState<MatchHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [seasonName, setSeasonName] = useState('Current season');

  useEffect(() => {
    getCurrentSeason()
      .then((s) => setSeasonName(s.name))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    setLoading(true);
    if (tab === 'CLAN_BATTLE') {
      if (!accessToken) {
        setClanHistory([]);
        setLoading(false);
        return;
      }
      getMyHistory(accessToken)
        .then((rows) => {
          setClanHistory(rows.filter((m) => m.gameMode === 'CLAN_BATTLE').slice(0, 20));
        })
        .catch(() => setClanHistory([]))
        .finally(() => setLoading(false));
      return;
    }
    getLeaderboard(50, tab)
      .then(setEntries)
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [tab, accessToken]);

  const modeMeta = useMemo(
    () => GAME_MODES.find((m) => m.id === tab),
    [tab],
  );

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

        {tab !== 'CLAN_BATTLE' && (
          <p style={styles.hint}>
            {modeMeta?.description ?? 'Ranked MMR · tier after placement'}
          </p>
        )}

        {tab === 'CLAN_BATTLE' && (
          <div style={styles.clanBanner}>
            <strong>Clan Battle has no MMR.</strong> This tab shows your recent clan matches only.
          </div>
        )}

        {loading ? (
          <p style={styles.muted}>Loading…</p>
        ) : tab === 'CLAN_BATTLE' ? (
          !accessToken ? (
            <p style={styles.muted}>
              <Link to="/login" style={styles.playerLink}>Log in</Link> to see your clan battle history.
            </p>
          ) : clanHistory.length === 0 ? (
            <p style={styles.muted}>No clan battles yet. Create a Clan Battle room from the lobby.</p>
          ) : (
            <div style={styles.historyList}>
              {clanHistory.map((m) => (
                <MatchHistoryCard key={m.gameRecordId} match={m} />
              ))}
            </div>
          )
        ) : entries.length === 0 ? (
          <p style={styles.muted}>
            No {gameModeLabel(tab as GameMode)} ranked players yet. Complete placement to appear here.
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
                <tr key={`${tab}-${e.userId}`}>
                  <td style={styles.td}>{e.rank}</td>
                  <td style={styles.td}>
                    <Link to={`/profile/${e.userId}`} style={styles.playerLink}>
                      <TierBadge tier={e.tier} size="sm" />
                      {' '}{e.username}
                    </Link>
                  </td>
                  <td style={{ ...styles.td, color: TIER_COLORS[e.tier] ?? '#fff', fontWeight: 600 }}>{e.tier}</td>
                  <td style={styles.td}>{e.mmr.toFixed(1)}</td>
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
  sub: { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 14 },
  hint: { color: 'rgba(255,255,255,0.45)', fontSize: 12, margin: '0 0 16px', lineHeight: 1.45 },
  muted: { color: 'rgba(255,255,255,0.45)' },
  tabs: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 },
  tab: {
    padding: '8px 14px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: 'rgba(255,255,255,0.55)',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  tabActive: {
    background: 'rgba(116, 198, 157, 0.15)',
    borderColor: '#74c69d',
    color: '#74c69d',
  },
  clanBanner: {
    padding: '10px 12px',
    borderRadius: 8,
    background: 'rgba(52, 152, 219, 0.1)',
    border: '1px solid rgba(52, 152, 219, 0.25)',
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 16,
    lineHeight: 1.45,
  },
  historyList: { display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 16 },
  table: { width: '100%', borderCollapse: 'collapse' as const, marginBottom: 20 },
  th: { textAlign: 'left' as const, fontSize: 12, color: 'rgba(255,255,255,0.45)', paddingBottom: 8 },
  td: { fontSize: 14, color: 'rgba(255,255,255,0.85)', padding: '8px 4px', borderTop: '1px solid rgba(255,255,255,0.06)' },
  playerLink: { color: '#74c69d', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 },
  back: { color: '#74c69d', fontSize: 14, textDecoration: 'none' },
};
