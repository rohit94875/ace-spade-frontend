import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getUserProfile } from '../services/authApi';
import type { PublicUserProfile } from '../types/auth';
import RankCatalog from '../components/RankCatalog';
import TierBadge from '../components/TierBadge';
import { tierColor } from '../constants/tiers';

export default function RankCollectionPage() {
  const { userId: userIdParam } = useParams();
  const currentUser = useAuthStore((s) => s.user);
  const [otherProfile, setOtherProfile] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  const viewingUserId = userIdParam ? Number(userIdParam) : currentUser?.id;
  const isOwnProfile = !userIdParam || viewingUserId === currentUser?.id;
  const profile = isOwnProfile ? currentUser : otherProfile;

  useEffect(() => {
    if (isOwnProfile || !viewingUserId || Number.isNaN(viewingUserId)) return;
    setLoading(true);
    getUserProfile(viewingUserId)
      .then(setOtherProfile)
      .catch(() => setOtherProfile(null))
      .finally(() => setLoading(false));
  }, [isOwnProfile, viewingUserId]);

  if (!currentUser) return null;

  if (!isOwnProfile && loading) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <p style={styles.muted}>Loading rank collection…</p>
        </div>
      </div>
    );
  }

  if (!profile) {
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

  const backTo = isOwnProfile ? '/profile' : `/profile/${viewingUserId}`;

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.topNav}>
          <Link to={backTo} style={styles.link}>← Profile</Link>
          <Link to="/" style={styles.link}>Lobby</Link>
          <Link to="/leaderboard" style={styles.link}>Leaderboard</Link>
        </div>

        <div style={styles.hero}>
          <TierBadge
            tier={profile.tier}
            placing={!profile.placementComplete}
            placementGames={profile.placementGames}
            placementRequired={profile.placementRequired}
            size="md"
          />
          <div style={styles.heroText}>
            <h1 style={styles.title}>Rank collection</h1>
            <p style={styles.sub}>
              {isOwnProfile ? profile.username : `${profile.username}'s tiers`}
              {profile.tier && profile.placementComplete && (
                <span style={{ color: tierColor(profile.tier), fontWeight: 700 }}>
                  {' · '}{profile.tier}
                </span>
              )}
            </p>
          </div>
        </div>

        <RankCatalog
          currentTier={profile.tier}
          placementComplete={profile.placementComplete}
          viewingOwnProfile={isOwnProfile}
          hideHeader
        />
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#0d2b1a', padding: 20, display: 'flex', justifyContent: 'center' },
  card: {
    background: 'linear-gradient(135deg, #1b4332, #0d2b1a)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 16,
    padding: '20px 22px',
    width: '100%',
    maxWidth: 880,
  },
  topNav: {
    display: 'flex',
    gap: 14,
    marginBottom: 14,
    paddingBottom: 10,
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  hero: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
    paddingBottom: 12,
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  heroText: { minWidth: 0 },
  title: { margin: 0, fontSize: 18, fontWeight: 900, color: '#fff' },
  sub: { margin: '2px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  muted: { color: 'rgba(255,255,255,0.45)', fontSize: 13 },
  link: { color: '#74c69d', fontSize: 13, fontWeight: 600, textDecoration: 'none' },
};
