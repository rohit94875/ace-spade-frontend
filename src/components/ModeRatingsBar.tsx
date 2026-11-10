import TierBadge from './TierBadge';
import type { ModeRating } from '../types/auth';
import { RANKED_GAME_MODES, gameModeLabel } from '../constants/gameModes';

interface Props {
  ratings?: ModeRating[] | null;
  /** Fallback Classic fields when API has not sent modeRatings yet. */
  fallback?: {
    mmr: number;
    tier: string | null;
    placementComplete: boolean;
    placementGames: number;
    placementRequired: number;
  } | null;
  compact?: boolean;
}

function emptyMode(gameMode: string, fallback?: Props['fallback']): ModeRating {
  const isClassic = gameMode === 'CLASSIC';
  return {
    gameMode,
    mmr: isClassic && fallback ? fallback.mmr : 1500,
    tier: isClassic && fallback ? fallback.tier : null,
    placementComplete: isClassic && fallback ? fallback.placementComplete : false,
    placementGames: isClassic && fallback ? fallback.placementGames : 0,
    placementRequired: fallback?.placementRequired ?? 5,
    gamesPlayed: 0,
    rank: null,
  };
}

/** Always Classic + Ruthless, filled from API when present. */
export function mergeModeRatings(
  ratings?: ModeRating[] | null,
  fallback?: Props['fallback'],
): ModeRating[] {
  const byMode = new Map((ratings ?? []).map((r) => [r.gameMode, r]));
  return RANKED_GAME_MODES.map((m) => byMode.get(m.id) ?? emptyMode(m.id, fallback));
}

function ModeRow({ r }: { r: ModeRating }) {
  const placing = !r.placementComplete;
  const status = placing
    ? `Placing (${r.placementGames}/${r.placementRequired})`
    : (r.tier ?? '—');
  const rankBit = !placing && r.rank != null ? ` · Rank #${r.rank}` : '';

  return (
    <div style={styles.row}>
      <TierBadge
        tier={r.tier}
        placing={placing}
        placementGames={r.placementGames}
        placementRequired={r.placementRequired}
        size="sm"
      />
      <div style={styles.text}>
        <span style={styles.mode}>{gameModeLabel(r.gameMode)}</span>
        <span style={styles.detail}>
          MMR {Number(r.mmr).toFixed(1)} · {status}{rankBit}
        </span>
      </div>
    </div>
  );
}

export default function ModeRatingsBar({ ratings, fallback, compact }: Props) {
  const list = mergeModeRatings(ratings, fallback);

  return (
    <div style={compact ? styles.wrapCompact : styles.wrap}>
      {list.map((r) => (
        <ModeRow key={r.gameMode} r={r} />
      ))}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    width: '100%',
  },
  wrapCompact: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
    width: '100%',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 10px',
    borderRadius: 10,
    background: 'rgba(241,196,15,0.08)',
    border: '1px solid rgba(241,196,15,0.22)',
    minWidth: 0,
  },
  text: { display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 },
  mode: {
    fontSize: 11,
    fontWeight: 700,
    color: 'rgba(255,255,255,0.55)',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  detail: {
    fontSize: 12,
    fontWeight: 600,
    color: '#f1c40f',
    lineHeight: 1.3,
  },
};
