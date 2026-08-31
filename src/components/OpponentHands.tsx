import { motion } from 'framer-motion';
import { PlayerDto } from '../types/game';
import { shouldHideRuthlessBids } from '../utils/scoring';
import CardComponent from './CardComponent';
import { tierCardFaceColor } from '../constants/tiers';
import TierBadge from './TierBadge';

interface Props {
  players: PlayerDto[];
  myPlayerId: string;
  currentTurnPlayerId: string | null;
  scores: Record<string, number>;
  ruthlessHidden?: boolean;
  phase?: string | null;
}

const PLACEHOLDER_CARD = { suit: 'SPADES' as const, rank: 'ACE' as const, deckIndex: 0, playOrder: 0 };

export default function OpponentHands({
  players, myPlayerId, currentTurnPlayerId, scores, ruthlessHidden, phase,
}: Props) {
  const opponents = players.filter((p) => p.id !== myPlayerId);
  const hideBids = ruthlessHidden && shouldHideRuthlessBids(phase);

  return (
    <div style={styles.grid}>
      {opponents.map((player) => {
        const isTheirTurn = player.id === currentTurnPlayerId;
        const score = scores[player.id] ?? 0;
        return (
          <motion.div
            key={player.id}
            style={{
              ...styles.opponentCard,
              border: isTheirTurn ? '2px solid #f1c40f' : '2px solid transparent',
              boxShadow: isTheirTurn ? '0 0 12px #f1c40f55' : 'none',
            }}
            animate={isTheirTurn ? { scale: [1, 1.02, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <div style={styles.header}>
              <span style={styles.name}>
                {player.host ? '👑 ' : ''}{player.bot ? '🤖 ' : ''}
                {!player.bot && <TierBadge tier={player.tier} size="sm" />}
                {' '}{player.username}
              </span>
              {isTheirTurn && <span style={styles.turnBadge}>▶ Turn</span>}
            </div>

            <div style={styles.stats}>
              <span title="Score">🏆 {score}</span>
              <span title="Bid">
                🎯 {hideBids
                  ? (player.bidPlaced ? '✓' : '?')
                  : (player.bid ?? '–')}
              </span>
              {player.teamId != null && (
                <span title="Team" style={{ color: player.teamId === 1 ? '#3498db' : '#e74c3c' }}>
                  {player.teamId === 1 ? '🔵' : '🔴'}
                </span>
              )}
              <span title="Tricks won">✅ {player.tricksWon}</span>
            </div>

            <div style={styles.faceDownRow}>
              {Array.from({ length: Math.min(player.cardCount, 6) }).map((_, i) => (
                <div key={i} style={{ marginLeft: i > 0 ? -30 : 0, zIndex: i }}>
                  <CardComponent
                    card={PLACEHOLDER_CARD}
                    faceDown
                    small
                    faceColor={tierCardFaceColor(player.tier)}
                  />
                </div>
              ))}
              {player.cardCount > 6 && (
                <span style={styles.moreCards}>+{player.cardCount - 6}</span>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  grid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  opponentCard: {
    background: 'rgba(255,255,255,0.07)',
    borderRadius: 12,
    padding: '12px 16px',
    minWidth: 160,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    transition: 'border-color 0.3s',
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontWeight: 700, fontSize: 14, color: '#fff', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4 },
  turnBadge: { fontSize: 10, background: '#f1c40f', color: '#000', padding: '2px 6px', borderRadius: 6, fontWeight: 700 },
  stats: { display: 'flex', gap: 10, fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  faceDownRow: { display: 'flex', alignItems: 'center' },
  moreCards: { marginLeft: 8, fontSize: 12, color: 'rgba(255,255,255,0.5)' },
};
