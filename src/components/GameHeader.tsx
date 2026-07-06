import type { GamePhase, PlayerDto } from '../types/game';
import { useMediaQuery } from '../hooks/useMediaQuery';
import IncognitoToggle from './IncognitoToggle';
import GameMenu from './GameMenu';

interface Props {
  roomCode: string;
  round: number;
  username: string;
  isHost: boolean;
  wsConnected: boolean;
  phase: GamePhase | null;
  paused: boolean;
  isSoloBotGame: boolean;
  canPause: boolean;
  isMyTurn: boolean;
  currentTurnPlayerId: string | null;
  players: PlayerDto[];
  onLeave: () => void;
  onPause: () => void;
}

function buildStatus(props: Props): { text: string; highlight: boolean } {
  const {
    wsConnected, phase, paused, isSoloBotGame, isMyTurn,
    currentTurnPlayerId, players,
  } = props;

  if (!wsConnected) return { text: 'Connecting…', highlight: false };
  if (paused && isSoloBotGame) return { text: '⏸ Paused', highlight: false };
  if (phase === 'LOBBY') {
    return { text: `Waiting (${players.length}/8)`, highlight: false };
  }
  if (phase === 'BIDDING' && isMyTurn) return { text: '▶ Your turn to bid', highlight: true };
  if (phase === 'PLAYING' && isMyTurn) return { text: '▶ Your turn', highlight: true };

  const name = players.find((p) => p.id === currentTurnPlayerId)?.username ?? '…';
  if (phase === 'BIDDING') return { text: `Waiting for ${name}`, highlight: false };
  if (phase === 'PLAYING') return { text: `Waiting for ${name}`, highlight: false };

  return { text: phase ?? '', highlight: false };
}

export default function GameHeader(props: Props) {
  const isMobile = useMediaQuery('(max-width: 640px)');
  const { roomCode, round, username, isHost, canPause, onLeave, onPause } = props;
  const status = buildStatus(props);

  if (isMobile) {
    return (
      <header style={styles.header}>
        <div style={styles.row}>
          <div style={styles.brand}>
            <span style={styles.icon}>♠</span>
            <div style={styles.brandText}>
              <span style={styles.title}>Ace Spade</span>
              <span style={styles.subtitle}>#{roomCode}{phaseLabel(props.phase, round)}</span>
            </div>
          </div>
          <div style={styles.statusArea}>
            <span style={{
              ...styles.statusPill,
              ...(status.highlight ? styles.statusHighlight : styles.statusMuted),
            }}>
              {status.text}
            </span>
          </div>
          <GameMenu
            username={username}
            isHost={isHost}
            canPause={canPause}
            onPause={onPause}
            onLeave={onLeave}
          />
        </div>
      </header>
    );
  }

  return (
    <header style={styles.headerDesktop}>
      <div style={styles.headerLeft}>
        <span style={{ fontSize: 22 }}>♠</span>
        <span style={styles.gameName}>Ace Spade</span>
        <span style={styles.roomCode}>#{roomCode}</span>
      </div>
      <div style={styles.headerCenter}>
        <span style={status.highlight ? styles.yourTurn : styles.waiting}>
          {status.text}
        </span>
      </div>
      <div style={styles.headerRight}>
        <IncognitoToggle />
        <span style={styles.playerLabel}>
          {username} {isHost ? '👑' : ''}
        </span>
        {canPause && (
          <button style={styles.pauseBtn} type="button" onClick={onPause}>
            ⏸ Pause
          </button>
        )}
        <button style={styles.leaveBtn} type="button" onClick={onLeave}>Leave</button>
      </div>
    </header>
  );
}

function phaseLabel(phase: GamePhase | null, round: number): string {
  if (!phase || phase === 'LOBBY') return '';
  return ` · R${round}`;
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    background: 'rgba(0,0,0,0.35)',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    flexShrink: 0,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
    flexShrink: 0,
  },
  icon: { fontSize: 20, lineHeight: 1 },
  brandText: { display: 'flex', flexDirection: 'column', minWidth: 0 },
  title: { fontWeight: 800, fontSize: 14, lineHeight: 1.1, color: '#fff' },
  subtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  statusArea: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    justifyContent: 'center',
  },
  statusPill: {
    display: 'inline-block',
    maxWidth: '100%',
    padding: '5px 10px',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  statusHighlight: {
    background: 'rgba(241,196,15,0.15)',
    border: '1px solid rgba(241,196,15,0.35)',
    color: '#f1c40f',
  },
  statusMuted: {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: 'rgba(255,255,255,0.55)',
    fontWeight: 600,
  },
  headerDesktop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 20px',
    background: 'rgba(0,0,0,0.35)',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    flexShrink: 0,
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 8 },
  gameName: { fontWeight: 800, fontSize: 18, color: '#fff', letterSpacing: 1 },
  roomCode: { fontSize: 13, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', letterSpacing: 2 },
  headerCenter: { flex: 1, textAlign: 'center' },
  headerRight: { display: 'flex', alignItems: 'center', gap: 10 },
  playerLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  waiting: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontStyle: 'italic' },
  yourTurn: { color: '#f1c40f', fontWeight: 700, fontSize: 14 },
  leaveBtn: {
    padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)',
    background: 'transparent', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 13,
  },
  pauseBtn: {
    padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(241,196,15,0.5)',
    background: 'rgba(241,196,15,0.15)', color: '#f1c40f', cursor: 'pointer', fontSize: 13,
    fontWeight: 600,
  },
};
