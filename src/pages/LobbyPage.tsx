import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createRoom, joinRoom } from '../services/api';
import { loadNickname, saveNickname } from '../services/nicknameStorage';
import { useGameStore } from '../store/gameStore';
import { useAuthStore } from '../store/authStore';
import type { DisconnectPolicy } from '../types/game';
import {
  CASUAL_MAX_ROUNDS,
  DEFAULT_RANKED_MAX_ROUNDS,
  RANKED_MIN_ROUNDS,
  RANKED_MAX_ROUNDS,
  RANKED_ROUND_OPTIONS,
  type RankedMaxRounds,
} from '../constants/gameLength';

type LobbyMode = 'solo' | 'join' | 'create';

export default function LobbyPage() {
  const navigate = useNavigate();
  const setSession = useGameStore((s) => s.setSession);
  const authUser = useAuthStore((s) => s.user);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  const [mode, setMode] = useState<LobbyMode>('solo');
  const [nickname, setNickname] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [playWithBot, setPlayWithBot] = useState(false);
  // Create rooms default to Ranked for logged-in players (guests fall back to casual).
  const [ranked, setRanked] = useState<boolean>(() => isLoggedIn());
  const [disconnectPolicy, setDisconnectPolicy] = useState<DisconnectPolicy>('FORFEIT_WIN');
  const [rankedMaxRounds, setRankedMaxRounds] = useState<RankedMaxRounds>(DEFAULT_RANKED_MAX_ROUNDS);
  const [showRoomOptions, setShowRoomOptions] = useState(false);
  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    const saved = loadNickname();
    if (saved) {
      setNickname(saved);
    } else if (authUser?.username) {
      setNickname(authUser.username);
    }
  }, [authUser?.username]);

  function validateNickname(value: string): string | null {
    const trimmed = value.trim();
    if (trimmed.length < 2) return 'Nickname must be at least 2 characters';
    if (trimmed.length > 20) return 'Nickname must be at most 20 characters';
    if (trimmed.toLowerCase().startsWith('bot vitality')) return 'That nickname is reserved';
    return null;
  }

  function rememberNickname(value: string) {
    saveNickname(value.trim());
  }

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
    const nickError = validateNickname(nickname);
    if (nickError) { setError(nickError); return; }
    setLoading(true);
    setError('');
    try {
      const trimmed = nickname.trim();
      const res = await createRoom(trimmed, true, 'FORFEIT_WIN', false, CASUAL_MAX_ROUNDS);
      rememberNickname(trimmed);
      setSession({ ...res, isHost: true, playWithBot: true, autoStartGame: true });
      navigate('/game');
    } catch (e: unknown) {
      setError(parseError(e, 'Failed to start solo game. Is the server running?'));
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    const nickError = validateNickname(nickname);
    if (nickError) { setError(nickError); return; }
    if (ranked && !isLoggedIn()) {
      setError('Sign in required for ranked games');
      return;
    }
    if (ranked && playWithBot) {
      setError('Ranked games cannot include bots');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const trimmed = nickname.trim();
      const res = await createRoom(
        trimmed,
        playWithBot,
        disconnectPolicy,
        ranked,
        ranked ? rankedMaxRounds : CASUAL_MAX_ROUNDS,
      );
      rememberNickname(trimmed);
      setSession({ ...res, isHost: true, playWithBot, ranked });
      navigate('/game');
    } catch (e: unknown) {
      setError(parseError(e, 'Failed to create room. Is the server running?'));
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    const nickError = validateNickname(nickname);
    if (nickError) { setError(nickError); return; }
    if (!roomCode.trim()) { setError('Enter a room code'); return; }
    setLoading(true);
    setError('');
    try {
      const trimmed = nickname.trim();
      const res = await joinRoom(roomCode.trim().toUpperCase(), trimmed);
      rememberNickname(trimmed);
      setSession({ ...res, isHost: false });
      navigate('/game');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: string } })?.response?.data;
      setError(typeof msg === 'string' ? msg : parseError(e, 'Failed to join room. Check the code and try again.'));
    } finally {
      setLoading(false);
    }
  }

  function onRankedChange(checked: boolean) {
    setRanked(checked);
    if (checked) setPlayWithBot(false);
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
          <p style={styles.subtitle}>Pick a nickname, then choose how to play</p>
        </div>

        <div style={styles.authBar}>
          {isLoggedIn() && authUser ? (
            <>
              <span style={styles.mmrBadge}>
                {authUser.tier ? authUser.tier : `Placing (${authUser.placementGames ?? 0}/${authUser.placementRequired ?? 3})`}
              </span>
              <Link to="/profile" style={styles.authLink}>Profile</Link>
            </>
          ) : (
            <Link to="/login" style={styles.authLink}>Sign in for ranked</Link>
          )}
          <Link to="/leaderboard" style={styles.authLink}>Leaderboard</Link>
        </div>

        <input
          style={styles.input}
          placeholder="Nickname (shown in match)"
          value={nickname}
          maxLength={20}
          onChange={(e) => setNickname(e.target.value)}
        />
        <p style={styles.nicknameHint}>
          {isLoggedIn()
            ? 'Change this anytime before joining — your account stays linked for ranked.'
            : 'Pick any nickname — you can change it each time you join a room.'}
        </p>

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
            <div style={styles.badgeRow}>
              <span style={styles.casualBadge}>Casual · {CASUAL_MAX_ROUNDS} rounds max</span>
            </div>
            <div style={styles.upsellBox}>
              <strong style={{ color: '#f1c40f' }}>Want a longer game?</strong>
              {' '}Sign in and play <strong style={{ color: '#f1c40f' }}>Ranked</strong> for {RANKED_MIN_ROUNDS}–{RANKED_MAX_ROUNDS} rounds with your rank on the line.
            </div>
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
            <div style={styles.badgeRow}>
              <span style={ranked ? styles.rankedBadge : styles.casualBadge}>
                {ranked
                  ? `Ranked · ${rankedMaxRounds} rounds`
                  : `Casual · ${CASUAL_MAX_ROUNDS} rounds`}
              </span>
              {!ranked && playWithBot && (
                <span style={styles.botBadge}>+ BOT Vitality</span>
              )}
              <span style={styles.policyBadge}>
                If someone leaves: {disconnectPolicy === 'FORFEIT_WIN' ? 'other wins' : 'bot takes over'}
              </span>
            </div>
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
                    checked={ranked}
                    onChange={(e) => onRankedChange(e.target.checked)}
                  />
                  <span>Ranked match (login required · affects your rank · {RANKED_MIN_ROUNDS}–{RANKED_MAX_ROUNDS} rounds)</span>
                </label>
                {ranked ? (
                  <label style={styles.selectRow}>
                    <span>Ranked rounds</span>
                    <select
                      style={styles.select}
                      value={rankedMaxRounds}
                      onChange={(e) => setRankedMaxRounds(Number(e.target.value) as RankedMaxRounds)}
                    >
                      {RANKED_ROUND_OPTIONS.map((n) => (
                        <option key={n} value={n}>
                          {n} rounds{n === RANKED_MAX_ROUNDS ? ' (full)' : n === RANKED_MIN_ROUNDS ? ' (quick)' : ''}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <p style={styles.casualNote}>
                    Casual rooms are always {CASUAL_MAX_ROUNDS} rounds and do not affect your rank.
                    Check Ranked above for longer games.
                  </p>
                )}
                <label style={styles.checkRow}>
                  <input
                    type="checkbox"
                    checked={playWithBot}
                    disabled={ranked}
                    onChange={(e) => setPlayWithBot(e.target.checked)}
                  />
                  <span>Add BOT Vitality to fill an empty seat {ranked ? '(disabled for ranked)' : ''}</span>
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
              Casual: {CASUAL_MAX_ROUNDS} rounds · Ranked: {RANKED_MIN_ROUNDS}–{RANKED_MAX_ROUNDS} rounds · bid tricks before each round · trump order ♠ &gt; ♣ &gt; ♥ &gt; ♦ ·
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
  authBar: {
    display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center',
    justifyContent: 'center', marginBottom: 14, fontSize: 12,
  },
  mmrBadge: { color: '#f1c40f', fontWeight: 600 },
  authLink: { color: '#74c69d', textDecoration: 'none' },
  input: {
    padding: '14px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.2)',
    background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 15,
    outline: 'none', width: '100%', marginBottom: 6,
  },
  nicknameHint: {
    margin: '0 0 14px',
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center' as const,
    lineHeight: 1.4,
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
  badgeRow: { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 2 },
  casualBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
    background: 'rgba(52, 152, 219, 0.2)',
    color: '#85c1e9',
    border: '1px solid rgba(52, 152, 219, 0.35)',
  },
  rankedBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
    background: 'rgba(241, 196, 15, 0.15)',
    color: '#f1c40f',
    border: '1px solid rgba(241, 196, 15, 0.35)',
  },
  botBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
    background: 'rgba(155, 89, 182, 0.18)',
    color: '#d2b4de',
    border: '1px solid rgba(155, 89, 182, 0.35)',
  },
  policyBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
    background: 'rgba(255,255,255,0.08)',
    color: 'rgba(255,255,255,0.7)',
    border: '1px solid rgba(255,255,255,0.15)',
  },
  upsellBox: {
    marginTop: 4,
    padding: '12px 14px',
    borderRadius: 10,
    background: 'rgba(241, 196, 15, 0.08)',
    border: '1px solid rgba(241, 196, 15, 0.2)',
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 1.5,
  },
  casualNote: {
    margin: 0,
    padding: '10px 12px',
    borderRadius: 8,
    background: 'rgba(52, 152, 219, 0.1)',
    border: '1px solid rgba(52, 152, 219, 0.2)',
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 1.45,
  },
  selectRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 4,
  },
  select: {
    flex: 1,
    maxWidth: 180,
    padding: '8px 10px',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'rgba(0,0,0,0.25)',
    color: '#fff',
    fontSize: 13,
    cursor: 'pointer',
  },
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
