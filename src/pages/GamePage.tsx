import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { connect, disconnect, sendLeave, sendPause, sendResume, sendStart } from '../services/websocket';
import { getRoom } from '../services/api';
import type { RoomStateDto } from '../types/game';
import PlayerHand from '../components/PlayerHand';
import TrickArea from '../components/TrickArea';
import OpponentHands from '../components/OpponentHands';
import ScorePanel from '../components/ScorePanel';
import BidModal from '../components/BidModal';
import RoundSummary from '../components/RoundSummary';
import PresenceBar from '../components/PresenceBar';
import ChatPanel from '../components/ChatPanel';
import ActivityFeed from '../components/ActivityFeed';

export default function GamePage() {
  const navigate = useNavigate();
  const {
    playerId, sessionToken, roomCode, username, isHost,
    phase, round, players, hand, currentTrick, scores,
    currentTurnPlayerId, hostPlayerId,
    roundHistory, lastTrick, roundSummary, errorMessage,
    wsConnected, setWsConnected, playWithBot, paused, pausedAuto, autoStartGame,
    presence, graceSeconds, chatMessages, turnAlert,
    handleGameEvent, setHand, dismissRoundSummary, clearError, clearTurnAlert, reset,
    applySnapshot,
  } = useGameStore();

  const [showBidModal, setShowBidModal] = useState(false);

  const isMyTurn = currentTurnPlayerId === playerId;

  // Open bid modal when it's my turn during bidding (not while paused)
  useEffect(() => {
    if (phase === 'BIDDING' && isMyTurn && !paused) {
      setShowBidModal(true);
    } else {
      setShowBidModal(false);
    }
  }, [phase, isMyTurn, paused]);

  // Turn banner when it's your turn
  useEffect(() => {
    if (paused) return;
    if (phase === 'BIDDING' && isMyTurn) {
      useGameStore.setState({ turnAlert: 'Your turn to bid!' });
    } else if (phase === 'PLAYING' && isMyTurn) {
      useGameStore.setState({ turnAlert: 'Your turn to play!' });
    } else if (!isMyTurn) {
      clearTurnAlert();
    }
  }, [phase, isMyTurn, paused, clearTurnAlert]);

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
          playWithBot: room.playWithBot ?? false,
          paused: room.paused ?? false,
          presence: room.presence ?? {},
          chatMessages: room.chatMessages ?? [],
        });
      })
      .catch(() => {});
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
    );

    return () => disconnect();
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

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={{ fontSize: 22 }}>♠</span>
          <span style={styles.gameName}>Ace Spade</span>
          <span style={styles.roomCode}>#{roomCode}</span>
        </div>
        <div style={styles.headerCenter}>
          {!wsConnected && <span style={styles.connecting}>Connecting…</span>}
          {wsConnected && phase === 'LOBBY' && (
            <span style={styles.waiting}>
              Waiting for players ({players.length}/8)…
            </span>
          )}
          {paused && isSoloBotGame && (
            <span style={styles.pausedLabel}>⏸ Game paused</span>
          )}
          {!paused && phase === 'BIDDING' && !isMyTurn && (
            <span style={styles.waiting}>
              Waiting for {players.find((p) => p.id === currentTurnPlayerId)?.username ?? '…'} to bid
            </span>
          )}
          {!paused && phase === 'PLAYING' && !isMyTurn && (
            <span style={styles.waiting}>
              Waiting for {players.find((p) => p.id === currentTurnPlayerId)?.username ?? '…'} to play
            </span>
          )}
          {isMyTurn && phase === 'PLAYING' && !paused && (
            <motion.span
              style={styles.yourTurn}
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
            >
              ▶ Your turn to play!
            </motion.span>
          )}
        </div>
        <div style={styles.headerRight}>
          <span style={styles.playerLabel}>
            {username} {isHost ? '👑' : ''}
          </span>
          {canPause && (
            <button
              style={styles.pauseBtn}
              onClick={() => sendPause(roomCode)}
            >
              ⏸ Pause
            </button>
          )}
          <button style={styles.leaveBtn} onClick={handleLeave}>Leave</button>
        </div>
      </div>

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

      <ActivityFeed
        turnAlert={turnAlert}
        onDismissTurn={clearTurnAlert}
      />

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
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 20px',
    background: 'rgba(0,0,0,0.35)',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    flexShrink: 0,
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 8 },
  gameName: { fontWeight: 800, fontSize: 18, color: '#fff', letterSpacing: 1 },
  roomCode: { fontSize: 13, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', letterSpacing: 2 },
  headerCenter: { flex: 1, textAlign: 'center' as const },
  headerRight: { display: 'flex', alignItems: 'center', gap: 10 },
  playerLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  connecting: { color: '#f39c12', fontSize: 13 },
  waiting: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontStyle: 'italic' },
  yourTurn: { color: '#f1c40f', fontWeight: 700, fontSize: 14 },
  pausedLabel: { color: '#f1c40f', fontWeight: 700, fontSize: 14 },
  leaveBtn: {
    padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)',
    background: 'transparent', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 13,
  },
  pauseBtn: {
    padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(241,196,15,0.5)',
    background: 'rgba(241,196,15,0.15)', color: '#f1c40f', cursor: 'pointer', fontSize: 13,
    fontWeight: 600,
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
};
