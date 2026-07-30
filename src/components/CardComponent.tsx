import { motion } from 'framer-motion';
import { Card, SUIT_SYMBOLS, RANK_DISPLAY, isRedSuit } from '../types/game';
import { useDisplayStore } from '../store/displayStore';
import { incognitoLabel } from '../utils/cardDisplay';
import {
  tierCardFaceBackground,
  tierCardFaceBorder,
  tierCardInkColor,
} from '../constants/tiers';

interface Props {
  card: Card;
  onClick?: () => void;
  selectable?: boolean;
  selected?: boolean;
  disabled?: boolean;
  faceDown?: boolean;
  small?: boolean;
  /** Tier card face color (hex); omit for classic white. */
  faceColor?: string | null;
}

export default function CardComponent({
  card,
  onClick,
  selectable,
  selected,
  disabled,
  faceDown,
  small,
  faceColor = null,
}: Props) {
  const incognitoMode = useDisplayStore((s) => s.incognitoMode);
  const red = isRedSuit(card.suit);
  const ink = tierCardInkColor(faceColor, red);
  const size = small ? { width: 44, height: 60, fontSize: 13, symbolSize: 20, chipFont: 12 }
                     : { width: 70, height: 95, fontSize: 16, symbolSize: 28, chipFont: 15 };

  const isClickable = selectable && !disabled;
  const tierFace = faceColor && !incognitoMode;

  if (incognitoMode) {
    const chipLabel = faceDown ? '?' : incognitoLabel(card);
    return (
      <motion.div
        onClick={isClickable ? onClick : undefined}
        style={{
          ...styles.chip(size.width, size.height, size.chipFont),
          cursor: isClickable ? 'pointer' : 'default',
          border: selected ? '2px solid #a1a1aa' : '1px solid #3f3f46',
          boxShadow: selected ? '0 0 12px rgba(161,161,170,0.45)' : '0 3px 10px rgba(0,0,0,0.4)',
          transform: selected ? 'translateY(-10px)' : undefined,
          opacity: disabled ? 0.35 : 1,
          color: faceDown ? 'rgba(228,228,231,0.45)' : '#d4d4d8',
        }}
        whileHover={isClickable ? { y: -6 } : {}}
        whileTap={isClickable ? { scale: 0.95 } : {}}
        initial={{ opacity: disabled ? 0.35 : 0, scale: 0.9 }}
        animate={{ opacity: disabled ? 0.35 : 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        {chipLabel}
      </motion.div>
    );
  }

  if (faceDown) {
    const backBg = faceColor
      ? `linear-gradient(135deg, color-mix(in srgb, ${faceColor} 35%, #1a3a6e), #1a3a6e)`
      : '#1a3a6e';
    const backBorder = faceColor
      ? `2px solid color-mix(in srgb, ${faceColor} 50%, #2a5aae)`
      : '2px solid #2a5aae';
    return (
      <div style={{
        ...styles.card(size.width, size.height),
        background: backBg,
        border: backBorder,
      }}>
        <span style={{ fontSize: size.symbolSize, opacity: 0.3 }}>♠</span>
      </div>
    );
  }

  const selectionBorder = selected ? '2px solid #f1c40f' : `2px solid ${tierFace ? tierCardFaceBorder(faceColor!) : 'transparent'}`;

  return (
    <motion.div
      onClick={isClickable ? onClick : undefined}
      style={{
        ...styles.card(size.width, size.height),
        color: ink,
        background: tierFace ? tierCardFaceBackground(faceColor!) : '#fff',
        cursor: isClickable ? 'pointer' : 'default',
        border: selectionBorder,
        boxShadow: selected
          ? '0 0 12px #f1c40f88'
          : tierFace
            ? `0 3px 10px rgba(0,0,0,0.4), 0 0 8px color-mix(in srgb, ${faceColor} 35%, transparent)`
            : '0 3px 10px rgba(0,0,0,0.4)',
        transform: selected ? 'translateY(-10px)' : undefined,
        opacity: disabled ? 0.35 : 1,
        filter: disabled ? 'grayscale(60%)' : undefined,
        position: 'relative',
        overflow: 'hidden',
      }}
      whileHover={isClickable ? { y: -6, boxShadow: '0 8px 20px rgba(0,0,0,0.5)' } : {}}
      whileTap={isClickable ? { scale: 0.95 } : {}}
      initial={{ opacity: disabled ? 0.35 : 0, rotateY: 90 }}
      animate={{ opacity: disabled ? 0.35 : 1, rotateY: 0 }}
      transition={{ duration: 0.3 }}
    >
      {tierFace && (
        <div style={{
          position: 'absolute',
          inset: 4,
          borderRadius: 5,
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)',
          pointerEvents: 'none',
        }} />
      )}
      <div style={{ ...styles.corner('left', size.fontSize), color: ink, zIndex: 1 }}>
        <span>{RANK_DISPLAY[card.rank]}</span>
        <span>{SUIT_SYMBOLS[card.suit]}</span>
      </div>
      <span style={{ fontSize: size.symbolSize, zIndex: 1 }}>{SUIT_SYMBOLS[card.suit]}</span>
      <div style={{ ...styles.corner('right', size.fontSize), color: ink, zIndex: 1 }}>
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
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    userSelect: 'none',
    flexShrink: 0,
  }),
  chip: (w: number, h: number, fontSize: number): React.CSSProperties => ({
    minWidth: w,
    height: h,
    padding: '0 8px',
    background: '#18181b',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'SF Mono', Consolas, Monaco, monospace",
    fontSize,
    fontWeight: 600,
    letterSpacing: 0.5,
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
