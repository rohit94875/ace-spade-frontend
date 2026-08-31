import type { RewardSymbolType } from '../types/season';
import { REWARD_LABELS } from '../types/season';

const TIER_CARDS: RewardSymbolType[] = [
  'SAND_CARD', 'BRONZE_CARD', 'SILVER_CARD', 'GOLD_CARD',
  'PLATINUM_CARD', 'DIAMOND_CARD', 'ACE_CARD',
];

const AWARD_BADGES: RewardSymbolType[] = [
  'TOP_MMR', 'MOST_MATCHES', 'MOST_WINS', 'MOST_LOSSES',
  'WIN_STREAK', 'LOSS_STREAK', 'BID_MASTER', 'FINISHER',
];

export function isTierCard(symbol: RewardSymbolType): boolean {
  return TIER_CARDS.includes(symbol);
}

export function isAwardBadge(symbol: RewardSymbolType): boolean {
  return AWARD_BADGES.includes(symbol);
}

const TIER_COLORS: Partial<Record<RewardSymbolType, string>> = {
  SAND_CARD: '#c4a574',
  BRONZE_CARD: '#cd7f32',
  SILVER_CARD: '#bdc3c7',
  GOLD_CARD: '#f1c40f',
  PLATINUM_CARD: '#a8d8ea',
  DIAMOND_CARD: '#85c1e9',
  ACE_CARD: '#e74c3c',
};

const AWARD_EMOJI: Partial<Record<RewardSymbolType, string>> = {
  TOP_MMR: '👑',
  MOST_MATCHES: '🎯',
  MOST_WINS: '🏆',
  MOST_LOSSES: '💀',
  WIN_STREAK: '🔥',
  LOSS_STREAK: '❄️',
  BID_MASTER: '🎲',
  FINISHER: '✅',
};

interface Props {
  symbol: RewardSymbolType;
  statValue?: number | null;
  pending?: boolean;
  compact?: boolean;
}

export default function RewardBadge({ symbol, statValue, pending, compact }: Props) {
  const tier = isTierCard(symbol);
  const color = TIER_COLORS[symbol] ?? '#74c69d';

  return (
    <div style={{ ...styles.item, ...(compact ? styles.itemCompact : {}) }}>
      <div style={{
        ...styles.badge,
        ...(tier ? styles.tierCard : styles.awardBadge),
        ...(pending ? styles.pending : {}),
        borderColor: tier ? color : 'rgba(255,255,255,0.15)',
        background: tier ? `linear-gradient(145deg, ${color}33, rgba(0,0,0,0.35))` : 'rgba(0,0,0,0.25)',
      }}>
        {pending ? (
          <>
            <span style={styles.suit}>?</span>
            <span style={styles.rank}>Pending</span>
          </>
        ) : tier ? (
          <>
            <span style={{ ...styles.suit, color }}>♠</span>
            <span style={{ ...styles.rank, color: '#fff' }}>{REWARD_LABELS[symbol].replace(' Card', '')}</span>
            {statValue != null && (
              <span style={styles.sub}>{Math.round(statValue)} final MMR</span>
            )}
          </>
        ) : (
          <>
            <span style={styles.awardIcon}>{AWARD_EMOJI[symbol] ?? '★'}</span>
            <span style={styles.awardLabel}>{REWARD_LABELS[symbol]}</span>
            {statValue != null && (
              <span style={styles.sub}>{formatStat(symbol, statValue)}</span>
            )}
          </>
        )}
      </div>
      <span style={styles.caption}>
        {pending ? 'Tier card' : REWARD_LABELS[symbol]}
      </span>
    </div>
  );
}

function formatStat(symbol: RewardSymbolType, value: number): string {
  if (symbol === 'TOP_MMR') return `${value.toFixed(0)} MMR`;
  return String(Math.round(value));
}

const styles: Record<string, React.CSSProperties> = {
  item: { textAlign: 'center', minWidth: 88 },
  itemCompact: { minWidth: 72 },
  badge: {
    borderRadius: 10,
    border: '2px solid',
    padding: '10px 8px',
    minHeight: 72,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tierCard: { aspectRatio: '2.5 / 3.5' },
  awardBadge: { minHeight: 64 },
  pending: { opacity: 0.55, borderStyle: 'dashed' },
  suit: { fontSize: 22, lineHeight: 1 },
  rank: { fontSize: 11, fontWeight: 800, textAlign: 'center' },
  sub: { fontSize: 9, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
  awardIcon: { fontSize: 24, lineHeight: 1 },
  awardLabel: { fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.85)' },
  caption: { display: 'block', fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 6 },
};
