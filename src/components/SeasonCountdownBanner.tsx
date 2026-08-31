import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCurrentSeason } from '../services/seasonApi';
import type { CurrentSeason } from '../types/season';

interface Props {
  compact?: boolean;
}

function formatCountdown(totalSeconds: number) {
  const d = Math.floor(totalSeconds / 86400);
  const h = Math.floor((totalSeconds % 86400) / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return { d, h, m, s };
}

function statusLabel(season: CurrentSeason): string {
  if (season.status === 'GRACE') {
    return season.countdownMessage ?? 'Grace period — final games still count';
  }
  if (season.status === 'SCHEDULED') {
    return season.countdownMessage ?? 'New season starts soon';
  }
  if (season.status === 'ACTIVE') {
    if (season.showCountdown) {
      return season.countdownMessage ?? 'Season ends soon — finish your ranked games!';
    }
    return season.countdownMessage ?? "Ranked classic games count toward this season's rewards.";
  }
  return `Status: ${season.status}`;
}

function countdownTargetIso(season: CurrentSeason): string | null {
  if (season.status === 'GRACE') return season.graceEndsAt;
  if (season.status === 'SCHEDULED') return season.startsAt;
  if (season.status === 'ACTIVE') return season.endsAt;
  return null;
}

function shouldShowTimer(season: CurrentSeason, secondsLeft: number): boolean {
  if (season.showCountdown && secondsLeft > 0) return true;
  const target = countdownTargetIso(season);
  if (!target) return false;
  const ms = new Date(target).getTime() - Date.now();
  if (ms <= 0) return false;
  const fourDaysMs = 4 * 24 * 60 * 60 * 1000;
  if (season.status === 'SCHEDULED' || season.status === 'GRACE') return ms <= fourDaysMs;
  if (season.status === 'ACTIVE') return ms <= fourDaysMs;
  return false;
}

function secondsUntil(iso: string): number {
  return Math.max(0, Math.floor((new Date(iso).getTime() - Date.now()) / 1000));
}

export default function SeasonCountdownBanner({ compact = false }: Props) {
  const [season, setSeason] = useState<CurrentSeason | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    const load = () => getCurrentSeason()
      .then((s) => {
        setSeason(s);
        setLoadError(false);
        const target = countdownTargetIso(s);
        const initial = target ? secondsUntil(target) : s.secondsRemaining;
        setSecondsLeft(initial > 0 ? initial : s.secondsRemaining);
      })
      .catch(() => {
        setSeason(null);
        setLoadError(true);
      });
    load();
    const refresh = setInterval(load, 5 * 60_000);
    return () => clearInterval(refresh);
  }, []);

  useEffect(() => {
    if (!season || secondsLeft <= 0) return;
    const tick = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(tick);
  }, [season?.seasonId, season?.showCountdown, season?.status]);

  if (loadError) {
    return (
      <div style={{ ...styles.banner, ...styles.bannerCalm, ...(compact ? styles.bannerCompact : {}) }}>
        <div style={styles.left}>
          <div style={styles.title}>Seasons</div>
          <div style={styles.sub}>Could not load season info — is the backend running on :8080?</div>
        </div>
        {!compact && <Link to="/seasons" style={styles.link}>Seasons →</Link>}
      </div>
    );
  }

  if (!season) return null;

  const showTimer = shouldShowTimer(season, secondsLeft);
  const { d, h, m, s } = formatCountdown(secondsLeft);
  const grace = season.status === 'GRACE';
  const urgent = showTimer || grace;

  return (
    <div style={{
      ...styles.banner,
      ...(urgent ? (grace ? styles.bannerGrace : styles.bannerWarn) : styles.bannerCalm),
      ...(compact ? styles.bannerCompact : {}),
    }}>
      <div style={styles.left}>
        <div style={styles.title}>{season.name}</div>
        <div style={styles.sub}>{statusLabel(season)}</div>
      </div>
      {showTimer && (
        <div style={styles.countdown}>
          {d > 0 && (
            <span style={styles.unit}><strong>{d}</strong><small>d</small></span>
          )}
          <span style={styles.unit}><strong>{String(h).padStart(2, '0')}</strong><small>h</small></span>
          <span style={styles.sep}>:</span>
          <span style={styles.unit}><strong>{String(m).padStart(2, '0')}</strong><small>m</small></span>
          <span style={styles.sep}>:</span>
          <span style={styles.unit}><strong>{String(s).padStart(2, '0')}</strong><small>s</small></span>
        </div>
      )}
      {!compact && (
        <Link to="/seasons" style={styles.link}>Seasons →</Link>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  banner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    padding: '12px 16px',
    borderRadius: 12,
    marginBottom: 16,
  },
  bannerCalm: {
    background: 'rgba(116, 198, 157, 0.08)',
    border: '1px solid rgba(116, 198, 157, 0.25)',
  },
  bannerWarn: {
    background: 'rgba(241, 196, 15, 0.12)',
    border: '1px solid rgba(241, 196, 15, 0.35)',
  },
  bannerGrace: {
    background: 'rgba(231, 76, 60, 0.1)',
    border: '1px solid rgba(231, 76, 60, 0.35)',
  },
  bannerCompact: {
    padding: '8px 12px',
    borderRadius: 8,
    marginBottom: 8,
  },
  left: { flex: 1, minWidth: 140 },
  title: { fontSize: 13, fontWeight: 700, color: '#f1c40f' },
  sub: { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  countdown: { display: 'flex', alignItems: 'center', gap: 4 },
  unit: { textAlign: 'center', minWidth: 36, color: '#fff', fontSize: 18, fontWeight: 800 },
  sep: { color: 'rgba(255,255,255,0.25)', fontWeight: 700 },
  link: { color: '#74c69d', fontSize: 12, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' },
};
