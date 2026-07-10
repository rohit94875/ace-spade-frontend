import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, GamePhase, TrickCard } from '../types/game';
import { useDisplayStore } from '../store/displayStore';
import { orderHand } from '../utils/cardDisplay';
import CardComponent from './CardComponent';
import HandSortToggle from './HandSortToggle';
import { sendPlayCard } from '../services/websocket';

interface Props {
  hand: Card[];
  phase: GamePhase | null;
  isMyTurn: boolean;
  roomCode: string;
  currentTrick: TrickCard[];
}

function cardKey(c: Card) {
  return `${c.suit}-${c.rank}-${c.deckIndex}`;
}

/**
 * Returns the set of card keys the player is allowed to play.
 * If the trick has a lead suit and the player holds that suit,
 * only those cards are valid. Otherwise everything is valid.
 */
function validCardKeys(hand: Card[], currentTrick: TrickCard[]): Set<string> {
  if (currentTrick.length === 0) {
    return new Set(hand.map(cardKey));
  }
  const leadSuit = currentTrick[0].card.suit;
  const hasSuit = hand.some((c) => c.suit === leadSuit);
  if (!hasSuit) {
    return new Set(hand.map(cardKey));
  }
  return new Set(hand.filter((c) => c.suit === leadSuit).map(cardKey));
}

export default function PlayerHand({ hand, phase, isMyTurn, roomCode, currentTrick }: Props) {
  const [selected, setSelected] = useState<Card | null>(null);
  const sortHand = useDisplayStore((s) => s.sortHand);
  const visibleHand = orderHand(hand, sortHand);

  const canPlay = phase === 'PLAYING' && isMyTurn;
  const validKeys = canPlay ? validCardKeys(hand, currentTrick) : new Set<string>();

  function handleCardClick(card: Card) {
    if (!canPlay) return;
    if (!validKeys.has(cardKey(card))) return; // silently block invalid cards
    if (selected?.suit === card.suit && selected?.rank === card.rank && selected?.deckIndex === card.deckIndex) {
      sendPlayCard(roomCode, card.suit, card.rank, card.deckIndex);
      setSelected(null);
    } else {
      setSelected(card);
    }
  }

  function confirmPlay() {
    if (!selected) return;
    sendPlayCard(roomCode, selected.suit, selected.rank, selected.deckIndex);
    setSelected(null);
  }

  const showHandControls = phase === 'BIDDING' || phase === 'PLAYING';
  const highlightTurn = isMyTurn && (phase === 'BIDDING' || phase === 'PLAYING');

  return (
    <motion.div
      style={styles.wrapper}
      animate={highlightTurn
        ? {
            boxShadow: [
              '0 0 0 2px rgba(241,196,15,0.55), 0 0 18px 2px rgba(241,196,15,0.35)',
              '0 0 0 3px rgba(241,196,15,0.9), 0 0 30px 6px rgba(241,196,15,0.55)',
              '0 0 0 2px rgba(241,196,15,0.55), 0 0 18px 2px rgba(241,196,15,0.35)',
            ],
          }
        : { boxShadow: '0 0 0 0 rgba(0,0,0,0)' }}
      transition={highlightTurn
        ? { duration: 1.3, repeat: Infinity, ease: 'easeInOut' }
        : { duration: 0.3 }}
    >
      {highlightTurn && (
        <div style={styles.turnPill}>▶ Your turn {phase === 'BIDDING' ? 'to bid' : 'to play'}</div>
      )}
      {showHandControls && (
        <div style={styles.toolbar}>
          <HandSortToggle compact />
        </div>
      )}
      {canPlay && selected && (
        <motion.div
          style={styles.confirmBanner}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span>Play this card?</span>
          <button style={styles.confirmBtn} onClick={confirmPlay}>Yes, Play</button>
          <button style={styles.cancelBtn} onClick={() => setSelected(null)}>Cancel</button>
        </motion.div>
      )}

      {canPlay && !selected && (
        <p style={styles.hint}>Select a card to play</p>
      )}

      {!canPlay && phase === 'PLAYING' && (
        <p style={styles.hint}>Waiting for your turn…</p>
      )}

      <div style={styles.handRow}>
        <AnimatePresence>
          {visibleHand.map((card) => {
            const key = cardKey(card);
            const isSelected = selected?.suit === card.suit
              && selected?.rank === card.rank
              && selected?.deckIndex === card.deckIndex;
            const isDisabled = canPlay && !validKeys.has(key);
            return (
              <motion.div
                key={key}
                layout
                exit={{ opacity: 0, y: 30, scale: 0.7 }}
              >
                <CardComponent
                  card={card}
                  selectable={canPlay}
                  selected={isSelected}
                  disabled={isDisabled}
                  onClick={() => handleCardClick(card)}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  toolbar: {
    alignSelf: 'stretch',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  wrapper: {
    padding: '12px 16px',
    background: 'rgba(0,0,0,0.25)',
    borderRadius: 16,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    position: 'relative',
  },
  turnPill: {
    alignSelf: 'center',
    background: 'linear-gradient(135deg, #f1c40f, #e67e22)',
    color: '#1a1a1a',
    fontWeight: 800,
    fontSize: 13,
    padding: '4px 14px',
    borderRadius: 20,
    boxShadow: '0 2px 10px rgba(241,196,15,0.4)',
  },
  handRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  hint: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontStyle: 'italic' },
  confirmBanner: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: 'rgba(255,255,255,0.1)', padding: '8px 16px',
    borderRadius: 10, fontSize: 14,
  },
  confirmBtn: {
    padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
    background: '#2d6a4f', color: '#fff', fontWeight: 700,
  },
  cancelBtn: {
    padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
    background: 'rgba(255,255,255,0.1)', color: '#fff',
  },
};
