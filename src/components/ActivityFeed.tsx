import { motion, AnimatePresence } from 'framer-motion';
import type { ActivityItem } from '../types/game';

interface Props {
  items: ActivityItem[];
  onDismissTurn?: () => void;
  turnAlert: string | null;
}

export default function ActivityFeed({ items, turnAlert, onDismissTurn }: Props) {
  return (
    <div style={styles.wrapper}>
      <AnimatePresence>
        {turnAlert && (
          <motion.div
            key="turn-alert"
            style={styles.turnBanner}
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

      <div style={styles.feed}>
        <div style={styles.feedHeader}>Live updates</div>
        <div style={styles.scroll}>
          {items.length === 0 ? (
            <p style={styles.empty}>Game events appear here</p>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                style={{
                  ...styles.item,
                  ...(item.highlight ? styles.itemHighlight : {}),
                }}
              >
                {item.text}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
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
    flexDirection: 'column',
    gap: 8,
    pointerEvents: 'none',
  },
  turnBanner: {
    pointerEvents: 'auto',
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
  feed: {
    pointerEvents: 'auto',
    background: 'rgba(0,0,0,0.75)',
    backdropFilter: 'blur(8px)',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.12)',
    maxHeight: 140,
    overflow: 'hidden',
  },
  feedHeader: {
    padding: '6px 12px',
    fontSize: 10,
    fontWeight: 700,
    color: 'rgba(255,255,255,0.45)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  scroll: {
    overflowY: 'auto',
    maxHeight: 110,
    padding: '6px 0',
  },
  empty: {
    padding: '8px 12px',
    margin: 0,
    fontSize: 12,
    color: 'rgba(255,255,255,0.35)',
  },
  item: {
    padding: '5px 12px',
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    borderLeft: '3px solid transparent',
  },
  itemHighlight: {
    color: '#f1c40f',
    fontWeight: 600,
    borderLeftColor: '#f1c40f',
    background: 'rgba(241,196,15,0.08)',
  },
};
