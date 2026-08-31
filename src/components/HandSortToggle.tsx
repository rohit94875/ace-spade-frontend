import { useDisplayStore } from '../store/displayStore';

interface Props {
  compact?: boolean;
}

export default function HandSortToggle({ compact }: Props) {
  const sortHand = useDisplayStore((s) => s.sortHand);
  const toggleSortHand = useDisplayStore((s) => s.toggleSortHand);

  return (
    <button
      type="button"
      style={{
        ...styles.btn,
        ...(compact ? styles.compact : {}),
        ...(sortHand ? styles.active : {}),
      }}
      onClick={toggleSortHand}
      title={sortHand ? 'Hand sorted by suit, rank ascending' : 'Sort hand by suit and rank'}
    >
      {sortHand ? '⇅ Sorted' : '⇅ Sort'}
    </button>
  );
}

const styles: Record<string, React.CSSProperties> = {
  btn: {
    padding: '5px 12px',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.2)',
    background: 'rgba(255,255,255,0.08)',
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  compact: {
    padding: '4px 10px',
    fontSize: 11,
  },
  active: {
    borderColor: 'rgba(116, 198, 157, 0.6)',
    background: 'rgba(116, 198, 157, 0.15)',
    color: '#74c69d',
  },
};
