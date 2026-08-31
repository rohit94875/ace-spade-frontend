import type { RewardSymbolType } from '../types/season';
import { isTierCard, REWARD_LABELS } from '../types/season';
import AwardIcon from './AwardIcon';
import TierRewardCard from './TierRewardCard';

export { isTierCard, isAwardBadge } from '../types/season';

interface Props {
  symbol: RewardSymbolType;
  statValue?: number | null;
  pending?: boolean;
  compact?: boolean;
}

export default function RewardBadge({ symbol, statValue, pending, compact }: Props) {
  if (isTierCard(symbol)) {
    return <TierRewardCard symbol={symbol} statValue={statValue} pending={pending} compact={compact} />;
  }

  return (
    <div style={{ ...styles.item, ...(compact ? styles.itemCompact : {}) }}>
      <div style={{
        ...styles.badge,
        ...styles.awardBadge,
        ...(pending ? styles.pending : {}),
        borderColor: 'rgba(255,255,255,0.15)',
        background: 'rgba(0,0,0,0.25)',
      }}>
        <AwardIcon symbol={symbol} size={compact ? 36 : 44} />
        {statValue != null && (
          <span style={styles.sub}>{formatStat(symbol, statValue)}</span>
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
  awardBadge: { minHeight: 64 },
  pending: { opacity: 0.55, borderStyle: 'dashed' },
  sub: { fontSize: 9, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
  caption: { display: 'block', fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 6 },
};
