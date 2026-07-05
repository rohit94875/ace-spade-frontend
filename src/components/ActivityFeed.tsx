import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  onDismissTurn?: () => void;
  turnAlert: string | null;
}

export default function ActivityFeed({ turnAlert, onDismissTurn }: Props) {
  return (
    <AnimatePresence>
      {turnAlert && (
        <motion.div
          key="turn-alert"
          style={styles.wrapper}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
        >
          <span style={styles.turnText}>▶ {turnAlert}</span>
          {onDismissTurn && (
            <button style={styles.dismissBtn} type="button" onClick={onDismissTurn}>
              ✕
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    position: 'fixed',
    bottom: 16,
    left: 16,
    right: 16,
    maxWidth: 520,
    zIndex: 200,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 18px',
    borderRadius: 14,
    background: 'linear-gradient(135deg, #f1c40f, #e67e22)',
    color: '#1a1a1a',
    fontWeight: 800,
    fontSize: 16,
    boxShadow: '0 8px 32px rgba(241,196,15,0.45)',
    border: '2px solid rgba(255,255,255,0.3)',
  },
  turnText: { flex: 1 },
  dismissBtn: {
    background: 'rgba(0,0,0,0.15)',
    border: 'none',
    borderRadius: 8,
    color: '#1a1a1a',
    cursor: 'pointer',
    padding: '4px 10px',
    fontWeight: 700,
  },
};
