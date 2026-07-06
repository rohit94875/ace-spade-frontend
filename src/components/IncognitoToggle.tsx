import { useDisplayStore } from '../store/displayStore';

export default function IncognitoToggle() {
  const incognitoMode = useDisplayStore((s) => s.incognitoMode);
  const toggleIncognitoMode = useDisplayStore((s) => s.toggleIncognitoMode);

  return (
    <button
      type="button"
      style={{
        ...styles.btn,
        ...(incognitoMode ? styles.active : {}),
      }}
      onClick={toggleIncognitoMode}
      title={incognitoMode ? 'Incognito mode on — tap to show cards' : 'Incognito mode — hide card faces'}
    >
      {incognitoMode ? '🕶 On' : '🕶 Incognito'}
    </button>
  );
}

const styles: Record<string, React.CSSProperties> = {
  btn: {
    padding: '6px 12px',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.2)',
    background: 'rgba(255,255,255,0.08)',
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  active: {
    borderColor: 'rgba(161, 161, 170, 0.5)',
    background: 'rgba(24, 24, 27, 0.8)',
    color: '#d4d4d8',
  },
};
