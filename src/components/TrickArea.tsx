import { motion, AnimatePresence } from 'framer-motion';
import { TrickCard } from '../types/game';
import CardComponent from './CardComponent';

interface Props {
  trick: TrickCard[];
  lastWinnerId?: string;
}

export default function TrickArea({ trick }: Props) {
  return (
    <div style={styles.wrapper}>
      <p style={styles.label}>
        {trick.length === 0 ? 'Waiting for first card…' : `Cards played: ${trick.length}`}
      </p>
      <div style={styles.trickRow}>
        <AnimatePresence>
          {trick.map((tc) => (
            <motion.div
              key={`${tc.playerId}-${tc.card.suit}-${tc.card.rank}-${tc.playOrder}`}
              initial={{ opacity: 0, scale: 0.5, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.3 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              style={styles.trickItem}
            >
              <CardComponent card={tc.card} />
              <span style={styles.playerLabel}>{tc.username}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    padding: '16px 20px',
    background: 'rgba(0,0,0,0.2)',
    borderRadius: 16,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    minHeight: 140,
  },
  label: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontStyle: 'italic' },
  trickRow: { display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' },
  trickItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
  playerLabel: { fontSize: 11, color: 'rgba(255,255,255,0.6)', maxWidth: 70, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
};
