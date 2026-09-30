import type { RewardSymbolType } from '../types/season';
import { REWARD_LABELS } from '../types/season';
import { tierForMmr } from '../constants/tiers';

const CARD_STYLES: Record<string, { border: string; bg: string; suit: string; rank: string }> = {
  SAND_CARD: { border: '#d2b48c', bg: 'linear-gradient(145deg, #f5ebe0 0%, #e8d5bc 100%)', suit: '#8b7355', rank: '#5c4a32' },
  BRONZE_CARD: { border: '#cd7f32', bg: 'linear-gradient(145deg, #f5e6d3 0%, #e8c9a8 100%)', suit: '#8b4513', rank: '#5c3a1e' },
  SILVER_CARD: { border: '#a8a8a8', bg: 'linear-gradient(145deg, #f5f5f5 0%, #d8d8d8 100%)', suit: '#606060', rank: '#404040' },
  GOLD_CARD: { border: '#f1c40f', bg: 'linear-gradient(145deg, #fff9e6 0%, #f5e6a3 100%)', suit: '#b8860b', rank: '#7a5c00' },
  PLATINUM_CARD: { border: '#81ecec', bg: 'linear-gradient(145deg, #f0ffff 0%, #c5f7f7 100%)', suit: '#2c7a7b', rank: '#1a4f50' },
  DIAMOND_CARD: { border: '#a29bfe', bg: 'linear-gradient(145deg, #f3f0ff 0%, #ddd6fe 100%)', suit: '#6c5ce7', rank: '#4a3db8' },
  ACE_CARD: { border: '#e74c3c', bg: 'linear-gradient(145deg, #1a1a2e 0%, #16213e 100%)', suit: '#e74c3c', rank: '#f1c40f' },
};

const CARD_SUITS: Record<string, string> = {
  SAND_CARD: '♣', BRONZE_CARD: '♦', SILVER_CARD: '♠', GOLD_CARD: '♥',
  PLATINUM_CARD: '♣', DIAMOND_CARD: '♦', ACE_CARD: '♠',
};

interface Props {
  symbol: RewardSymbolType;
  statValue?: number | null;
  pending?: boolean;
  compact?: boolean;
}

export default function TierRewardCard({ symbol, statValue, pending, compact }: Props) {
  const style = CARD_STYLES[symbol] ?? CARD_STYLES.GOLD_CARD;
  const suit = CARD_SUITS[symbol] ?? '♠';
  const w = compact ? 72 : 88;
  const tierLabel = statValue != null ? tierForMmr(statValue) : null;

  return (
    <div style={{ textAlign: 'center', minWidth: w + 16 }}>
      <div style={{
        width: w,
        margin: '0 auto',
        aspectRatio: '2.5 / 3.5',
        borderRadius: 10,
        border: `2px solid ${pending ? 'rgba(255,255,255,0.2)' : style.border}`,
        background: pending ? 'rgba(0,0,0,0.25)' : style.bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        opacity: pending ? 0.55 : 1,
        borderStyle: pending ? 'dashed' : 'solid',
        boxShadow: pending ? 'none' : `0 4px 12px rgba(0,0,0,0.25)`,
      }}>
        {pending ? (
          <>
            <span style={{ fontSize: 22, color: 'rgba(255,255,255,0.35)' }}>?</span>
            <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.5)' }}>Pending</span>
          </>
        ) : (
          <>
            <span style={{ fontSize: compact ? 18 : 22, color: style.suit, lineHeight: 1 }}>{suit}</span>
            <span style={{ fontSize: compact ? 9 : 10, fontWeight: 800, color: style.rank, textAlign: 'center', padding: '0 4px' }}>
              {REWARD_LABELS[symbol].replace(' Card', '')}
            </span>
            {tierLabel && (
              <span style={{ fontSize: 8, color: symbol === 'ACE_CARD' ? 'rgba(255,255,255,0.5)' : style.suit, opacity: 0.85 }}>
                {tierLabel}
              </span>
            )}
          </>
        )}
      </div>
      <span style={{ display: 'block', fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 6 }}>
        {pending ? 'Tier card' : REWARD_LABELS[symbol]}
      </span>
    </div>
  );
}
