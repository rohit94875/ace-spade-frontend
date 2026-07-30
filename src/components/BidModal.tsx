import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, PlayerDto } from '../types/game';
import { sendBid } from '../services/websocket';
import { useDisplayStore } from '../store/displayStore';
import { orderHand } from '../utils/cardDisplay';
import CardComponent from './CardComponent';
import HandSortToggle from './HandSortToggle';

interface Props {
  round: number;
  roomCode: string;
  hand: Card[];
  players: PlayerDto[];
  myPlayerId: string;
  faceColor?: string | null;
  onBid?: () => void;
}

export default function BidModal({ round, roomCode, hand, players, myPlayerId, faceColor, onBid }: Props) {
  const [bid, setBid] = useState(0);
  const sortHand = useDisplayStore((s) => s.sortHand);
  const incognitoMode = useDisplayStore((s) => s.incognitoMode);
  const otherBids = players.filter((p) => p.id !== myPlayerId && p.bid !== null);
  const visibleHand = orderHand(hand, sortHand);

  function handleBid() {
    sendBid(roomCode, bid);
    onBid?.();
  }

  return (
    <motion.div
      style={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        style={{
          ...styles.modal,
          ...(incognitoMode ? styles.modalIncognito : {}),
        }}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <h2 style={styles.title}>Place Your Bid</h2>
        <p style={styles.sub}>Round {round} — How many tricks will you win? (0–{round})</p>

        <div style={styles.bidsSection}>
          <p style={styles.bidsLabel}>Bids so far</p>
          {otherBids.length === 0 ? (
            <p style={styles.bidsEmpty}>No one has bid yet — you&apos;re first.</p>
          ) : (
            <div style={styles.bidsList}>
              {otherBids.map((p) => (
                <div key={p.id} style={styles.bidRow}>
                  <span style={styles.bidName}>
                    {p.host && '👑 '}
                    {p.bot && '🤖 '}
                    {p.username}
                  </span>
                  <span style={styles.bidAmount}>
                    {p.bid} trick{p.bid !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Show player's hand so they can decide their bid */}
        {hand.length > 0 && (
          <div style={styles.handSection}>
            <div style={styles.handHeader}>
              <p style={styles.handLabel}>Your cards this round:</p>
              <HandSortToggle compact />
            </div>
            <div style={styles.handScroll}>
              <div style={styles.handRow}>
                {visibleHand.map((card) => (
                  <CardComponent
                    key={`${card.suit}-${card.rank}-${card.deckIndex}`}
                    card={card}
                    faceColor={faceColor}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div style={styles.bidGrid}>
          {Array.from({ length: round + 1 }, (_, i) => i).map((n) => (
            <motion.button
              key={n}
              style={{
                ...styles.bidBtn,
                background: bid === n ? '#2d6a4f' : 'rgba(255,255,255,0.1)',
                border: bid === n ? '2px solid #74c69d' : '2px solid transparent',
                color: bid === n ? '#fff' : 'rgba(255,255,255,0.7)',
              }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setBid(n)}
            >
              <span style={styles.bidNumber}>{n}</span>
              <span style={styles.scoreHint}>
                {n === 0 ? '+10' : `+${10 + n * 11}`}
              </span>
            </motion.button>
          ))}
        </div>

        <motion.button
          style={styles.confirmBtn}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleBid}
        >
          Confirm Bid: {bid} trick{bid !== 1 ? 's' : ''}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 100, padding: 16, overflowY: 'auto',
  },
  modal: {
    background: 'linear-gradient(135deg, #1b4332, #0d2b1a)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 20, padding: '32px 36px',
    width: '100%', maxWidth: 680,
    display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center',
    boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
  },
  bidsSection: {
    width: '100%',
    background: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
    padding: '12px 16px',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  bidsLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    fontWeight: 700,
    margin: '0 0 8px',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  bidsEmpty: {
    margin: 0,
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    fontStyle: 'italic',
  },
  bidsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  bidRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: '6px 10px',
    borderRadius: 8,
    background: 'rgba(255,255,255,0.06)',
  },
  bidName: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontWeight: 600,
  },
  bidAmount: {
    color: '#74c69d',
    fontSize: 14,
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },
  modalIncognito: {
    background: 'linear-gradient(135deg, #18181b, #0a0a0c)',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  handHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  handSection: {
    width: '100%', background: 'rgba(0,0,0,0.25)',
    borderRadius: 12, padding: '14px 16px',
  },
  handLabel: {
    color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: 600,
    margin: 0, textAlign: 'left' as const,
  },
  handScroll: {
    overflowX: 'auto' as const,
    paddingBottom: 6,
  },
  handRow: {
    display: 'flex',
    flexWrap: 'nowrap' as const,
    gap: 8,
    justifyContent: 'center',
    minWidth: 'max-content',
  },
  title: { fontSize: 24, fontWeight: 800, color: '#fff' },
  sub: { color: 'rgba(255,255,255,0.6)', fontSize: 13, textAlign: 'center' },
  bidGrid: {
    display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center',
    maxWidth: 380,
  },
  bidBtn: {
    width: 60, height: 60, borderRadius: 12, cursor: 'pointer',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', gap: 2, transition: 'all 0.15s',
  },
  bidNumber: { fontSize: 20, fontWeight: 800 },
  scoreHint: { fontSize: 9, opacity: 0.7 },
  confirmBtn: {
    marginTop: 8, padding: '14px 32px', borderRadius: 12, border: 'none',
    background: 'linear-gradient(135deg, #2d6a4f, #1b4332)',
    color: '#fff', fontWeight: 700, fontSize: 16, cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
  },
};
