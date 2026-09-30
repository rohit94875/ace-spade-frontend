import { motion, AnimatePresence } from 'framer-motion';
import type { PlayerDto } from '../types/game';
import type { GameMode } from '../constants/gameModes';
import { gameModeLabel } from '../constants/gameModes';
import {
  CASUAL_MAX_ROUNDS,
  RANKED_MAX_ROUNDS,
  RANKED_MIN_ROUNDS,
  RANKED_ROUND_OPTIONS,
  allowsLobbyRoundPicker,
  type MaxRounds,
} from '../constants/gameLength';
import TierBadge from './TierBadge';

const MAX_PLAYERS = 8;

function roundOptionLabel(n: number): string {
  if (n === RANKED_MIN_ROUNDS) return `${n} rounds (quick)`;
  if (n === RANKED_MAX_ROUNDS) return `${n} rounds (full)`;
  return `${n} rounds`;
}

function playerMeta(p: PlayerDto): string {
  if (p.bot) return 'BOT Vitality';
  if (p.tier) return p.tier;
  return 'Unranked';
}

function avatarLetter(username: string): string {
  return (username.trim()[0] ?? '?').toUpperCase();
}

export interface LobbyPanelProps {
  roomCode: string;
  players: PlayerDto[];
  playerId: string;
  hostPlayerId: string | null;
  amHost: boolean;
  isSpectator: boolean;
  ranked: boolean;
  maxRounds: MaxRounds;
  gameMode: GameMode;
  playWithBot: boolean;
  isClanBattle: boolean;
  canStart: boolean;
  allHumansReady: boolean;
  myReady: boolean;
  team1Name: string;
  team2Name: string;
  team1Draft: string;
  team2Draft: string;
  nicknameDraft: string;
  nicknameError: string;
  nicknameSaving: boolean;
  shareMsg: string;
  hostSettingsError: string;
  kickTarget: { id: string; username: string } | null;
  onShare: () => void;
  onNicknameChange: (v: string) => void;
  onNicknameSave: () => void;
  onTeam1Draft: (v: string) => void;
  onTeam2Draft: (v: string) => void;
  onSaveTeamNames: () => void;
  onPickTeam: (team: 1 | 2) => void;
  onRoundsChange: (n: number) => void;
  onReady: () => void;
  onStart: () => void;
  onKickRequest: (id: string, username: string) => void;
  onKickCancel: () => void;
  onKickConfirm: () => void;
}

