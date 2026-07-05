import { useState } from 'react';
import { PlayerDto } from '../types/game';
import { RoundHistoryEntry } from '../store/gameStore';

interface Props {
  players: PlayerDto[];
  scores: Record<string, number>;
  round: number;
  phase: string | null;
  roundHistory: RoundHistoryEntry[];
}

export default function ScorePanel({ players, scores, round, phase, roundHistory }: Props) {
  const [showHistory, setShowHistory] = useState(false);

  const sorted = [...players].sort(
    (a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0),
  );

  return (
    <div style={styles.panel}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.title}>Scoreboard</span>
        <span style={styles.round}>Round {round}/13</span>
      </div>

      <div style={styles.phaseRow}>
        <span style={{ ...styles.phaseBadge, background: phaseColor(phase) }}>
          {phase ?? 'LOBBY'}
        </span>
      </div>

      {/* Current standings */}
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Player</th>
            <th style={styles.th}>Bid</th>
            <th style={styles.th}>Won</th>
            <th style={styles.th}>Score</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((p, i) => (
            <tr key={p.id} style={i === 0 ? styles.topRow : {}}>
              <td style={styles.td}>
                {i === 0 && '🥇 '}
                {p.host && '👑 '}
                {p.currentTurn && <span style={styles.turnDot} />}
                {p.username}
              </td>
              <td style={styles.td}>{p.bid ?? '–'}</td>
              <td style={styles.td}>{p.tricksWon}</td>
              <td style={{ ...styles.td, fontWeight: 700, color: '#74c69d' }}>
                {scores[p.id] ?? 0}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Round history toggle */}
      {roundHistory.length > 0 && (
        <div style={styles.historySection}>
          <button
            style={styles.historyToggle}
            onClick={() => setShowHistory((v) => !v)}
          >
            {showHistory ? '▲' : '▼'} Round History ({roundHistory.length})
          </button>

          {showHistory && (
            <div style={styles.historyScroll}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Rnd</th>
                    {players.map((p) => (
                      <th key={p.id} style={{ ...styles.th, maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.username.length > 6 ? p.username.slice(0, 5) + '…' : p.username}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {roundHistory.map((r) => (
                    <tr key={r.round}>
                      <td style={{ ...styles.td, color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
                        R{r.round}
                      </td>
                      {players.map((p) => {
                        const earned = r.roundScores[p.id] ?? 0;
                        const bid = r.bids[p.id] ?? 0;
                        const won = r.tricksWon[p.id] ?? 0;
                        const hit = bid === won;
                        return (
                          <td
                            key={p.id}
                            style={{
                              ...styles.td,
                              fontSize: 11,
                              color: hit ? '#74c69d' : 'rgba(255,255,255,0.4)',
                              textAlign: 'center' as const,
                            }}
                            title={`Bid ${bid}, Won ${won}`}
                          >
                            {earned > 0 ? `+${earned}` : '0'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function phaseColor(phase: string | null) {
  switch (phase) {
    case 'LOBBY':    return '#555';
    case 'BIDDING':  return '#2980b9';
    case 'PLAYING':  return '#27ae60';
    case 'GAME_END': return '#8e44ad';
    default:         return '#555';
  }
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    background: 'rgba(0,0,0,0.3)',
    borderRadius: 14,
    padding: '16px 18px',
    minWidth: 220,
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontWeight: 700, fontSize: 15, color: '#fff' },
  round: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  phaseRow: { marginBottom: 12 },
  phaseBadge: {
    fontSize: 11, padding: '2px 8px', borderRadius: 6,
    color: '#fff', fontWeight: 700, display: 'inline-block',
  },
  table: { width: '100%', borderCollapse: 'collapse' as const },
  th: { fontSize: 11, color: 'rgba(255,255,255,0.5)', textAlign: 'left' as const, paddingBottom: 6, fontWeight: 600 },
  td: { fontSize: 13, color: 'rgba(255,255,255,0.85)', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' },
  topRow: { background: 'rgba(116,198,157,0.08)' },
  turnDot: {
    display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
    background: '#f1c40f', marginRight: 4, verticalAlign: 'middle',
  },
  historySection: { marginTop: 14 },
  historyToggle: {
    width: '100%', textAlign: 'left' as const, background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
    color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600,
    padding: '6px 10px', cursor: 'pointer', marginBottom: 8,
  },
  historyScroll: { overflowX: 'auto' as const, maxHeight: 220, overflowY: 'auto' as const },
};
