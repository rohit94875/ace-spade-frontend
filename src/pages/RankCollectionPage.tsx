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
          <div style={styles.heroLeft}>
            <TierBadge
              tier={profile.tier}
              placing={!profile.placementComplete}
              placementGames={profile.placementGames}
              placementRequired={profile.placementRequired}
              size="lg"
            />
            <div>
              <h1 style={styles.title}>Rank collection</h1>
              <p style={styles.sub}>
                {isOwnProfile ? 'Your' : `${profile.username}'s`} tier progress and card face unlocks.
              </p>
              {profile.tier && profile.placementComplete && (
                <p style={{ ...styles.currentTier, color: tierColor(profile.tier) }}>
                  Current rank: {profile.tier}
                </p>
              )}
            </div>
          </div>
        </div>

        <RankCatalog
          currentTier={profile.tier}
          placementComplete={profile.placementComplete}
        />
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#0d2b1a', padding: 24, display: 'flex', justifyContent: 'center' },
  card: {
    background: 'linear-gradient(135deg, #1b4332, #0d2b1a)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 16,
    padding: 28,
    width: '100%',
    maxWidth: 1040,
  },
  topNav: {
    display: 'flex',
    gap: 16,
    marginBottom: 20,
    paddingBottom: 12,
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  hero: { marginBottom: 8 },
  heroLeft: { display: 'flex', alignItems: 'center', gap: 16 },
  title: { margin: '0 0 6px', fontSize: 22, fontWeight: 900, color: '#fff' },
  sub: { margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.45 },
  currentTier: { margin: '8px 0 0', fontSize: 12, fontWeight: 800 },
  muted: { color: 'rgba(255,255,255,0.45)', fontSize: 13 },
  link: { color: '#74c69d', fontSize: 14, fontWeight: 600, textDecoration: 'none' },
};
