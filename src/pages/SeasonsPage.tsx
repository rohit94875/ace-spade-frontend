import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  getCurrentSeason, getSeasonDetail, getSeasonLeaderboard, listSeasons,
} from '../services/seasonApi';
import type { CurrentSeason, SeasonDetail, SeasonSummary } from '../types/season';
import { MIN_RANKED_GAMES_FOR_REWARDS } from '../types/season';
import type { LeaderboardEntry } from '../types/auth';
import SeasonCountdownBanner from '../components/SeasonCountdownBanner';
import RewardBadge from '../components/RewardBadge';
import AwardIcon from '../components/AwardIcon';
import TierBadge from '../components/TierBadge';
import { formatSeasonRange, seasonStatusColor, seasonStatusLabel } from '../utils/seasonFormat';
import { sortAwardWinners } from '../utils/rewardSort';
import { REWARD_LABELS } from '../types/season';

export default function SeasonsPage() {
  const { id } = useParams();
  const seasonId = id ? Number(id) : null;
  const [seasons, setSeasons] = useState<SeasonSummary[]>([]);
  const [current, setCurrent] = useState<CurrentSeason | null>(null);
  const [detail, setDetail] = useState<SeasonDetail | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      listSeasons().catch(() => [] as SeasonSummary[]),
      getCurrentSeason().catch(() => null),
    ]).then(([s, c]) => {
      setSeasons(s);
      setCurrent(c);
    });
  }, []);

  useEffect(() => {
    if (!seasonId || Number.isNaN(seasonId)) {
      setDetail(null);
      setLeaderboard([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      getSeasonDetail(seasonId),
      getSeasonLeaderboard(seasonId, 10),
    ])
      .then(([d, lb]) => {
        setDetail(d);
        setLeaderboard(lb);
      })
      .catch(() => {
        setDetail(null);
        setLeaderboard([]);
      })
      .finally(() => setLoading(false));
  }, [seasonId]);

  if (seasonId && !Number.isNaN(seasonId)) {
    return (
      <div style={styles.page}>
        <div style={styles.cardWide}>
          <Link to="/seasons" style={styles.back}>← All seasons</Link>
          {loading ? (
            <p style={styles.muted}>Loading…</p>
          ) : !detail ? (
            <p style={styles.muted}>Season not found.</p>
          ) : (
            <>
              <div style={styles.detailHeader}>
                <div>
                  <span style={{ ...styles.statusPill, color: seasonStatusColor(detail.status) }}>
                    {seasonStatusLabel(detail.status)}
                  </span>
                  <h1 style={styles.title}>{detail.name}</h1>
                  <p style={styles.dateRange}>{formatSeasonRange(detail.startsAt, detail.endsAt)}</p>
                </div>
              </div>

              {!detail.rewardsTracked && (
                <div style={styles.infoBox}>
                  Rewards were not tracked for this season.
                </div>
              )}

              {detail.rewardsTracked && (
                <div style={styles.infoBox}>
                  Tier cards unlock at season end after {MIN_RANKED_GAMES_FOR_REWARDS}+ ranked classic games.
                  Award badges go to #1 in each category (same minimum).
                </div>
              )}

              {detail.status === 'ACTIVE' && leaderboard.length > 0 && (
                <section style={styles.section}>
                  <h2 style={styles.sectionTitle}>Classic leaderboard</h2>
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
                      {leaderboard.map((e) => (
                        <tr key={e.userId}>
                          <td style={styles.td}>{e.rank}</td>
                          <td style={{ ...styles.td, color: '#74c69d', fontWeight: 600 }}>
                            <Link to={`/profile/${e.userId}`} style={styles.playerLink}>{e.username}</Link>
                          </td>
                          <td style={styles.td}>
                            <TierBadge tier={e.tier} size="sm" />
                          </td>
                          <td style={styles.td}>{e.mmr.toFixed(1)}</td>
                          <td style={styles.td}>{e.gamesPlayed}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <Link to="/leaderboard" style={styles.link}>Full leaderboard →</Link>
                </section>
              )}

              <section style={styles.section}>
                <h2 style={styles.sectionTitle}>Award winners</h2>
                {detail.awardWinners.length > 0 ? (
                  <div style={styles.winnerList}>
                    {sortAwardWinners(detail.awardWinners).map((w) => (
                      <div key={`${w.symbolType}-${w.userId}`} style={styles.winnerRow}>
                        <AwardIcon symbol={w.symbolType} size={40} />
                        <Link to={`/profile/${w.userId}`} style={styles.winnerName}>{w.username}</Link>
                        <span style={styles.winnerStat}>
                          {REWARD_LABELS[w.symbolType]}
                          {w.statValue != null && ` · ${w.symbolType === 'TOP_MMR' ? w.statValue.toFixed(0) : Math.round(w.statValue)}`}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={styles.muted}>
                    {detail.rewardsTracked && detail.status !== 'COMPLETED'
                      ? 'Awards are calculated when the season completes.'
                      : 'No awards recorded for this season.'}
                  </p>
                )}
              </section>

              <section style={styles.section}>
                <h2 style={styles.sectionTitle}>Tier cards</h2>
                <p style={styles.mutedSmall}>
                  Everyone with {MIN_RANKED_GAMES_FOR_REWARDS}+ ranked games earns a card based on final MMR.
                </p>
                <div style={styles.tierPreview}>
                  {(['SAND_CARD', 'BRONZE_CARD', 'SILVER_CARD', 'GOLD_CARD', 'PLATINUM_CARD', 'DIAMOND_CARD', 'ACE_CARD'] as const).map((sym) => (
                    <RewardBadge key={sym} symbol={sym} compact />
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.topNav}>
          <Link to="/" style={styles.link}>← Lobby</Link>
          <Link to="/leaderboard" style={styles.link}>Leaderboard</Link>
          <Link to="/profile" style={styles.link}>Profile</Link>
        </div>
        <h1 style={styles.title}>Seasons</h1>
        <SeasonCountdownBanner />
        <p style={styles.sub}>
          Monthly ranked seasons (IST). Play {MIN_RANKED_GAMES_FOR_REWARDS}+ ranked classic games to earn tier cards and compete for awards.
        </p>

        {seasons.length === 0 ? (
          <p style={styles.muted}>No seasons yet.</p>
        ) : (
          <div style={styles.list}>
            {seasons.map((s) => {
              const isCurrent = current?.seasonId === s.seasonId;
              return (
                <Link
                  key={s.seasonId}
                  to={`/seasons/${s.seasonId}`}
                  style={{
                    ...styles.seasonRow,
                    ...(isCurrent ? styles.seasonRowCurrent : {}),
                  }}
                >
                  <div>
                    <div style={styles.seasonName}>{s.name}</div>
                    <div style={styles.seasonDates}>{formatSeasonRange(s.startsAt, s.endsAt)}</div>
                    {!s.rewardsTracked && (
                      <div style={styles.noRewardsTag}>No rewards tracked</div>
                    )}
                  </div>
                  <span style={{ ...styles.seasonStatus, color: seasonStatusColor(s.status) }}>
                    {seasonStatusLabel(s.status)}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#0d2b1a', padding: 24, display: 'flex', justifyContent: 'center' },
  card: { background: 'linear-gradient(135deg, #1b4332, #0d2b1a)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 720 },
  cardWide: { background: 'linear-gradient(135deg, #1b4332, #0d2b1a)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 880 },
  topNav: { display: 'flex', gap: 16, marginBottom: 16 },
  title: { color: '#fff', fontSize: 22, fontWeight: 800, margin: '0 0 6px' },
  sub: { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 20, lineHeight: 1.5 },
  muted: { color: 'rgba(255,255,255,0.45)', fontSize: 13 },
  mutedSmall: { color: 'rgba(255,255,255,0.45)', fontSize: 12, marginBottom: 12 },
  list: { display: 'flex', flexDirection: 'column', gap: 10 },
  seasonRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
    padding: '14px 16px', borderRadius: 12,
    background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)',
    textDecoration: 'none', color: 'inherit', transition: 'border-color 0.2s',
  },
  seasonRowCurrent: {
    borderColor: 'rgba(241,196,15,0.45)', background: 'rgba(241,196,15,0.06)',
  },
  seasonName: { color: '#fff', fontWeight: 700, fontSize: 15 },
  seasonDates: { color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 4 },
  noRewardsTag: { fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 4 },
  seasonStatus: { fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' },
  link: { color: '#74c69d', fontSize: 14, textDecoration: 'none', fontWeight: 600 },
  back: { color: '#74c69d', fontSize: 14, textDecoration: 'none', display: 'inline-block', marginBottom: 16 },
  detailHeader: { marginBottom: 20 },
  statusPill: { fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' },
  dateRange: { color: 'rgba(255,255,255,0.55)', fontSize: 13, margin: '8px 0 0' },
  graceNote: { color: '#e67e22', fontSize: 12, marginTop: 6 },
  infoBox: {
    padding: '12px 14px', borderRadius: 10, marginBottom: 20, fontSize: 12, lineHeight: 1.45,
    background: 'rgba(52,152,219,0.08)', border: '1px solid rgba(52,152,219,0.2)',
    color: 'rgba(255,255,255,0.65)',
  },
  section: { marginBottom: 28 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: 800, margin: '0 0 12px' },
  table: { width: '100%', borderCollapse: 'collapse', marginBottom: 12 },
  th: { fontSize: 11, color: 'rgba(255,255,255,0.45)', textAlign: 'left', paddingBottom: 8, fontWeight: 600, textTransform: 'uppercase' },
  td: { fontSize: 13, color: 'rgba(255,255,255,0.85)', padding: '8px 4px', borderTop: '1px solid rgba(255,255,255,0.06)' },
  playerLink: { color: '#74c69d', textDecoration: 'none' },
  winnerList: { display: 'flex', flexDirection: 'column', gap: 10 },
  winnerRow: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '10px 12px', borderRadius: 10,
    background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)',
  },
  winnerName: { color: '#74c69d', fontSize: 13, fontWeight: 600, textDecoration: 'none', flex: 1 },
  winnerStat: { fontSize: 11, color: 'rgba(255,255,255,0.45)', whiteSpace: 'nowrap' },
  tierPreview: { display: 'flex', flexWrap: 'wrap', gap: 12 },
};
