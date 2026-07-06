import { useEffect, useRef, useState } from 'react';
import { useDisplayStore } from '../store/displayStore';

interface Props {
  username: string;
  isHost: boolean;
  canPause: boolean;
  onPause: () => void;
  onLeave: () => void;
}

export default function GameMenu({ username, isHost, canPause, onPause, onLeave }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const incognitoMode = useDisplayStore((s) => s.incognitoMode);
  const sortHand = useDisplayStore((s) => s.sortHand);
  const toggleIncognitoMode = useDisplayStore((s) => s.toggleIncognitoMode);
  const toggleSortHand = useDisplayStore((s) => s.toggleSortHand);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [open]);

  return (
    <div style={styles.wrap} ref={wrapRef}>
      <button
        type="button"
        style={{ ...styles.menuBtn, ...(open ? styles.menuBtnOpen : {}) }}
        aria-label="Game menu"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        ⋮
      </button>
      {open && (
        <div style={styles.dropdown}>
          <div style={styles.dropdownHeader}>
            Signed in as
            <strong>{username}{isHost ? ' 👑' : ''}</strong>
          </div>
          <button
            type="button"
            style={styles.item}
            onClick={() => { toggleIncognitoMode(); setOpen(false); }}
          >
            🕶 Incognito mode
            <span style={styles.hint}>{incognitoMode ? 'On' : 'Off'}</span>
          </button>
          <button
            type="button"
            style={styles.item}
            onClick={() => { toggleSortHand(); setOpen(false); }}
          >
            ⇅ Sort hand
            <span style={styles.hint}>{sortHand ? 'On' : 'Off'}</span>
          </button>
          {canPause && (
            <button
              type="button"
              style={styles.item}
              onClick={() => { onPause(); setOpen(false); }}
            >
              ⏸ Pause game
            </button>
          )}
          <div style={styles.divider} />
          <button
            type="button"
            style={{ ...styles.item, ...styles.danger }}
            onClick={() => { onLeave(); setOpen(false); }}
          >
            Leave room
          </button>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: { position: 'relative', flexShrink: 0 },
  menuBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'rgba(255,255,255,0.08)',
    color: '#fff',
    fontSize: 18,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBtnOpen: {
    background: 'rgba(116, 198, 157, 0.2)',
    borderColor: 'rgba(116, 198, 157, 0.4)',
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    right: 0,
    minWidth: 210,
    background: '#1a2e22',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 12,
    boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
    overflow: 'hidden',
    zIndex: 60,
  },
  dropdownHeader: {
    padding: '10px 14px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    padding: '12px 14px',
    border: 'none',
    background: 'transparent',
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    textAlign: 'left',
    cursor: 'pointer',
  },
  hint: {
    marginLeft: 'auto',
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: 500,
  },
  divider: { height: 1, background: 'rgba(255,255,255,0.08)' },
  danger: { color: '#e74c3c' },
};
