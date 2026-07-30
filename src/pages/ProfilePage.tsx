import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getMyHistory, getUserHistory, getUserProfile } from '../services/authApi';
import type { MatchHistoryEntry, PublicUserProfile } from '../types/auth';
import MatchHistoryCard from '../components/MatchHistoryCard';
import TierBadge from '../components/TierBadge';
import { openRankCollectionWindow } from './RankCollectionPage';
import { tierColor } from '../constants/tiers';
import { RANKED_MIN_ROUNDS, RANKED_MAX_ROUNDS } from '../constants/gameLength';

export default function ProfilePage() {
  const { userId: userIdParam } = useParams();
  const currentUser = useAuthStore((s) => s.user);
  const getAccessToken = useAuthStore((s) => s.getAccessToken);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const logout = useAuthStore((s) => s.logout);
  const [history, setHistory] = useState<MatchHistoryEntry[]>([]);
  const [otherProfile, setOtherProfile] = useState<PublicUserProfile | null>(null);
  const [loadingOther, setLoadingOther] = useState(false);

  const viewingUserId = userIdParam ? Number(userIdParam) : currentUser?.id;
  const isOwnProfile = !userIdParam || viewingUserId === currentUser?.id;
  const profile = isOwnProfile ? currentUser : otherProfile;

  useEffect(() => {
    if (isOwnProfile) {
      refreshProfile().catch(() => undefined);
      getAccessToken().then((token) => {
        if (token) getMyHistory(token).then(setHistory).catch(() => setHistory([]));
      });
      return;
    }
    if (!viewingUserId || Number.isNaN(viewingUserId)) return;
    setLoadingOther(true);
    Promise.all([
      getUserProfile(viewingUserId),
      getUserHistory(viewingUserId),
    ])
      .then(([p, h]) => {
        setOtherProfile(p);
        setHistory(h);
      })
      .catch(() => {
        setOtherProfile(null);
        setHistory([]);
      })
      .finally(() => setLoadingOther(false));
  }, [isOwnProfile, viewingUserId, refreshProfile, getAccessToken]);

  if (!currentUser) return null;

  if (!isOwnProfile && loadingOther) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <p style={styles.muted}>Loading profile…</p>
        </div>
      </div>
    );
  }

  if (!isOwnProfile && !profile) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.topNav}>
            <Link to="/leaderboard" style={styles.link}>← Leaderboard</Link>
          </div>
          <p style={styles.muted}>Player not found.</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const placementLeft = Math.max(0, profile.placementRequired - profile.placementGames);
  const mmrDisplay = profile.placementComplete
    ? profile.mmr.toFixed(1)
    : `${profile.mmr.toFixed(1)} (placing)`;

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.topNav}>
          <Link to="/" style={styles.link}>← Lobby</Link>
          <Link to="/leaderboard" style={styles.link}>Leaderboard</Link>
        </div>

        <div style={styles.header}>
          <div style={styles.titleRow}>
            <TierBadge
              tier={profile.tier}
              placing={!profile.placementComplete}
              placementGames={profile.placementGames}
              placementRequired={profile.placementRequired}
              size="xl"
            />
            <h1 style={styles.title}>{profile.username}</h1>
          </div>
          {isOwnProfile && (
            <button type="button" style={styles.logoutBtn} onClick={() => logout()}>Log out</button>
          )}
        </div>
        {profile.tier && (
          <p style={{ ...styles.tierLine, color: tierColor(profile.tier) }}>{profile.tier}</p>
        )}
        {isOwnProfile && currentUser && (
          <p style={styles.email}>{currentUser.email}</p>
        )}

        <div style={styles.statGrid}>
          <div style={{ ...styles.stat, ...styles.statHighlight }}>
            <span style={styles.statLabel}>MMR</span>
            <span style={styles.statValue}>{mmrDisplay}</span>
          </div>
          <div style={styles.stat}>
            <span style={styles.statLabel}>Tier</span>
            <span style={{ ...styles.statValue, display: 'flex', alignItems: 'center', gap: 8 }}>
              <TierBadge tier={profile.tier} size="sm" />
              {profile.tier ?? (placementLeft > 0 ? `Placement (${profile.placementGames}/${profile.placementRequired})` : '—')}
            </span>
          </div>
          <div style={styles.stat}>
            <span style={styles.statLabel}>Games</span>
            <span style={styles.statValue}>{profile.gamesPlayed}</span>
          </div>
          <div style={styles.stat}>
            <span style={styles.statLabel}>Season</span>
            <span style={styles.statValue}>{profile.seasonId}</span>
          </div>
        </div>

        {isOwnProfile && !profile.placementComplete && (
          <p style={styles.placementNote}>
            Play {placementLeft} more ranked game{placementLeft === 1 ? '' : 's'} to reveal your tier badge (after {profile.placementRequired} placement games).
          </p>
        )}

        {isOwnProfile && (
          <p style={styles.casualNote}>
            Casual games (5 rounds) don&apos;t affect your rank. Create a ranked room from the lobby ({RANKED_MIN_ROUNDS}–{RANKED_MAX_ROUNDS} rounds) for longer games and leaderboard progress.
          </p>
        )}

        <section style={styles.collectionCta}>
          <div>
            <h2 style={styles.collectionTitle}>Rank collection</h2>
            <p style={styles.collectionSub}>
              Browse all tier badges and card face colors. Opens in a separate window.
            </p>
          </div>
          <button
            type="button"
            style={styles.collectionBtn}
            onClick={() => openRankCollectionWindow(
              isOwnProfile ? '/rank-collection' : `/profile/${viewingUserId}/ranks`,
            )}
          >
            Open rank collection ↗
          </button>
        </section>

        <h2 style={styles.sectionTitle}>Match history</h2>
        {history.length === 0 ? (
          <p style={styles.muted}>No ranked games yet.</p>
        ) : (
          <div style={styles.historyList}>
            {history.slice(0, 20).map((h) => (
              <MatchHistoryCard key={h.gameRecordId} match={h} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#0d2b1a', padding: 24, display: 'flex', justifyContent: 'center' },
  card: { background: 'linear-gradient(135deg, #1b4332, #0d2b1a)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 880 },
  topNav: { display: 'flex', gap: 16, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.08)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  titleRow: { display: 'flex', alignItems: 'center', gap: 12 },
  title: { color: '#fff', fontSize: 22, fontWeight: 800, margin: 0 },
  tierLine: { fontSize: 13, fontWeight: 700, margin: '0 0 8px', paddingLeft: 84 },
  logoutBtn: { background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12 },
  email: { color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: '4px 0 20px' },
  statGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 },
  stat: { background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: 12 },
  statHighlight: { border: '1px solid rgba(116,198,157,0.35)' },
  statLabel: { display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 4 },
  statValue: { color: '#fff', fontWeight: 700, fontSize: 16 },
  placementNote: { fontSize: 12, color: '#f1c40f', marginBottom: 12 },
  casualNote: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 16, lineHeight: 1.45 },
  collectionCta: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    marginTop: 8,
    marginBottom: 20,
    padding: '16px 18px',
    borderRadius: 12,
    border: '1px solid rgba(116,198,157,0.25)',
    background: 'rgba(116,198,157,0.06)',
  },
  collectionTitle: { margin: '0 0 4px', fontSize: 16, fontWeight: 800, color: '#fff' },
  collectionSub: { margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.45, maxWidth: 420 },
  collectionBtn: {
    background: 'linear-gradient(135deg, #2d6a4f, #1b4332)',
    border: '1px solid rgba(116,198,157,0.45)',
    color: '#fff',
    borderRadius: 10,
    padding: '10px 16px',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  sectionTitle: { color: '#fff', fontSize: 16, margin: '8px 0 12px' },
  muted: { color: 'rgba(255,255,255,0.45)', fontSize: 13 },
  historyList: { display: 'flex', flexDirection: 'column', gap: 12 },
  link: { color: '#74c69d', fontSize: 14, fontWeight: 600, textDecoration: 'none' },
};
