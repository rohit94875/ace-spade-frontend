import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createRoom, joinRoom } from '../services/api';
import { useGameStore } from '../store/gameStore';
import type { DisconnectPolicy } from '../types/game';

type Tab = 'create' | 'join';

export default function LobbyPage() {
  const navigate = useNavigate();
  const setSession = useGameStore((s) => s.setSession);

  const [tab, setTab] = useState<Tab>('create');
  const [username, setUsername] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [playWithBot, setPlayWithBot] = useState(false);
  const [disconnectPolicy, setDisconnectPolicy] = useState<DisconnectPolicy>('FORFEIT_WIN');

  async function handleQuick1v1() {
    if (!username.trim()) { setError('Enter a username first'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await createRoom(username.trim(), true, 'FORFEIT_WIN');
      setSession({ ...res, isHost: true, playWithBot: true, autoStartGame: true });
      navigate('/game');
    } catch (e: unknown) {
      const errData = (e as { response?: { data?: { errors?: string[]; message?: string } | string } })?.response?.data;
      if (errData && typeof errData === 'object' && errData.errors?.length) {
        setError(errData.errors[0]);
      } else if (errData && typeof errData === 'string') {
        setError(errData);
      } else {
        setError('Failed to start 1v1 game. Is the server running?');
      }
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
      const errData = (e as { response?: { data?: { errors?: string[]; message?: string } | string } })?.response?.data;
      if (errData && typeof errData === 'object' && errData.errors?.length) {
        setError(errData.errors[0]);
      } else if (errData && typeof errData === 'string') {
        setError(errData);
      } else {
        setError('Failed to create room. Is the server running?');
      }
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

  return (
    <div style={styles.page}>
      <motion.div
        style={styles.card}
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div style={styles.title}>
          <span style={{ fontSize: 48 }}>♠</span>
          <h1 style={styles.gameName}>Ace Spade</h1>
          <p style={styles.subtitle}>Multiplayer Trick-Taking Card Game</p>
        </div>

        <div style={styles.tabs}>
          {(['create', 'join'] as Tab[]).map((t) => (
            <button
              key={t}
              style={{ ...styles.tab, ...(tab === t ? styles.tabActive : {}) }}
              onClick={() => { setTab(t); setError(''); }}
            >
              {t === 'create' ? 'Create Room' : 'Join Room'}
            </button>
          ))}
        </div>

        <div style={styles.form}>
          <input
            style={styles.input}
            placeholder="Your username"
            value={username}
            maxLength={20}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (tab === 'create' ? handleCreate() : handleJoin())}
          />

          <motion.button
            style={styles.quickStartBtn}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleQuick1v1}
            disabled={loading}
          >
            {loading ? '...' : '🤖 Play 1v1 vs BOT Vitality'}
          </motion.button>
          <p style={styles.quickStartHint}>Jump straight into a solo game — pause anytime</p>

          <div style={styles.divider}>
            <span style={styles.dividerLine} />
            <span style={styles.dividerText}>or create / join a room</span>
            <span style={styles.dividerLine} />
          </div>

          {tab === 'join' && (
            <input
              style={{ ...styles.input, textTransform: 'uppercase', letterSpacing: 4 }}
              placeholder="Room code (e.g. AB12CD)"
              value={roomCode}
              maxLength={6}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            />
          )}

          {tab === 'create' && (
            <div style={styles.options}>
              <label style={styles.checkRow}>
                <input
                  type="checkbox"
                  checked={playWithBot}
                  onChange={(e) => setPlayWithBot(e.target.checked)}
                />
                <span>Play vs BOT Vitality (1v1 solo)</span>
              </label>

              <p style={styles.optionLabel}>If a player leaves mid-game:</p>
              <label style={styles.radioRow}>
                <input
                  type="radio"
                  name="disconnectPolicy"
                  checked={disconnectPolicy === 'FORFEIT_WIN'}
                  onChange={() => setDisconnectPolicy('FORFEIT_WIN')}
                />
                <span>Forfeit — remaining player wins</span>
              </label>
              <label style={styles.radioRow}>
                <input
                  type="radio"
                  name="disconnectPolicy"
                  checked={disconnectPolicy === 'BOT_TAKEOVER'}
                  onChange={() => setDisconnectPolicy('BOT_TAKEOVER')}
                />
                <span>Bot takeover — BOT Vitality plays their seat</span>
              </label>
            </div>
          )}

          {error && <p style={styles.error}>{error}</p>}

          <motion.button
            style={styles.primaryBtn}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={tab === 'create' ? handleCreate : handleJoin}
            disabled={loading}
          >
            {loading ? '...' : tab === 'create' ? 'Create Room' : 'Join Room'}
          </motion.button>
        </div>

        <div style={styles.rules}>
          <p style={styles.rulesTitle}>Quick Rules</p>
          <ul style={styles.rulesList}>
            <li>13 rounds — Round N deals N cards per player</li>
            <li>Bid how many tricks you'll win before each round</li>
            <li>Trump hierarchy: ♠ &gt; ♣ &gt; ♥ &gt; ♦</li>
            <li>Hit your bid exactly to score (bid 0 → 10pts, bid N → 10+N×11 pts)</li>
            <li>2–8 players supported</li>
          </ul>
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
    padding: '40px 48px',
    width: '100%',
    maxWidth: 460,
    boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
  },
  title: { textAlign: 'center', marginBottom: 32 },
  gameName: { fontSize: 36, fontWeight: 800, color: '#fff', letterSpacing: 2, margin: '8px 0 4px' },
  subtitle: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  tabs: { display: 'flex', gap: 8, marginBottom: 24 },
  tab: {
    flex: 1, padding: '10px 0', border: 'none', borderRadius: 10, cursor: 'pointer',
    background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)',
    fontWeight: 600, fontSize: 14, transition: 'all 0.2s',
  },
  tabActive: { background: '#2d6a4f', color: '#fff' },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  quickStartBtn: {
    padding: '16px 0', borderRadius: 12, border: '2px solid rgba(241,196,15,0.45)',
    cursor: 'pointer',
    background: 'linear-gradient(135deg, rgba(241,196,15,0.25), rgba(230,126,34,0.2))',
    color: '#f1c40f', fontWeight: 800, fontSize: 16,
    boxShadow: '0 4px 20px rgba(241,196,15,0.15)',
  },
  quickStartHint: {
    margin: '-6px 0 0', textAlign: 'center' as const,
    color: 'rgba(255,255,255,0.45)', fontSize: 12,
  },
  divider: {
    display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0',
  },
  dividerLine: {
    flex: 1, height: 1, background: 'rgba(255,255,255,0.12)',
  },
  dividerText: {
    color: 'rgba(255,255,255,0.35)', fontSize: 11, whiteSpace: 'nowrap' as const,
  },
  options: {
    background: 'rgba(0,0,0,0.2)',
    borderRadius: 10,
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
  },
  optionLabel: { margin: '4px 0 0', fontWeight: 600, fontSize: 12, color: 'rgba(255,255,255,0.65)' },
  checkRow: { display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' },
  radioRow: { display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', paddingLeft: 4 },
  input: {
    padding: '14px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)',
    background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 15,
    outline: 'none', width: '100%',
  },
  error: { color: '#ff7b7b', fontSize: 13, textAlign: 'center' },
  primaryBtn: {
    padding: '14px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
    background: 'linear-gradient(135deg, #2d6a4f, #1b4332)',
    color: '#fff', fontWeight: 700, fontSize: 16,
    boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
  },
  rules: {
    marginTop: 28, padding: '16px 20px',
    background: 'rgba(0,0,0,0.2)', borderRadius: 10,
  },
  rulesTitle: { fontWeight: 700, marginBottom: 8, color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  rulesList: { paddingLeft: 18, color: 'rgba(255,255,255,0.55)', fontSize: 12, lineHeight: 1.8 },
};
