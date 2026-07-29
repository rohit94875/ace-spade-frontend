import type { MatchHistoryEntry } from '../types/auth';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function placementLabel(placement: number, total: number): string {
  const suffix = placement === 1 ? 'st' : placement === 2 ? 'nd' : placement === 3 ? 'rd' : 'th';
  return `${placement}${suffix} of ${total}`;
}

export default function MatchHistoryCard({ match }: { match: MatchHistoryEntry }) {
  const delta = match.ratingDelta ?? 0;
  const deltaColor = delta >= 0 ? '#74c69d' : '#e74c3c';
  const opponents = match.opponents ?? [];

  return (
    <article style={styles.card}>
      <div style={styles.cardHeader}>
        <div>
          <span style={styles.badge}>{match.won ? 'Victory' : 'Defeat'}</span>
          <span style={styles.room}>Room {match.roomCode}</span>
        </div>
        <time style={styles.date}>{formatDate(match.playedAt)}</time>
      </div>

      <div style={styles.statsRow}>
        <div style={styles.statBlock}>
          <span style={styles.statLabel}>Your score</span>
          <span style={styles.statValue}>{match.score}</span>
        </div>
        {match.placement != null && match.playerCount != null && match.playerCount > 0 && (
          <div style={styles.statBlock}>
            <span style={styles.statLabel}>Placement</span>
            <span style={styles.statValue}>{placementLabel(match.placement, match.playerCount)}</span>
          </div>
        )}
        {match.maxRounds != null && match.maxRounds > 0 && (
          <div style={styles.statBlock}>
            <span style={styles.statLabel}>Rounds</span>
            <span style={styles.statValue}>{match.maxRounds}</span>
          </div>
        )}
      </div>

      {match.ratingBefore != null && match.ratingAfter != null && (
        <div style={styles.mmrRow}>
          <span style={styles.mmrLabel}>MMR</span>
          <span style={styles.mmrValue}>
            {match.ratingBefore.toFixed(1)}
            <span style={styles.mmrArrow}> → </span>
            {match.ratingAfter.toFixed(1)}
          </span>
          <span style={{ ...styles.delta, color: deltaColor }}>
            {delta >= 0 ? '+' : ''}{delta.toFixed(1)}
          </span>
        </div>
      )}

      {match.winnerUsername && (
        <p style={styles.winnerLine}>
          Winner: <strong>{match.winnerUsername}</strong>
          {match.winnerScore != null ? ` (${match.winnerScore} pts)` : ''}
        </p>
      )}

      {opponents.length > 0 && (
        <div style={styles.opponents}>
          <span style={styles.opponentsLabel}>Table</span>
          <div style={styles.opponentChips}>
            {opponents.map((o) => (
              <span key={o.username} style={styles.chip}>
                {o.username} · {o.score}
              </span>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: 'rgba(0,0,0,0.22)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  badge: {
    display: 'inline-block',
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: '#f1c40f',
    marginRight: 8,
  },
  room: { color: '#fff', fontWeight: 700, fontSize: 14 },
  date: { color: 'rgba(255,255,255,0.45)', fontSize: 11, whiteSpace: 'nowrap' },
  statsRow: { display: 'flex', flexWrap: 'wrap', gap: 16 },
  statBlock: { display: 'flex', flexDirection: 'column', gap: 2 },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  statValue: { color: '#fff', fontWeight: 700, fontSize: 15 },
  mmrRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 10px',
    borderRadius: 8,
    background: 'rgba(45,106,79,0.25)',
  },
  mmrLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600 },
  mmrValue: { color: '#fff', fontWeight: 700, fontSize: 14, flex: 1 },
  mmrArrow: { color: 'rgba(255,255,255,0.35)', fontWeight: 400 },
  delta: { fontWeight: 800, fontSize: 14 },
  winnerLine: { margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.65)' },
  opponents: { display: 'flex', flexDirection: 'column', gap: 6 },
  opponentsLabel: { fontSize: 10, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase' },
  opponentChips: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  chip: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
    background: 'rgba(255,255,255,0.06)',
    borderRadius: 6,
    padding: '4px 8px',
  },
};
