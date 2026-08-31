import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { connect, disconnect, scheduleDisconnect, sendLeave, sendPause, sendResume, sendStart, sendReady, sendVoteBot, sendTeam, sendKick } from '../services/websocket';
import { getRoom, updateNickname, updateRoomSettings } from '../services/api';
import { saveNickname } from '../services/nicknameStorage';
import { loadSession, saveSession } from '../services/sessionStorage';
import type { RoomStateDto } from '../types/game';
import TrickArea from '../components/TrickArea';
import OpponentHands from '../components/OpponentHands';
import PlayerHand from '../components/PlayerHand';
import ScorePanel from '../components/ScorePanel';
import BidModal from '../components/BidModal';
import RoundSummary from '../components/RoundSummary';
import PresenceBar from '../components/PresenceBar';
import ChatPanel from '../components/ChatPanel';
import GameHeader from '../components/GameHeader';
import LobbyPanel from '../components/LobbyPanel';
import TierBadge from '../components/TierBadge';
import { tierCardFaceColor } from '../constants/tiers';
import { useAuthStore } from '../store/authStore';
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
    isSpectator, spectators, botVotes, gameMode, teamScores, team1Name, team2Name,
    kickedFromLobby, ranked,
    handleGameEvent, setHand, dismissRoundSummary, clearError, reset,
    applySnapshot, syncRoomFromDto,
  } = useGameStore();

  const ruthlessHidden = gameMode === 'RUTHLESS_HIDDEN';
  const isClanBattle = gameMode === 'CLAN_BATTLE';

  const [showBidModal, setShowBidModal] = useState(false);
  const [nicknameDraft, setNicknameDraft] = useState(username ?? '');
  const [nicknameError, setNicknameError] = useState('');
  const [nicknameSaving, setNicknameSaving] = useState(false);
  const [shareMsg, setShareMsg] = useState('');
  const [hostSettingsError, setHostSettingsError] = useState('');
  const [kickTarget, setKickTarget] = useState<{ id: string; username: string } | null>(null);
  const [team1Draft, setTeam1Draft] = useState(team1Name);
  const [team2Draft, setTeam2Draft] = useState(team2Name);
  const incognitoMode = useDisplayStore((s) => s.incognitoMode);
  const authUser = useAuthStore((s) => s.user);

  useEffect(() => {
    setNicknameDraft(username ?? '');
  }, [username]);

  const isMyTurn = currentTurnPlayerId === playerId;
  // Host can transfer if the original host leaves the lobby, so always derive it
  // from the live hostPlayerId rather than the value captured when we joined.
  const amHost = hostPlayerId ? hostPlayerId === playerId : isHost;

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

  useEffect(() => {
    setTeam1Draft(team1Name);
    setTeam2Draft(team2Name);
  }, [team1Name, team2Name]);

  useEffect(() => {
    if (!kickedFromLobby) return;
    navigate('/', { replace: true, state: { message: 'You were removed from the lobby by the host.' } });
    useGameStore.setState({ kickedFromLobby: false });
  }, [kickedFromLobby, navigate]);

  // Load room state (players, mode, lobby phase)
  useEffect(() => {
    if (!roomCode) return;
    getRoom(roomCode)
      .then((room: RoomStateDto) => syncRoomFromDto(room))
      .catch(() => {});
  }, [roomCode, syncRoomFromDto]);

  // Mobile-friendly reconnect
  useEffect(() => {
    if (!roomCode) return;
    const resync = () => {
      if (document.visibilityState !== 'visible') return;
      getRoom(roomCode)
        .then((room: RoomStateDto) => syncRoomFromDto(room))
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
  const myTier = myPlayer?.tier ?? authUser?.tier ?? null;
  const myFaceColor = tierCardFaceColor(myTier);
  const humanPlayers = players.filter((p) => !p.bot);
  const mentionableUsers = useMemo(() => {
    const names = new Set<string>();
    for (const p of players) {
      if (!p.bot) names.add(p.username);
    }
    for (const s of spectators) names.add(s.username);
    return [...names];
  }, [players, spectators]);
  const allHumansReady = humanPlayers.length > 0 && humanPlayers.every((p) => p.ready);
  const skipReadyCheck = playWithBot && humanPlayers.length === 1;
  const canStart = allHumansReady || skipReadyCheck;
  const isSoloBotGame =
    playWithBot &&
    players.length === 2 &&
    players.filter((p) => p.bot).length === 1;
  const canPause =
    !isSpectator &&
    isSoloBotGame &&
    !paused &&
    (phase === 'BIDDING' || phase === 'PLAYING');

  function buildInviteLink(): string {
    const base = import.meta.env.BASE_URL.endsWith('/')
      ? import.meta.env.BASE_URL
      : `${import.meta.env.BASE_URL}/`;
    return `${window.location.origin}${base}?join=${roomCode}`;
  }

  async function handleShare() {
    const url = buildInviteLink();
    const shareData = {
      title: 'Ace Spade',
      text: `Join my Ace Spade room ${roomCode}`,
      url,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
    } catch {
      // user cancelled or share failed — fall back to copy
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareMsg('Invite link copied!');
    } catch {
      setShareMsg(url);
    }
    setTimeout(() => setShareMsg(''), 2500);
  }

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

  async function handleLobbyRoundsChange(value: number) {
    if (!roomCode || !sessionToken) return;
    if (!ranked && !isClanBattle) return;
    setHostSettingsError('');
    try {
      const room = await updateRoomSettings(roomCode, sessionToken, { maxRounds: value });
      syncRoomFromDto(room);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: string } })?.response?.data;
      setHostSettingsError(typeof msg === 'string' ? msg : 'Could not update rounds');
    }
  }

  async function handleSaveTeamNames() {
    if (!roomCode || !sessionToken || !amHost) return;
    setHostSettingsError('');
    try {
      const room = await updateRoomSettings(roomCode, sessionToken, {
        team1Name: team1Draft.trim(),
        team2Name: team2Draft.trim(),
      });
      syncRoomFromDto(room);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: string } })?.response?.data;
      setHostSettingsError(typeof msg === 'string' ? msg : 'Could not save team names');
    }
  }

  function handleKick() {
    if (!roomCode || !kickTarget) return;
    sendKick(roomCode, kickTarget.id);
    setKickTarget(null);
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
        tier={myTier}
        isHost={amHost}
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
        botVotes={botVotes}
        onVoteBot={isSpectator ? undefined : (targetId) => sendVoteBot(roomCode, targetId)}
      />

      {spectators.length > 0 && (
        <div style={styles.spectatorBanner}>
          👁 Watching: {spectators.map((s) => s.username).join(', ')}
          <span style={{ opacity: 0.75 }}> ({spectators.length})</span>
          {isSpectator ? ' · You are watching' : ''}
        </div>
      )}

      {/* Main layout */}
      <div style={styles.layout}>
        {/* Left: opponents + trick area */}
        <div style={styles.center}>
          {phase === 'LOBBY' ? (
            <LobbyPanel
              roomCode={roomCode ?? ''}
              players={players}
              playerId={playerId ?? ''}
              hostPlayerId={hostPlayerId}
              amHost={amHost}
              isSpectator={isSpectator}
              ranked={ranked}
              maxRounds={maxRounds}
              gameMode={gameMode}
              playWithBot={playWithBot}
              isClanBattle={isClanBattle}
              canStart={canStart}
              allHumansReady={allHumansReady}
              myReady={Boolean(myPlayer?.ready)}
              team1Name={team1Name}
              team2Name={team2Name}
              team1Draft={team1Draft}
              team2Draft={team2Draft}
              nicknameDraft={nicknameDraft}
              nicknameError={nicknameError}
              nicknameSaving={nicknameSaving}
              shareMsg={shareMsg}
              hostSettingsError={hostSettingsError}
              kickTarget={kickTarget}
              onShare={handleShare}
              onNicknameChange={setNicknameDraft}
              onNicknameSave={handleUpdateNickname}
              onTeam1Draft={setTeam1Draft}
              onTeam2Draft={setTeam2Draft}
              onSaveTeamNames={handleSaveTeamNames}
              onPickTeam={(team) => sendTeam(roomCode!, team)}
              onRoundsChange={handleLobbyRoundsChange}
              onReady={() => sendReady(roomCode!, !myPlayer?.ready)}
              onStart={() => canStart && sendStart(roomCode!)}
              onKickRequest={(id, username) => setKickTarget({ id, username })}
              onKickCancel={() => setKickTarget(null)}
              onKickConfirm={handleKick}
            />
          ) : (
            <>
          <OpponentHands
            players={players}
            myPlayerId={playerId}
            currentTurnPlayerId={currentTurnPlayerId}
            scores={scores}
            ruthlessHidden={ruthlessHidden}
            phase={phase}
          />

          <TrickArea
            trick={currentTrick}
            players={players}
            myPlayerId={playerId}
            myTier={myTier}
          />

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

          {/* My hand (players only) */}
          {!isSpectator && (
            <div>
              <p style={{ ...styles.handLabel, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                <TierBadge tier={myTier} size="sm" />
                <span>
                  Your hand{myPlayer ? ` — Score: ${scores[playerId] ?? 0} | Bid: ${myPlayer.bid ?? '–'} | Tricks: ${myPlayer.tricksWon}` : ''}
                </span>
              </p>
              <PlayerHand
                hand={hand}
                phase={phase}
                isMyTurn={isMyTurn && !paused}
                roomCode={roomCode}
                currentTrick={currentTrick}
                faceColor={myFaceColor}
              />
            </div>
          )}
            </>
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
            gameMode={gameMode}
            teamScores={teamScores}
            team1Name={team1Name}
            team2Name={team2Name}
            ruthlessHidden={ruthlessHidden}
          />
          <div style={{ marginTop: 12 }}>
            <ChatPanel
              roomCode={roomCode}
              messages={chatMessages}
              myPlayerId={playerId}
              mentionableUsers={mentionableUsers}
              disabled={phase === 'GAME_END' || (paused && !isSpectator)}
            />
          </div>
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
      {showBidModal && phase === 'BIDDING' && isMyTurn && !isSpectator && (
        <BidModal
          round={round}
          roomCode={roomCode}
          hand={hand}
          players={players}
          myPlayerId={playerId}
          faceColor={myFaceColor}
          ruthlessHidden={ruthlessHidden}
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
  modeBanner: {
    margin: '8px 16px 0',
    padding: '10px 14px',
    borderRadius: 10,
    background: 'rgba(241, 196, 15, 0.1)',
    border: '1px solid rgba(241, 196, 15, 0.25)',
    fontSize: 13,
    color: '#fff',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  modeBannerLabel: {
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: 'rgba(255,255,255,0.5)',
  },
  modeHint: { fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: 500 },
  clanLobby: {
    margin: '12px 0',
    padding: 16,
    borderRadius: 12,
    background: 'rgba(0,0,0,0.25)',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  clanTitle: { margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#f1c40f', textAlign: 'center' },
  clanPickRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 },
  clanPickBtn: {
    padding: '12px 10px', borderRadius: 10, border: '2px solid', background: 'rgba(0,0,0,0.2)',
    color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
  },
  clanTeam1: { borderColor: 'rgba(52, 152, 219, 0.5)', color: '#3498db' },
  clanTeam2: { borderColor: 'rgba(231, 76, 60, 0.5)', color: '#e74c3c' },
  clanPickActive: { background: 'rgba(255,255,255,0.12)' },
  clanColumns: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  clanCol: { padding: 10, borderRadius: 10, background: 'rgba(255,255,255,0.04)' },
  clanColTitle: { fontSize: 12, fontWeight: 800, marginBottom: 8 },
  clanSlot: { fontSize: 12, padding: '6px 8px', marginBottom: 4, borderRadius: 6, background: 'rgba(0,0,0,0.2)' },
  clanEmpty: { fontSize: 11, color: 'rgba(255,255,255,0.35)', fontStyle: 'italic' },
  clanNameEdit: {
    display: 'grid',
    gap: 8,
    marginBottom: 12,
    padding: 10,
    borderRadius: 8,
    background: 'rgba(255,255,255,0.04)',
  },
  clanNameLabel: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    fontSize: 11,
    fontWeight: 600,
    color: 'rgba(255,255,255,0.65)',
  },
  clanNameInput: {
    padding: '8px 10px',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'rgba(0,0,0,0.25)',
    color: '#fff',
    fontSize: 13,
  },
  clanNameSave: {
    padding: '8px 12px',
    borderRadius: 8,
    border: 'none',
    background: '#74c69d',
    color: '#0d2b1a',
    fontWeight: 700,
    fontSize: 12,
    cursor: 'pointer',
  },
  hostPanel: {
    margin: '12px 0',
    padding: 14,
    borderRadius: 12,
    background: 'rgba(241, 196, 15, 0.08)',
    border: '1px solid rgba(241, 196, 15, 0.25)',
  },
  hostTitle: { margin: '0 0 10px', fontSize: 13, fontWeight: 800, color: '#f1c40f' },
  hostRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 8,
  },
  hostSelect: {
    padding: '6px 10px',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.2)',
    background: 'rgba(0,0,0,0.25)',
    color: '#fff',
    fontSize: 13,
  },
  hostNote: { margin: '4px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 },
  hostError: { margin: '8px 0 0', fontSize: 12, color: '#e74c3c' },
  readyRow: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  kickBtn: {
    padding: '4px 10px',
    borderRadius: 6,
    border: '1px solid rgba(231, 76, 60, 0.45)',
    background: 'rgba(231, 76, 60, 0.15)',
    color: '#e74c3c',
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
  },
  kickConfirm: { display: 'flex', gap: 6 },
  kickYes: {
    padding: '4px 8px',
    borderRadius: 6,
    border: 'none',
    background: '#e74c3c',
    color: '#fff',
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
  },
  kickNo: {
    padding: '4px 8px',
    borderRadius: 6,
    border: '1px solid rgba(255,255,255,0.2)',
    background: 'transparent',
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    cursor: 'pointer',
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
  startBtnDisabled: {
    opacity: 0.45,
    cursor: 'not-allowed',
    background: 'rgba(45,106,79,0.5)',
  },
  readyBar: {
    alignSelf: 'center' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 10,
    width: '100%',
    maxWidth: 420,
  },
  readyList: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 8,
    justifyContent: 'center',
  },
  readyChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '4px 10px',
    borderRadius: 16,
    fontSize: 12,
    fontWeight: 600,
    background: 'rgba(255,255,255,0.08)',
    color: 'rgba(255,255,255,0.65)',
    border: '1px solid rgba(255,255,255,0.12)',
  },
  readyChipOn: {
    background: 'rgba(46,204,113,0.2)',
    color: '#2ecc71',
    borderColor: 'rgba(46,204,113,0.45)',
  },
  readyBtn: {
    padding: '10px 20px',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.2)',
    background: 'rgba(255,255,255,0.1)',
    color: '#fff',
    fontWeight: 700,
    cursor: 'pointer',
  },
  readyBtnOn: {
    background: 'rgba(46,204,113,0.35)',
    borderColor: '#2ecc71',
  },
  spectatorBanner: {
    textAlign: 'center' as const,
    padding: '6px 12px',
    background: 'rgba(52,152,219,0.2)',
    borderBottom: '1px solid rgba(52,152,219,0.35)',
    color: '#85c1e9',
    fontSize: 12,
    fontWeight: 700,
  },
  shareBar: {
    alignSelf: 'center' as const,
    width: '100%',
    maxWidth: 420,
    background: 'rgba(0,0,0,0.2)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 10,
  },
  shareCodeRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  shareLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    fontWeight: 600,
  },
  shareCode: {
    color: '#f1c40f',
    fontSize: 22,
    fontWeight: 800,
    letterSpacing: 3,
    fontFamily: 'monospace',
  },
  shareBtn: {
    padding: '12px 16px',
    borderRadius: 10,
    border: 'none',
    cursor: 'pointer',
    background: 'linear-gradient(135deg, #2980b9, #1a5276)',
    color: '#fff',
    fontWeight: 700,
    fontSize: 14,
  },
  shareMsg: {
    margin: 0,
    textAlign: 'center' as const,
    color: '#74c69d',
    fontSize: 12,
    fontWeight: 600,
    wordBreak: 'break-all' as const,
  },
  shareSub: {
    margin: 0,
    textAlign: 'center' as const,
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
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