export default function LobbyPanel({
  roomCode,
  players,
  playerId,
  hostPlayerId,
  amHost,
  isSpectator,
  ranked,
  maxRounds,
  gameMode,
  playWithBot,
  isClanBattle,
  canStart,
  allHumansReady,
  myReady,
  team1Name,
  team2Name,
  team1Draft,
  team2Draft,
  nicknameDraft,
  nicknameError,
  nicknameSaving,
  shareMsg,
  hostSettingsError,
  kickTarget,
  onShare,
  onNicknameChange,
  onNicknameSave,
  onTeam1Draft,
  onTeam2Draft,
  onSaveTeamNames,
  onPickTeam,
  onRoundsChange,
  onReady,
  onStart,
  onKickRequest,
  onKickCancel,
  onKickConfirm,
}: LobbyPanelProps) {
  const seatCount = players.length;
  const myTeam = players.find((p) => p.id === playerId)?.teamId;
  const emptySeats = Math.max(0, MAX_PLAYERS - seatCount);
  const waitingPlayers = players.filter((p) => !p.bot && !p.ready);
  const hostUsername = players.find((p) => p.id === hostPlayerId)?.username ?? 'host';

  const statusLine = (() => {
    if (isClanBattle && seatCount < 4) {
      return `Clan Battle needs 4+ players (${seatCount}/${MAX_PLAYERS} joined)`;
    }
    if (seatCount < 2 && !playWithBot) {
      return 'Need at least 2 players — share the code below';
    }
    if (amHost && !canStart && waitingPlayers.length > 0) {
      const names = waitingPlayers.map((p) => p.username).join(', ');
      return `Waiting for ${names} to ready up`;
    }
    if (amHost && canStart) {
      return 'Everyone is ready — you can start the game';
    }
    if (!amHost && allHumansReady) {
      return `Waiting for ${hostUsername} to start…`;
    }
    if (!amHost) {
      return 'Mark yourself ready — host starts once everyone is ready';
    }
    return amHost ? 'Mark yourself ready to unlock start' : '';
  })();

  const modeBadge = [
    gameModeLabel(gameMode),
    ranked ? 'Ranked' : isClanBattle ? 'Unranked' : 'Casual',
    `${maxRounds}r`,
  ].join(' · ');

  const hostCanPickRounds = allowsLobbyRoundPicker(ranked, gameMode);

  return (
    <>
      <div style={styles.shell}>
        <div style={styles.topBar}>
          <span style={styles.roomCode}>{roomCode}</span>
          <span style={styles.topBadge}>{modeBadge} · Lobby</span>
        </div>

        <div style={styles.body}>
          <h2 style={styles.heading}>Waiting for players</h2>
          <p style={styles.sub}>
            Share code <strong style={styles.subCode}>{roomCode}</strong>
            {' · '}{seatCount}/{MAX_PLAYERS} seats
            {amHost ? ' · You are the host' : ` · Host: ${hostUsername}`}
          </p>

          <div style={styles.shareRow}>
            <motion.button
              type="button"
              style={styles.shareBtn}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onShare}
            >
              🔗 Share invite link
            </motion.button>
            {shareMsg && <span style={styles.shareMsg}>{shareMsg}</span>}
          </div>

          {!isSpectator && (
            <div style={styles.nicknameBlock}>
              <label style={styles.nicknameLabel} htmlFor="lobby-nickname">
                Your nickname
              </label>
              <div style={styles.nicknameRow}>
                <input
                  id="lobby-nickname"
                  style={styles.nicknameInput}
                  value={nicknameDraft}
                  maxLength={20}
                  onChange={(e) => onNicknameChange(e.target.value)}
                />
                <button
                  type="button"
                  style={styles.nicknameBtn}
                  disabled={nicknameSaving}
                  onClick={onNicknameSave}
                >
                  {nicknameSaving ? '…' : 'Save'}
                </button>
              </div>
              {nicknameError && <p style={styles.nicknameError}>{nicknameError}</p>}
            </div>
          )}

          {isClanBattle && !isSpectator && (
            <div style={styles.clanBlock}>
              <p style={styles.clanTitle}>Clan teams — pick a side</p>
              {amHost && (
                <div style={styles.clanNameGrid}>
                  <label style={styles.clanNameLabel}>
                    🔵 Name
                    <input
                      style={styles.clanNameInput}
                      value={team1Draft}
                      maxLength={24}
                      onChange={(e) => onTeam1Draft(e.target.value)}
                    />
                  </label>
                  <label style={styles.clanNameLabel}>
                    🔴 Name
                    <input
                      style={styles.clanNameInput}
                      value={team2Draft}
                      maxLength={24}
                      onChange={(e) => onTeam2Draft(e.target.value)}
                    />
                  </label>
                  <button type="button" style={styles.clanSaveBtn} onClick={onSaveTeamNames}>
                    Save team names
                  </button>
                </div>
              )}
              <div style={styles.clanPickRow}>
                <button
                  type="button"
                  style={{
                    ...styles.clanPick1,
                    ...(myTeam === 1 ? styles.clanPickActive1 : {}),
                  }}
                  onClick={() => onPickTeam(1)}
                >
                  🔵 {team1Name}
                </button>
                <button
                  type="button"
                  style={{
                    ...styles.clanPick2,
                    ...(myTeam === 2 ? styles.clanPickActive2 : {}),
                  }}
                  onClick={() => onPickTeam(2)}
                >
                  🔴 {team2Name}
                </button>
              </div>
            </div>
          )}

          {amHost && !isSpectator && (
            <div style={styles.hostPanel}>
              <div style={styles.hostPanelTitle}>Host settings</div>
              <div style={styles.settingRow}>
                <label htmlFor="lobby-rounds">Number of rounds</label>
                {hostCanPickRounds ? (
                  <select
                    id="lobby-rounds"
                    style={styles.settingSelect}
                    value={maxRounds}
                    onChange={(e) => onRoundsChange(Number(e.target.value))}
                  >
                    {RANKED_ROUND_OPTIONS.map((n) => (
                      <option key={n} value={n}>{roundOptionLabel(n)}</option>
                    ))}
                  </select>
                ) : (
                  <span style={styles.settingFixed}>{CASUAL_MAX_ROUNDS} rounds (casual)</span>
                )}
              </div>
              <p style={styles.hostHint}>
                {ranked
                  ? `Ranked: ${RANKED_MIN_ROUNDS}–${RANKED_MAX_ROUNDS} rounds. Updates live for everyone.`
                  : isClanBattle
                    ? `Clan Battle: ${RANKED_MIN_ROUNDS}–${RANKED_MAX_ROUNDS} rounds (unranked). Updates live for everyone.`
                    : `Casual rooms stay at ${CASUAL_MAX_ROUNDS} rounds.`}
              </p>
              <p style={styles.hostHint}>
                Remove players before start — they can re-join with the room code.
              </p>
              {hostSettingsError && <p style={styles.hostError}>{hostSettingsError}</p>}
            </div>
          )}

          {!amHost && !isSpectator && hostCanPickRounds && (
            <div style={styles.roundsReadonly}>
              <span>Rounds:</span>
              <strong>{maxRounds}</strong>
              <span style={styles.roundsMuted}>(set by host)</span>
            </div>
          )}

          <div style={styles.playerList}>
            {players.map((p) => {
              const isHostRow = p.id === hostPlayerId;
              const isSelf = p.id === playerId;
              return (
                <div
                  key={p.id}
                  style={{
                    ...styles.playerRow,
                    ...(isHostRow ? styles.playerRowHost : {}),
                  }}
                >
                  <div
                    style={{
                      ...styles.avatar,
                      ...(isHostRow ? styles.avatarHost : {}),
                      ...(p.bot ? styles.avatarBot : {}),
                    }}
                  >
                    {p.bot ? '🤖' : avatarLetter(p.username)}
                  </div>
                  <div style={styles.playerInfo}>
                    <div style={styles.playerName}>
                      {p.username}
                      {isSelf && <span style={styles.youTag}> (you)</span>}
                      {isHostRow && <span style={styles.hostTag}> · host</span>}
                    </div>
                    <div style={styles.playerMeta}>
                      {!p.bot && <TierBadge tier={p.tier} size="sm" />}
                      {' '}{playerMeta(p)}
                      {isClanBattle && p.teamId != null && (
                        <span style={p.teamId === 1 ? styles.teamBlue : styles.teamRed}>
                          {' · '}{p.teamId === 1 ? team1Name : team2Name}
                        </span>
                      )}
                    </div>
                  </div>
                  {!p.bot && (
                    <span style={{
                      ...styles.readyChip,
                      ...(p.ready ? styles.readyChipOn : styles.readyChipWait),
                    }}
                    >
                      {p.ready ? 'Ready' : 'Waiting'}
                    </span>
                  )}
                  {amHost && !isSelf && !p.bot && (
                    <button
                      type="button"
                      style={styles.kickBtn}
                      onClick={() => onKickRequest(p.id, p.username)}
                    >
                      Kick
                    </button>
                  )}
                </div>
              );
            })}
            {Array.from({ length: emptySeats }).map((_, i) => (
              <div key={`empty-${i}`} style={styles.playerRowEmpty}>
                <div style={styles.avatarEmpty}>+</div>
                <div style={styles.playerInfo}>
                  <div style={styles.emptyLabel}>Empty seat</div>
                </div>
              </div>
            ))}
          </div>

          {!isSpectator && (
            <div style={styles.readyBar}>
              <motion.button
                type="button"
                style={{
                  ...styles.btnGhost,
                  ...(myReady ? styles.btnGhostOn : {}),
                }}
                whileTap={{ scale: 0.97 }}
                onClick={onReady}
              >
                {myReady ? 'Unready' : amHost ? "I'm ready (host)" : 'Ready up'}
              </motion.button>
              {amHost && (
                <motion.button
                  type="button"
                  style={{
                    ...styles.btnPrimary,
                    ...(!canStart ? styles.btnPrimaryDisabled : {}),
                  }}
                  whileHover={canStart ? { scale: 1.03 } : undefined}
                  whileTap={canStart ? { scale: 0.97 } : undefined}
                  disabled={!canStart || (isClanBattle && seatCount < 4)}
                  onClick={onStart}
                >
                  Start game
                  {seatCount >= 2 && ` (${seatCount})`}
                </motion.button>
              )}
            </div>
          )}

          {statusLine && <p style={styles.statusFoot}>{statusLine}</p>}
        </div>
      </div>

      <AnimatePresence>
        {kickTarget && (
          <motion.div
            style={styles.kickOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              style={styles.kickModal}
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
            >
              <h3 style={styles.kickTitle}>Remove player?</h3>
              <p style={styles.kickText}>
                {kickTarget.username} will be removed from the lobby before the game starts.
              </p>
              <div style={styles.kickActions}>
                <button type="button" style={styles.btnGhost} onClick={onKickCancel}>
                  Cancel
                </button>
                <button type="button" style={styles.btnDanger} onClick={onKickConfirm}>
                  Remove
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: {
    background: '#0a1f14',
    borderRadius: 16,
    border: '1px solid rgba(255,255,255,0.12)',
    overflow: 'hidden',
    maxWidth: 640,
    width: '100%',
    margin: '0 auto 16px',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    padding: '12px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(0,0,0,0.2)',
  },
  roomCode: {
    fontFamily: 'ui-monospace, monospace',
    fontWeight: 800,
    color: '#f1c40f',
    letterSpacing: 2,
    fontSize: 16,
  },
  topBadge: {
    fontSize: 11,
    fontWeight: 700,
    padding: '4px 10px',
    borderRadius: 999,
    background: 'rgba(116, 198, 157, 0.15)',
    color: '#74c69d',
    border: '1px solid rgba(116, 198, 157, 0.35)',
  },
  body: { padding: '20px 16px 24px' },
  heading: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 700,
    margin: '0 0 4px',
    color: '#fff',
  },
  sub: {
    textAlign: 'center',
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    margin: '0 0 16px',
    lineHeight: 1.5,
  },
  subCode: { color: '#f1c40f', letterSpacing: 1 },
  shareRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 14,
  },
  shareBtn: {
    padding: '10px 16px',
    borderRadius: 10,
    border: '1px solid rgba(116, 198, 157, 0.4)',
    background: 'rgba(116, 198, 157, 0.12)',
    color: '#74c69d',
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
  },
  shareMsg: { fontSize: 12, color: '#74c69d' },
  nicknameBlock: { marginBottom: 16 },
  nicknameLabel: {
    display: 'block',
    fontSize: 11,
    fontWeight: 600,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 6,
  },
  nicknameRow: { display: 'flex', gap: 8 },
  nicknameInput: {
    flex: 1,
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'rgba(0,0,0,0.25)',
    color: '#fff',
    fontSize: 14,
  },
  nicknameBtn: {
    padding: '10px 14px',
    borderRadius: 8,
    border: 'none',
    background: 'rgba(255,255,255,0.12)',
    color: '#fff',
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
  },
  nicknameError: { margin: '6px 0 0', fontSize: 12, color: '#e74c3c' },
  clanBlock: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    background: 'rgba(52, 152, 219, 0.06)',
    border: '1px solid rgba(52, 152, 219, 0.2)',
  },
  clanTitle: {
    margin: '0 0 10px',
    fontSize: 12,
    fontWeight: 700,
    color: '#85c1e9',
    textAlign: 'center',
  },
  clanNameGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
    marginBottom: 10,
  },
  clanNameLabel: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    fontSize: 10,
    fontWeight: 600,
    color: 'rgba(255,255,255,0.55)',
  },
  clanNameInput: {
    padding: '8px 10px',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'rgba(0,0,0,0.25)',
    color: '#fff',
    fontSize: 13,
  },
  clanSaveBtn: {
    gridColumn: '1 / -1',
    padding: '8px 12px',
    borderRadius: 8,
    border: 'none',
    background: '#74c69d',
    color: '#0d2b1a',
    fontWeight: 700,
    fontSize: 12,
    cursor: 'pointer',
  },
  clanPickRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
  clanPick1: {
    padding: '12px 10px',
    borderRadius: 10,
    border: '2px solid rgba(52, 152, 219, 0.5)',
    background: 'rgba(0,0,0,0.2)',
    color: '#3498db',
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
  },
  clanPick2: {
    padding: '12px 10px',
    borderRadius: 10,
    border: '2px solid rgba(231, 76, 60, 0.5)',
    background: 'rgba(0,0,0,0.2)',
    color: '#e74c3c',
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
  },
  clanPickActive1: {
    background: 'rgba(52, 152, 219, 0.25)',
    boxShadow: '0 0 0 1px rgba(52, 152, 219, 0.6)',
  },
  clanPickActive2: {
    background: 'rgba(231, 76, 60, 0.25)',
    boxShadow: '0 0 0 1px rgba(231, 76, 60, 0.6)',
  },
  hostPanel: {
    background: 'rgba(116, 198, 157, 0.06)',
    border: '1px solid rgba(116, 198, 157, 0.2)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  hostPanelTitle: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#74c69d',
    marginBottom: 12,
  },
  settingRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
  },
  settingSelect: {
    padding: '8px 10px',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'rgba(0,0,0,0.25)',
    color: '#fff',
    fontSize: 13,
    minWidth: 160,
  },
  settingFixed: { fontWeight: 700, color: '#fff' },
  hostHint: { margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.45 },
  hostError: { margin: '8px 0 0', fontSize: 12, color: '#e74c3c' },
  roundsReadonly: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 14,
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  roundsMuted: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  playerList: { display: 'flex', flexDirection: 'column', gap: 8 },
  playerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 10,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  playerRowHost: { borderColor: 'rgba(241, 196, 15, 0.3)' },
  playerRowEmpty: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 10,
    background: 'rgba(255,255,255,0.02)',
    border: '1px dashed rgba(255,255,255,0.1)',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    fontWeight: 700,
    color: '#fff',
    flexShrink: 0,
  },
  avatarHost: { background: 'rgba(241, 196, 15, 0.2)', color: '#f1c40f' },
  avatarBot: { fontSize: 18 },
  avatarEmpty: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.04)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    color: 'rgba(255,255,255,0.25)',
    flexShrink: 0,
  },
  playerInfo: { flex: 1, minWidth: 0 },
  playerName: { fontSize: 14, fontWeight: 600, color: '#fff' },
  youTag: { fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: 500 },
  hostTag: { fontSize: 11, color: '#f1c40f', fontWeight: 600 },
  playerMeta: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 2,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  teamBlue: { color: '#3498db' },
  teamRed: { color: '#e74c3c' },
  emptyLabel: { fontSize: 13, color: 'rgba(255,255,255,0.35)' },
  readyChip: {
    fontSize: 11,
    padding: '4px 8px',
    borderRadius: 6,
    fontWeight: 600,
    flexShrink: 0,
  },
  readyChipOn: {
    background: 'rgba(116, 198, 157, 0.15)',
    color: '#74c69d',
  },
  readyChipWait: {
    background: 'rgba(255,255,255,0.06)',
    color: 'rgba(255,255,255,0.45)',
  },
  kickBtn: {
    padding: '5px 10px',
    borderRadius: 6,
    border: '1px solid rgba(231, 76, 60, 0.45)',
    background: 'rgba(231, 76, 60, 0.15)',
    color: '#e74c3c',
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
    flexShrink: 0,
  },
  readyBar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingTop: 16,
    borderTop: '1px solid rgba(255,255,255,0.08)',
  },
  btnGhost: {
    padding: '12px 18px',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.2)',
    background: 'rgba(255,255,255,0.08)',
    color: '#fff',
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
  },
  btnGhostOn: {
    background: 'rgba(116, 198, 157, 0.2)',
    borderColor: 'rgba(116, 198, 157, 0.45)',
    color: '#74c69d',
  },
  btnPrimary: {
    padding: '12px 22px',
    borderRadius: 10,
    border: 'none',
    background: 'linear-gradient(135deg, #27ae60, #1e8449)',
    color: '#fff',
    fontWeight: 800,
    fontSize: 14,
    cursor: 'pointer',
  },
  btnPrimaryDisabled: {
    opacity: 0.45,
    cursor: 'not-allowed',
  },
  btnDanger: {
    padding: '10px 16px',
    borderRadius: 8,
    border: 'none',
    background: '#e74c3c',
    color: '#fff',
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
  },
  statusFoot: {
    textAlign: 'center',
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 12,
    marginBottom: 0,
    lineHeight: 1.45,
  },
  kickOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    zIndex: 400,
  },
  kickModal: {
    background: '#0d2b1a',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 14,
    padding: 20,
    maxWidth: 320,
    width: '100%',
  },
  kickTitle: { margin: '0 0 8px', fontSize: 16, color: '#fff' },
  kickText: { margin: '0 0 16px', fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.45 },
  kickActions: { display: 'flex', gap: 10, justifyContent: 'flex-end' },
};
