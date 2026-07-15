import { motion } from 'framer-motion';
import { PlayerDto } from '../types/game';
import { RatingDelta } from '../types/auth';
import { RoundHistoryEntry } from '../store/gameStore';

interface RoundSummaryData {
  round: number;
  roundScores: Record<string, number>;
  cumulativeScores: Record<string, number>;
  bids: Record<string, number>;
  tricksWon: Record<string, number>;
  gameOver: boolean;
  winnerUsername?: string;
  winnerScore?: number;
  forfeit?: boolean;
  forfeitedUsername?: string;
  ratingUpdates?: Record<string, RatingDelta>;
}

interface Props {
  data: RoundSummaryData;
  players: PlayerDto[];
  roundHistory: RoundHistoryEntry[];
  onDismiss: () => void;
}

export default function RoundSummary({ data, players, roundHistory, onDismiss }: Props) {
  return (
    <motion.div
      style={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        style={styles.modal}
        initial={{ scale: 0.8, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 24 }}
      >
        {data.gameOver ? (
          <div style={styles.winnerBanner}>
            <span style={{ fontSize: 40 }}>🏆</span>
            <h2 style={styles.title}>Game Over!</h2>
            <p style={styles.winner}>
              {data.forfeit && data.forfeitedUsername
                ? `${data.forfeitedUsername} left — ${data.winnerUsername} wins with ${data.winnerScore} points!`
                : `${data.winnerUsername} wins with ${data.winnerScore} points!`}
            </p>
          </div>
        ) : (
          <h2 style={styles.title}>Round {data.round} Complete</h2>
        )}

        {/* This-round summary */}
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Player</th>
              <th style={styles.th}>Bid</th>
              <th style={styles.th}>Won</th>
              <th style={styles.th}>+Score</th>
              <th style={styles.th}>Total</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => {
              const bid   = data.bids[p.id] ?? 0;
              const won   = data.tricksWon[p.id] ?? 0;
              const earned = data.roundScores[p.id] ?? 0;
              const total  = data.cumulativeScores[p.id] ?? 0;
              const hit    = bid === won;
              return (
                <tr key={p.id}>
                  <td style={styles.td}>{p.username}</td>
                  <td style={styles.td}>{bid}</td>
                  <td style={{ ...styles.td, color: hit ? '#74c69d' : '#e74c3c' }}>
                    {won} {hit ? '✓' : '✗'}
                  </td>
                  <td style={{ ...styles.td, color: earned > 0 ? '#74c69d' : 'rgba(255,255,255,0.4)' }}>
                    +{earned}
                  </td>
                  <td style={{ ...styles.td, fontWeight: 700, color: '#fff' }}>{total}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {data.gameOver && data.ratingUpdates && Object.keys(data.ratingUpdates).length > 0 && (
          <div style={styles.ratingBox}>
            <p style={styles.historyTitle}>Ranked results</p>
            {players.map((p) => {
              const delta = data.ratingUpdates?.[p.id];
              if (!delta) return null;
              const up = delta.ratingDelta >= 0;
              return (
                <div key={p.id} style={styles.ratingRow}>
                  <span>{p.username}</span>
                  <span
                    style={{ color: up ? '#74c69d' : '#e74c3c', fontWeight: 700 }}
                    title={up ? 'Rank up' : 'Rank down'}
                  >
                    {up ? '▲ Rank up' : '▼ Rank down'}
                  </span>
                  {delta.tier
                    ? <span style={{ color: '#f1c40f' }}>{delta.tier}</span>
                    : <span style={{ color: 'rgba(255,255,255,0.5)' }}>Placement</span>}
                </div>
              );
            })}
          </div>
        )}

        {/* Full round history (always shown on game over, collapsible otherwise) */}
        {roundHistory.length > 1 && (
          <div style={styles.historyBox}>
            <p style={styles.historyTitle}>
              {data.gameOver ? 'Full Game History' : 'Round History'}
            </p>
            <div style={styles.historyScroll}>
              <table style={{ ...styles.table, minWidth: 320 }}>
                <thead>
                  <tr>
                    <th style={{ ...styles.th, width: 36 }}>Rnd</th>
                    {players.map((p) => (
                      <th key={p.id} style={{ ...styles.th, textAlign: 'center' as const }}>
                        {p.username}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {roundHistory.map((r) => (
                    <tr key={r.round}>
                      <td style={{ ...styles.td, color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
                        R{r.round}
                      </td>
                      {players.map((p) => {
                        const earned = r.roundScores[p.id] ?? 0;
                        const bid    = r.bids[p.id] ?? 0;
                        const won    = r.tricksWon[p.id] ?? 0;
                        const hit    = bid === won;
                        return (
                          <td
                            key={p.id}
                            style={{
                              ...styles.td,
                              fontSize: 12,
                              textAlign: 'center' as const,
                              color: hit ? '#74c69d' : 'rgba(255,255,255,0.35)',
                            }}
                            title={`Bid ${bid}, Won ${won}, +${earned}`}
                          >
                            <span style={{ fontWeight: 600 }}>
                              {earned > 0 ? `+${earned}` : '0'}
                            </span>
                            <span style={{ fontSize: 10, marginLeft: 3, opacity: 0.6 }}>
                              {hit ? '✓' : '✗'}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}

                  {/* Total row */}
                  <tr style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
                    <td style={{ ...styles.td, fontWeight: 700, fontSize: 12, color: '#fff' }}>
                      Total
                    </td>
                    {players.map((p) => (
                      <td
                        key={p.id}
                        style={{
                          ...styles.td,
                          textAlign: 'center' as const,
                          fontWeight: 800,
                          fontSize: 13,
                          color: '#f1c40f',
                        }}
                      >
                        {data.cumulativeScores[p.id] ?? 0}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!data.gameOver && (
          <p style={styles.nextRound}>Next round starting automatically…</p>
        )}

        <motion.button
          style={styles.btn}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={onDismiss}
        >
          {data.gameOver ? 'Back to Lobby' : 'Got it'}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 200, padding: 16, overflowY: 'auto',
  },
  modal: {
    background: 'linear-gradient(135deg, #1b4332, #0d2b1a)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 20, padding: '36px 40px',
    width: '100%', maxWidth: 640,
    display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center',
    boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
  },
  winnerBanner: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 },
  title: { fontSize: 24, fontWeight: 800, color: '#fff' },
  winner: { color: '#f1c40f', fontSize: 16, fontWeight: 600 },
  table: { width: '100%', borderCollapse: 'collapse' as const },
  th: { fontSize: 12, color: 'rgba(255,255,255,0.5)', textAlign: 'left' as const, paddingBottom: 8, fontWeight: 600 },
  td: { fontSize: 14, color: 'rgba(255,255,255,0.8)', padding: '7px 4px', borderBottom: '1px solid rgba(255,255,255,0.07)' },
  historyBox: { width: '100%', background: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: '14px 16px' },
  ratingBox: { width: '100%', background: 'rgba(241,196,15,0.08)', borderRadius: 12, padding: '14px 16px', border: '1px solid rgba(241,196,15,0.2)' },
  ratingRow: { display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.85)', padding: '6px 0' },
  historyTitle: { fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginBottom: 10 },
  historyScroll: { overflowX: 'auto' as const, maxHeight: 260, overflowY: 'auto' as const },
  nextRound: { color: 'rgba(255,255,255,0.45)', fontSize: 12, fontStyle: 'italic' },
  btn: {
    padding: '12px 32px', borderRadius: 12, border: 'none',
    background: 'linear-gradient(135deg, #2d6a4f, #1b4332)',
    color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer',
  },
};
