import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createRoom, joinRoom } from '../services/api';
import { useGameStore } from '../store/gameStore';
import type { DisconnectPolicy } from '../types/game';

type LobbyMode = 'solo' | 'join' | 'create';

export default function LobbyPage() {
  const navigate = useNavigate();
  const setSession = useGameStore((s) => s.setSession);

  const [mode, setMode] = useState<LobbyMode>('solo');
  const [username, setUsername] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [playWithBot, setPlayWithBot] = useState(false);
  const [disconnectPolicy, setDisconnectPolicy] = useState<DisconnectPolicy>('FORFEIT_WIN');
  const [showRoomOptions, setShowRoomOptions] = useState(false);
  const [showRules, setShowRules] = useState(false);

  function parseError(e: unknown, fallback: string): string {
    const errData = (e as { response?: { data?: { errors?: string[]; message?: string } | string } })?.response?.data;
    if (errData && typeof errData === 'object' && errData.errors?.length) {
      return errData.errors[0];
    }
    if (errData && typeof errData === 'string') {
      return errData;
    }
    return fallback;
  }

  async function handleSolo() {
    if (!username.trim()) { setError('Enter a username first'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await createRoom(username.trim(), true, 'FORFEIT_WIN');
      setSession({ ...res, isHost: true, playWithBot: true, autoStartGame: true });
      navigate('/game');
    } catch (e: unknown) {
      setError(parseError(e, 'Failed to start solo game. Is the server running?'));
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!username.trim()) { setError('Enter a username'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await createRoom(username.trim(), playWithBot, disconnectPolicy);
      setSession({ ...res, isHost: true });
      navigate('/game');
    } catch (e: unknown) {
      setError(parseError(e, 'Failed to create room. Is the server running?'));
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    if (!username.trim()) { setError('Enter a username'); return; }
    if (!roomCode.trim()) { setError('Enter a room code'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await joinRoom(roomCode.trim().toUpperCase(), username.trim());
      setSession({ ...res, isHost: false });
      navigate('/game');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: string } })?.response?.data;
      setError(msg ?? 'Failed to join room. Check the code and try again.');
    } finally {
      setLoading(false);
    }
  }

  function switchMode(next: LobbyMode) {
    setMode(next);
    setError('');
    setShowRoomOptions(false);
  }

  return (
    <div style={styles.page}>
      <motion.div
        style={styles.card}
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div style={styles.title}>
          <span style={{ fontSize: 44 }}>♠</span>
          <h1 style={styles.gameName}>Ace Spade</h1>
          <p style={styles.subtitle}>Pick a name, then choose how to play</p>
        </div>

        <input
          style={styles.input}
          placeholder="Your username"
          value={username}
          maxLength={20}
          onChange={(e) => setUsername(e.target.value)}
        />

        <div style={styles.modeSwitch}>
          {(['solo', 'join', 'create'] as LobbyMode[]).map((m) => (
            <button
              key={m}
              type="button"
              style={{
                ...styles.modeBtn,
                ...(mode === m ? (m === 'solo' ? styles.modeBtnSoloActive : styles.modeBtnActive) : {}),
              }}
              onClick={() => switchMode(m)}
            >
              {m === 'solo' ? 'Solo' : m === 'join' ? 'Join' : 'Create'}
            </button>
          ))}
        </div>

        {mode === 'solo' && (
          <div style={styles.panel}>
            <p style={styles.panelTitle}>Play vs Bot</p>
            <p style={styles.panelDesc}>Instant 1v1 against BOT Vitality. Pause anytime.</p>
            <motion.button
              style={styles.heroBtn}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSolo}
              disabled={loading}
            >
              {loading ? '…' : 'Start solo game'}
            </motion.button>
            <p style={styles.heroSub}>No room code needed</p>
          </div>
        )}

        {mode === 'join' && (
          <div style={styles.panel}>
            <p style={styles.panelTitle}>Join a room</p>
            <p style={styles.panelDesc}>Enter the 6-character code shared by the host.</p>
            <input
              style={{ ...styles.input, ...styles.codeInput }}
              placeholder="AB12CD"
              value={roomCode}
              maxLength={6}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            />
            <motion.button
              style={styles.joinBtn}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleJoin}
              disabled={loading}
            >
              {loading ? '…' : 'Join room'}
            </motion.button>
          </div>
        )}

        {mode === 'create' && (
          <div style={styles.panel}>
            <p style={styles.panelTitle}>Create a room</p>
            <p style={styles.panelDesc}>You&apos;ll get a code to share with friends (2–8 players).</p>
            <motion.button
              style={styles.primaryBtn}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCreate}
              disabled={loading}
            >
              {loading ? '…' : 'Create room'}
            </motion.button>

            <button
              type="button"
              style={styles.optionsToggle}
              onClick={() => setShowRoomOptions((v) => !v)}
            >
              {showRoomOptions ? '▾' : '▸'} Room options
            </button>

            {showRoomOptions && (
              <div style={styles.optionsBox}>
                <label style={styles.checkRow}>
                  <input
                    type="checkbox"
                    checked={playWithBot}
                    onChange={(e) => setPlayWithBot(e.target.checked)}
                  />
                  <span>Add BOT Vitality to fill an empty seat</span>
                </label>
                <p style={styles.optionLabel}>If someone leaves:</p>
                <label style={styles.radioRow}>
                  <input
                    type="radio"
                    name="disconnectPolicy"
                    checked={disconnectPolicy === 'FORFEIT_WIN'}
                    onChange={() => setDisconnectPolicy('FORFEIT_WIN')}
                  />
                  <span>Other player wins</span>
                </label>
                <label style={styles.radioRow}>
                  <input
                    type="radio"
                    name="disconnectPolicy"
                    checked={disconnectPolicy === 'BOT_TAKEOVER'}
                    onChange={() => setDisconnectPolicy('BOT_TAKEOVER')}
                  />
                  <span>Bot takes over their seat</span>
                </label>
              </div>
            )}
          </div>
        )}

        {error && <p style={styles.error}>{error}</p>}

        <div style={styles.rulesWrap}>
          <button type="button" style={styles.rulesToggle} onClick={() => setShowRules((v) => !v)}>
            How to play
          </button>
          {showRules && (
            <p style={styles.rulesText}>
              13 rounds · bid tricks before each round · trump order ♠ &gt; ♣ &gt; ♥ &gt; ♦ ·
              2–8 players. Hit your bid exactly for max score (bid 0 → 10pts, bid N → 10+N×11 pts).
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1a4a2e 0%, #0d2b1a 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    background: 'rgba(255,255,255,0.07)',
    backdropFilter: 'blur(10px)',
    borderRadius: 20,
    border: '1px solid rgba(255,255,255,0.15)',
    padding: '32px 24px',
    width: '100%',
    maxWidth: 420,
    boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
  },
  title: { textAlign: 'center', marginBottom: 20 },
  gameName: { fontSize: 30, fontWeight: 800, color: '#fff', letterSpacing: 1, margin: '8px 0 4px' },
  subtitle: { color: 'rgba(255,255,255,0.55)', fontSize: 13, margin: 0 },
  input: {
    padding: '14px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.2)',
    background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 15,
    outline: 'none', width: '100%', marginBottom: 14,
  },
  codeInput: {
    textTransform: 'uppercase',
    letterSpacing: 4,
    textAlign: 'center',
    fontFamily: 'monospace',
    fontWeight: 700,
  },
  modeSwitch: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 6,
    marginBottom: 16,
    padding: 4,
    background: 'rgba(0,0,0,0.25)',
    borderRadius: 12,
  },
  modeBtn: {
    padding: '10px 6px',
    border: 'none',
    borderRadius: 9,
    background: 'transparent',
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
  },
  modeBtnActive: {
    background: '#2d6a4f',
    color: '#fff',
    boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
  },
  modeBtnSoloActive: {
    background: 'linear-gradient(135deg, #c9a227, #a67c00)',
    color: '#1a1a1a',
    boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
  },
  panel: { display: 'flex', flexDirection: 'column', gap: 10 },
  panelTitle: { margin: 0, fontSize: 15, fontWeight: 800, color: '#fff' },
  panelDesc: { margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 },
  heroBtn: {
    marginTop: 4,
    padding: '16px 0', borderRadius: 14, border: 'none', cursor: 'pointer',
    background: 'linear-gradient(135deg, #f1c40f, #e67e22)',
    color: '#1a1a1a', fontWeight: 800, fontSize: 16,
    boxShadow: '0 4px 20px rgba(241,196,15,0.25)',
  },
  heroSub: {
    margin: '-4px 0 0', textAlign: 'center', fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
  },
  joinBtn: {
    padding: '14px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
    background: 'linear-gradient(135deg, #2980b9, #1a5276)',
    color: '#fff', fontWeight: 700, fontSize: 15,
    boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
  },
  primaryBtn: {
    padding: '14px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
    background: 'linear-gradient(135deg, #2d6a4f, #1b4332)',
    color: '#fff', fontWeight: 700, fontSize: 15,
    boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
  },
  optionsToggle: {
    marginTop: 4,
    padding: '10px 0',
    border: 'none',
    background: 'transparent',
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    textAlign: 'center',
  },
  optionsBox: {
    background: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
  },
  optionLabel: { margin: '4px 0 0', fontWeight: 600, fontSize: 12, color: 'rgba(255,255,255,0.55)' },
  checkRow: { display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' },
  radioRow: { display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', paddingLeft: 4 },
  error: { color: '#ff7b7b', fontSize: 13, textAlign: 'center', marginTop: 12 },
  rulesWrap: { marginTop: 20, textAlign: 'center' },
  rulesToggle: {
    border: 'none',
    background: 'none',
    color: 'rgba(255,255,255,0.35)',
    fontSize: 12,
    cursor: 'pointer',
    textDecoration: 'underline',
    textUnderlineOffset: 3,
  },
  rulesText: {
    margin: '12px 0 0',
    padding: 14,
    background: 'rgba(0,0,0,0.2)',
    borderRadius: 10,
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 1.6,
    textAlign: 'left',
  },
};
