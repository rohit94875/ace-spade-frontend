import { motion } from 'framer-motion';
import { Card, SUIT_SYMBOLS, RANK_DISPLAY, isRedSuit } from '../types/game';

interface Props {
  card: Card;
  onClick?: () => void;
  selectable?: boolean;
  selected?: boolean;
  disabled?: boolean;
  faceDown?: boolean;
  small?: boolean;
}

export default function CardComponent({ card, onClick, selectable, selected, disabled, faceDown, small }: Props) {
  const red = isRedSuit(card.suit);
  const size = small ? { width: 44, height: 60, fontSize: 13, symbolSize: 20 }
                     : { width: 70, height: 95, fontSize: 16, symbolSize: 28 };

  if (faceDown) {
    return (
      <div style={{ ...styles.card(size.width, size.height), background: '#1a3a6e', border: '2px solid #2a5aae' }}>
        <span style={{ fontSize: size.symbolSize, opacity: 0.3 }}>♠</span>
      </div>
    );
  }

  const isClickable = selectable && !disabled;

  return (
    <motion.div
      onClick={isClickable ? onClick : undefined}
      style={{
        ...styles.card(size.width, size.height),
        color: red ? '#c0392b' : '#1a1a2e',
        cursor: isClickable ? 'pointer' : 'default',
        border: selected ? '2px solid #f1c40f' : '2px solid transparent',
        boxShadow: selected ? '0 0 12px #f1c40f88' : '0 3px 10px rgba(0,0,0,0.4)',
        transform: selected ? 'translateY(-10px)' : undefined,
        opacity: disabled ? 0.35 : 1,
        filter: disabled ? 'grayscale(60%)' : undefined,
      }}
      whileHover={isClickable ? { y: -6, boxShadow: '0 8px 20px rgba(0,0,0,0.5)' } : {}}
      whileTap={isClickable ? { scale: 0.95 } : {}}
      initial={{ opacity: disabled ? 0.35 : 0, rotateY: 90 }}
      animate={{ opacity: disabled ? 0.35 : 1, rotateY: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div style={styles.corner('left', size.fontSize)}>
        <span>{RANK_DISPLAY[card.rank]}</span>
        <span>{SUIT_SYMBOLS[card.suit]}</span>
      </div>
      <span style={{ fontSize: size.symbolSize }}>{SUIT_SYMBOLS[card.suit]}</span>
      <div style={styles.corner('right', size.fontSize)}>
        <span>{RANK_DISPLAY[card.rank]}</span>
        <span>{SUIT_SYMBOLS[card.suit]}</span>
      </div>
    </motion.div>
  );
}

const styles = {
  card: (w: number, h: number): React.CSSProperties => ({
    width: w,
    height: h,
    background: '#fff',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    userSelect: 'none',
    flexShrink: 0,
  }),
  corner: (side: 'left' | 'right', fontSize: number): React.CSSProperties => ({
    position: 'absolute',
    top: side === 'left' ? 4 : undefined,
    bottom: side === 'right' ? 4 : undefined,
    left: side === 'left' ? 5 : undefined,
    right: side === 'right' ? 5 : undefined,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    fontSize,
    lineHeight: 1.1,
    fontWeight: 700,
    transform: side === 'right' ? 'rotate(180deg)' : undefined,
  }),
};
