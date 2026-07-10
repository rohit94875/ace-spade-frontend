import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { connect, disconnect, scheduleDisconnect, sendLeave, sendPause, sendResume, sendStart } from '../services/websocket';
import { getRoom, updateNickname } from '../services/api';
import { saveNickname } from '../services/nicknameStorage';
import { loadSession, saveSession } from '../services/sessionStorage';
import type { RoomStateDto } from '../types/game';
import { normalizeMaxRounds } from '../constants/gameLength';
import PlayerHand from '../components/PlayerHand';
import TrickArea from '../components/TrickArea';
import OpponentHands from '../components/OpponentHands';
import ScorePanel from '../components/ScorePanel';
import BidModal from '../components/BidModal';
import RoundSummary from '../components/RoundSummary';
import PresenceBar from '../components/PresenceBar';
import ChatPanel from '../components/ChatPanel';
import GameHeader from '../components/GameHeader';
import { useDisplayStore } from '../store/displayStore';

export default function GamePage() {
  const navigate = useNavigate();
  const {
    playerId, sessionToken, roomCode, username, isHost,
    phase, round, maxRounds, players, hand, currentTrick, scores,
    currentTurnPlayerId, hostPlayerId,
    roundHistory, lastTrick, roundSummary, errorMessage,
    wsConnected, setWsConnected, playWithBot, paused, pausedAuto, autoStartGame,
    presence, graceSeconds, chatMessages,
    handleGameEvent, setHand, dismissRoundSummary, clearError, reset,
    applySnapshot,
  } = useGameStore();

  const [showBidModal, setShowBidModal] = useState(false);
  const [nicknameDraft, setNicknameDraft] = useState(username ?? '');
  const [nicknameError, setNicknameError] = useState('');
  const [nicknameSaving, setNicknameSaving] = useState(false);
  const incognitoMode = useDisplayStore((s) => s.incognitoMode);

  useEffect(() => {
    setNicknameDraft(username ?? '');
  }, [username]);

  const isMyTurn = currentTurnPlayerId === playerId;

  // Open bid modal when it's my turn during bidding (not while paused)
  useEffect(() => {
    if (phase === 'BIDDING' && isMyTurn && !paused) {
      setShowBidModal(true);
    } else {
      setShowBidModal(false);
    }
  }, [phase, isMyTurn, paused]);

  // Haptic buzz + glow (handled in PlayerHand) when it becomes your turn.
  useEffect(() => {
    if (paused) return;
    const myTurnNow = isMyTurn && (phase === 'BIDDING' || phase === 'PLAYING');
    if (myTurnNow && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate?.([120, 60, 120]);
    }
  }, [phase, isMyTurn, paused]);

  // Load room state (players, bot, lobby phase)
  useEffect(() => {
    if (!roomCode) return;
    getRoom(roomCode)
      .then((room: RoomStateDto) => {
        useGameStore.setState({
          phase: room.phase,
          players: room.players,
          scores: room.scores,
          currentTurnPlayerId: room.currentTurnPlayerId,
          hostPlayerId: room.hostPlayerId,
          round: room.round,
          maxRounds: normalizeMaxRounds(room.maxRounds),
          playWithBot: room.playWithBot ?? false,
          paused: room.paused ?? false,
          presence: room.presence ?? {},
          chatMessages: room.chatMessages ?? [],
        });
      })
      .catch(() => {});
  }, [roomCode]);

  // Mobile-friendly reconnect: when the tab is refocused or the network returns,
  // re-sync room state so the player never has to manually refresh. The STOMP client
  // auto-reconnects and the server re-sends a full snapshot on reconnect; this covers
  // the case where the socket stayed open but events were missed while backgrounded.
  useEffect(() => {
    if (!roomCode) return;
    const resync = () => {
      if (document.visibilityState !== 'visible') return;
      getRoom(roomCode)
        .then((room: RoomStateDto) => {
          useGameStore.setState({
            phase: room.phase,
            players: room.players,
            scores: room.scores,
            currentTurnPlayerId: room.currentTurnPlayerId,
            hostPlayerId: room.hostPlayerId,
            round: room.round,
            maxRounds: normalizeMaxRounds(room.maxRounds),
            playWithBot: room.playWithBot ?? false,
            paused: room.paused ?? false,
            presence: room.presence ?? {},
            chatMessages: room.chatMessages ?? [],
          });
        })
        .catch(() => {});
    };
    window.addEventListener('visibilitychange', resync);
    window.addEventListener('online', resync);
    window.addEventListener('focus', resync);
    return () => {
      window.removeEventListener('visibilitychange', resync);
      window.removeEventListener('online', resync);
      window.removeEventListener('focus', resync);
    };
  }, [roomCode]);

  // Connect to WebSocket on mount
  useEffect(() => {
    if (!roomCode || !sessionToken) return;

    connect(
      roomCode,
      sessionToken,
      handleGameEvent,
      (update) => setHand(update.hand),
      (errEvent) => handleGameEvent(errEvent),
      (snapshot) => applySnapshot(snapshot),
      () => setWsConnected(true),
      () => setWsConnected(false),
    );

    return () => scheduleDisconnect();
  }, [roomCode, sessionToken]);

  // Quick 1v1: auto-start as soon as WebSocket is connected
  useEffect(() => {
    if (!autoStartGame || !wsConnected || !isHost || !roomCode) return;
    if (phase !== 'LOBBY') return;
    if (!playWithBot || players.length < 2) return;

    sendStart(roomCode);
    useGameStore.setState({ autoStartGame: false });
  }, [autoStartGame, wsConnected, isHost, roomCode, phase, playWithBot, players.length]);

  function handleLeave() {
    if (roomCode) sendLeave(roomCode);
    disconnect();
    reset();
    navigate('/');
  }

  function handleGameOver() {
    dismissRoundSummary();
    disconnect();
    reset();
    navigate('/');
  }

  if (!roomCode || !playerId) return null;

  const myPlayer = players.find((p) => p.id === playerId);
  const isSoloBotGame =
    playWithBot &&
    players.length === 2 &&
    players.filter((p) => p.bot).length === 1;
  const canPause =
    isSoloBotGame &&
    !paused &&
    (phase === 'BIDDING' || phase === 'PLAYING');

  async function handleUpdateNickname() {
    const trimmed = nicknameDraft.trim();
    if (trimmed.length < 2) {
      setNicknameError('Nickname must be at least 2 characters');
      return;
    }
    if (!roomCode || !sessionToken || trimmed === username) {
      return;
    }
    setNicknameSaving(true);
    setNicknameError('');
    try {
      const res = await updateNickname(roomCode, sessionToken, trimmed);
      saveNickname(res.nickname);
      useGameStore.setState({ username: res.nickname });
      const stored = loadSession();
      if (stored) {
        saveSession({ ...stored, username: res.nickname });
      }
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: string } })?.response?.data;
      setNicknameError(typeof msg === 'string' ? msg : 'Could not update nickname');
    } finally {
      setNicknameSaving(false);
    }
  }

  return (
    <div style={{
      ...styles.page,
      ...(incognitoMode ? styles.pageIncognito : {}),
    }}>
      <GameHeader
        roomCode={roomCode}
        round={round}
        maxRounds={maxRounds}
        username={username ?? ''}
        isHost={isHost}
        wsConnected={wsConnected}
        phase={phase}
        paused={paused}
        isSoloBotGame={isSoloBotGame}
        canPause={canPause}
        isMyTurn={isMyTurn}
        currentTurnPlayerId={currentTurnPlayerId}
        players={players}
        onLeave={handleLeave}
        onPause={() => sendPause(roomCode)}
      />

      <PresenceBar
        players={players}
        presence={presence}
        myPlayerId={playerId}
        graceSeconds={graceSeconds}
      />

      {/* Main layout */}
      <div style={styles.layout}>
        {/* Left: opponents + trick area */}
        <div style={styles.center}>
          <OpponentHands
            players={players}
            myPlayerId={playerId}
            currentTurnPlayerId={currentTurnPlayerId}
            scores={scores}
          />

          <TrickArea trick={currentTrick} />

          {/* Last trick winner flash */}
          <AnimatePresence>
            {lastTrick && lastTrick.trick.length > 0 && (
              <motion.div
                style={styles.lastTrickBanner}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                <span>🎉 {lastTrick.winnerUsername} won the trick!</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Lobby nickname */}
          {phase === 'LOBBY' && (
            <div style={styles.nicknameBar}>
              <p style={styles.nicknameLabel}>Your nickname (shown to everyone)</p>
              <div style={styles.nicknameRow}>
                <input
                  style={styles.nicknameInput}
                  value={nicknameDraft}
                  maxLength={20}
                  onChange={(e) => setNicknameDraft(e.target.value)}
                />
                <button
                  type="button"
                  style={styles.nicknameBtn}
                  disabled={nicknameSaving || nicknameDraft.trim() === (username ?? '')}
                  onClick={handleUpdateNickname}
                >
                  {nicknameSaving ? '…' : 'Save'}
                </button>
              </div>
              {nicknameError && <p style={styles.nicknameError}>{nicknameError}</p>}
              <p style={styles.nicknameSub}>Change anytime before the game starts.</p>
            </div>
          )}

          {/* Lobby start button */}
          {phase === 'LOBBY' && isHost && players.length >= 2 && (
            <motion.button
              style={styles.startBtn}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => sendStart(roomCode)}
            >
              🚀 Start Game ({players.length} players)
            </motion.button>
          )}

          {phase === 'LOBBY' && isHost && players.length < 2 && (
            <p style={styles.waitHint}>
              Share room code <strong>{roomCode}</strong> — need at least 2 players, or create a room with BOT Vitality
            </p>
          )}

          {phase === 'LOBBY' && !isHost && (
            <p style={styles.waitHint}>Waiting for <strong>{players.find(p => p.id === hostPlayerId)?.username ?? 'host'}</strong> to start…</p>
          )}

          {/* My hand */}
          {phase !== 'LOBBY' && (
            <div>
              <p style={styles.handLabel}>
                Your hand{myPlayer ? ` — Score: ${scores[playerId] ?? 0} | Bid: ${myPlayer.bid ?? '–'} | Tricks: ${myPlayer.tricksWon}` : ''}
              </p>
              <PlayerHand
                hand={hand}
                phase={phase}
                isMyTurn={isMyTurn && !paused}
                roomCode={roomCode}
                currentTrick={currentTrick}
              />
            </div>
          )}
        </div>

        {/* Right: scoreboard */}
        <div style={styles.sidebar}>
          <ScorePanel
            players={players}
            scores={scores}
            round={round}
            maxRounds={maxRounds}
            phase={phase}
            roundHistory={roundHistory}
          />
          {phase !== 'LOBBY' && (
            <div style={{ marginTop: 12 }}>
              <ChatPanel
                roomCode={roomCode}
                messages={chatMessages}
                myPlayerId={playerId}
                disabled={phase === 'GAME_END' || paused}
              />
            </div>
          )}
        </div>
      </div>

      {/* Reconnecting indicator — shown when the socket drops mid-game */}
      <AnimatePresence>
        {!wsConnected && phase !== 'LOBBY' && phase !== 'GAME_END' && (
          <motion.div
            style={styles.reconnectToast}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <span style={styles.reconnectDot} /> Reconnecting…
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      {showBidModal && phase === 'BIDDING' && isMyTurn && (
        <BidModal
          round={round}
          roomCode={roomCode}
          hand={hand}
          players={players}
          myPlayerId={playerId}
          onBid={() => setShowBidModal(false)}
        />
      )}

      {roundSummary && (
        <RoundSummary
          data={roundSummary}
          players={players}
          roundHistory={roundHistory}
          onDismiss={roundSummary.gameOver ? handleGameOver : dismissRoundSummary}
        />
      )}

      {/* Pause overlay — 1v1 vs bot only */}
      <AnimatePresence>
        {paused && isSoloBotGame && (
          <motion.div
            style={styles.pauseOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div style={styles.pauseCard}>
              <div style={styles.pauseIcon}>⏸</div>
              <h2 style={styles.pauseTitle}>Game Paused</h2>
              <p style={styles.pauseText}>
                {pausedAuto
                  ? 'You disconnected — the game is waiting for you.'
                  : 'Take your time. BOT Vitality is on hold.'}
              </p>
              <motion.button
                style={styles.resumeBtn}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => sendResume(roomCode)}
              >
                ▶ Resume Game
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error toast */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            style={styles.errorToast}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            ⚠ {errorMessage}
            <button style={styles.closeToast} onClick={clearError}>✕</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(160deg, #1a4a2e 0%, #0d2b1a 100%)',
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
    paddingBottom: 80,
  },
  pageIncognito: {
    background: 'linear-gradient(160deg, #0a0a0c 0%, #121218 50%, #0d0d12 100%)',
  },
  pauseOverlay: {
    position: 'fixed', inset: 0, zIndex: 250,
    background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  pauseCard: {
    background: 'linear-gradient(160deg, #1e5631, #0d2b1a)',
    border: '1px solid rgba(255,255,255,0.15)', borderRadius: 20,
    padding: '36px 48px', textAlign: 'center' as const, maxWidth: 380,
    boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
  },
  pauseIcon: { fontSize: 48, marginBottom: 12 },
  pauseTitle: { color: '#fff', fontSize: 24, fontWeight: 800, margin: '0 0 12px' },
  pauseText: { color: 'rgba(255,255,255,0.65)', fontSize: 14, margin: '0 0 24px', lineHeight: 1.5 },
  resumeBtn: {
    padding: '14px 32px', borderRadius: 12, border: 'none',
    background: 'linear-gradient(135deg, #f1c40f, #e67e22)',
    color: '#1a1a1a', fontWeight: 800, fontSize: 16, cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(241,196,15,0.3)',
  },
  layout: {
    display: 'flex', gap: 16, padding: 16, flex: 1,
    flexWrap: 'wrap' as const,
  },
  center: {
    flex: 1, display: 'flex', flexDirection: 'column' as const, gap: 14, minWidth: 320,
  },
  sidebar: { width: 250, flexShrink: 0 },
  lastTrickBanner: {
    background: 'rgba(241,196,15,0.15)', border: '1px solid rgba(241,196,15,0.4)',
    borderRadius: 10, padding: '8px 16px', textAlign: 'center' as const,
    color: '#f1c40f', fontSize: 14, fontWeight: 600,
  },
  startBtn: {
    padding: '14px 28px', borderRadius: 12, border: 'none',
    background: 'linear-gradient(135deg, #2d6a4f, #1b4332)',
    color: '#fff', fontWeight: 700, fontSize: 16, cursor: 'pointer',
    alignSelf: 'center' as const, boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
  },
  nicknameBar: {
    alignSelf: 'center' as const,
    width: '100%',
    maxWidth: 420,
    background: 'rgba(0,0,0,0.2)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: '14px 16px',
    marginBottom: 4,
  },
  nicknameLabel: {
    margin: '0 0 8px',
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    fontWeight: 600,
    textAlign: 'center' as const,
  },
  nicknameRow: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  nicknameInput: {
    flex: 1,
    padding: '10px 12px',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'rgba(255,255,255,0.08)',
    color: '#fff',
    fontSize: 14,
    outline: 'none',
  },
  nicknameBtn: {
    padding: '10px 14px',
    borderRadius: 10,
    border: 'none',
    background: 'linear-gradient(135deg, #2980b9, #1a5276)',
    color: '#fff',
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
    minWidth: 64,
  },
  nicknameError: {
    margin: '8px 0 0',
    color: '#ff7b7b',
    fontSize: 12,
    textAlign: 'center' as const,
  },
  nicknameSub: {
    margin: '8px 0 0',
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    textAlign: 'center' as const,
  },
  waitHint: {
    color: 'rgba(255,255,255,0.5)', fontSize: 14, textAlign: 'center' as const,
    padding: '12px 0',
  },
  handLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginBottom: 8, fontWeight: 600 },
  errorToast: {
    position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
    background: '#c0392b', color: '#fff', padding: '12px 20px', borderRadius: 12,
    fontSize: 14, fontWeight: 600, display: 'flex', gap: 12, alignItems: 'center',
    zIndex: 300, boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
  },
  closeToast: {
    background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 16,
  },
  reconnectToast: {
    position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
    background: 'rgba(30,30,30,0.95)', color: '#f1c40f', padding: '10px 18px', borderRadius: 12,
    fontSize: 13, fontWeight: 700, display: 'flex', gap: 10, alignItems: 'center',
    zIndex: 300, boxShadow: '0 8px 24px rgba(0,0,0,0.4)', border: '1px solid rgba(241,196,15,0.4)',
  },
  reconnectDot: {
    width: 8, height: 8, borderRadius: '50%', background: '#f1c40f',
    boxShadow: '0 0 8px #f1c40f',
  },
};
