import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getSeasonDetail, listSeasons } from '../services/seasonApi';
import type { SeasonDetail, SeasonSummary } from '../types/season';
import { REWARD_LABELS } from '../types/season';
import SeasonCountdownBanner from '../components/SeasonCountdownBanner';

export default function SeasonsPage() {
  const { id } = useParams();
  const seasonId = id ? Number(id) : null;
  const [seasons, setSeasons] = useState<SeasonSummary[]>([]);
  const [detail, setDetail] = useState<SeasonDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listSeasons()
      .then(setSeasons)
      .catch(() => setSeasons([]));
  }, []);

  useEffect(() => {
    if (!seasonId || Number.isNaN(seasonId)) {
      setDetail(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    getSeasonDetail(seasonId)
      .then(setDetail)
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [seasonId]);

  if (seasonId && !Number.isNaN(seasonId)) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <Link to="/seasons" style={styles.back}>← All seasons</Link>
          {loading ? (
            <p style={styles.muted}>Loading…</p>
          ) : !detail ? (
            <p style={styles.muted}>Season not found.</p>
          ) : (
            <>
              <h1 style={styles.title}>{detail.name}</h1>
              <p style={styles.sub}>
                {detail.status}
                {!detail.rewardsTracked && ' · Rewards were not tracked for this season'}
              </p>
              {detail.awardWinners.length > 0 ? (
                <div style={styles.winners}>
                  <h2 style={styles.section}>Award winners</h2>
                  {detail.awardWinners.map((w) => (
                    <div key={`${w.symbolType}-${w.userId}`} style={styles.winnerRow}>
                      <span>{REWARD_LABELS[w.symbolType]}</span>
                      <Link to={`/profile`} style={styles.playerLink}>{w.username}</Link>
                      {w.statValue != null && (
                        <span style={styles.statVal}>{w.statValue}</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={styles.muted}>
                  {detail.rewardsTracked
                    ? 'Awards will appear when this season completes.'
                    : 'No awards recorded for this season.'}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Seasons</h1>
        <SeasonCountdownBanner />
        <p style={styles.sub}>Monthly ranked seasons (IST). Fresh MMR each season from Season 2 onward.</p>
        {seasons.length === 0 ? (
          <p style={styles.muted}>No seasons yet.</p>
        ) : (
          <div style={styles.list}>
            {seasons.map((s) => (
              <Link key={s.seasonId} to={`/seasons/${s.seasonId}`} style={styles.seasonRow}>
                <span style={styles.seasonName}>{s.name}</span>
                <span style={styles.seasonStatus}>{s.status}</span>
              </Link>
            ))}
          </div>
        )}
        <div style={styles.nav}>
          <Link to="/leaderboard" style={styles.link}>Leaderboard</Link>
          <Link to="/" style={styles.link}>Lobby</Link>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#0d2b1a', padding: 24, display: 'flex', justifyContent: 'center' },
  card: { background: 'linear-gradient(135deg, #1b4332, #0d2b1a)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 640 },
  title: { color: '#fff', fontSize: 22, fontWeight: 800, margin: '0 0 6px' },
  sub: { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 20 },
  muted: { color: 'rgba(255,255,255,0.45)', fontSize: 13 },
  list: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 },
  seasonRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.2)',
    textDecoration: 'none', color: 'inherit',
  },
  seasonName: { color: '#fff', fontWeight: 600, fontSize: 14 },
  seasonStatus: { color: 'rgba(255,255,255,0.45)', fontSize: 12 },
  nav: { display: 'flex', gap: 16 },
  link: { color: '#74c69d', fontSize: 14, textDecoration: 'none' },
  back: { color: '#74c69d', fontSize: 14, textDecoration: 'none', display: 'inline-block', marginBottom: 16 },
  section: { color: '#fff', fontSize: 16, margin: '16px 0 10px' },
  winners: { marginTop: 8 },
  winnerRow: {
    display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0',
    borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  playerLink: { color: '#74c69d', textDecoration: 'none', fontWeight: 600 },
  statVal: { marginLeft: 'auto', color: 'rgba(255,255,255,0.45)' },
};
