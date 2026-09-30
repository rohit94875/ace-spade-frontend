import type { GameMode } from '../constants/gameModes';
import { GAME_MODES } from '../constants/gameModes';

interface Props {
  value: GameMode;
  onChange: (mode: GameMode) => void;
  disabled?: boolean;
}

export default function GameModePicker({ value, onChange, disabled }: Props) {
  return (
    <div style={styles.wrap}>
      <p style={styles.label}>Game mode</p>
      <div style={styles.grid}>
        {GAME_MODES.map((mode) => {
          const selected = value === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              disabled={disabled}
              style={{
                ...styles.card,
                ...(selected ? styles.cardSelected : {}),
                ...(disabled ? styles.cardDisabled : {}),
              }}
              onClick={() => onChange(mode.id)}
            >
              <div style={styles.icon}>{mode.icon}</div>
              <div style={styles.name}>{mode.name}</div>
              <div style={styles.desc}>{mode.description}</div>
              <span style={{
                ...styles.tag,
                ...(mode.rankedAllowed ? styles.tagRanked : {}),
              }}>
                {mode.rankedAllowed ? 'Ranked available' : 'Unranked only'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: { marginBottom: 14 },
  label: {
    margin: '0 0 8px',
    fontSize: 12,
    fontWeight: 700,
    color: 'rgba(255,255,255,0.55)',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: 10,
  },
  card: {
    position: 'relative',
    textAlign: 'left',
    padding: 14,
    borderRadius: 14,
    border: '2px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.04)',
    cursor: 'pointer',
    color: 'inherit',
  },
  cardSelected: {
    borderColor: '#74c69d',
    background: 'rgba(116, 198, 157, 0.1)',
  },
  cardDisabled: { opacity: 0.6, cursor: 'not-allowed' },
  icon: { fontSize: 28, marginBottom: 6 },
  name: { fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 },
  desc: { fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.4, marginBottom: 8 },
  tag: {
    display: 'inline-block',
    fontSize: 10,
    fontWeight: 600,
    padding: '2px 6px',
    borderRadius: 4,
    background: 'rgba(255,255,255,0.08)',
    color: 'rgba(255,255,255,0.45)',
  },
  tagRanked: {
    background: 'rgba(241,196,15,0.15)',
    color: '#f1c40f',
  },
};
