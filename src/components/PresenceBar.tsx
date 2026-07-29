import { useEffect, useState } from 'react';
import type { PlayerDto, PlayerPresenceDto } from '../types/game';
import { useMediaQuery } from '../hooks/useMediaQuery';

interface Props {
  players: PlayerDto[];
  presence: Record<string, PlayerPresenceDto>;
  myPlayerId: string | null;
  graceSeconds: number;
  botVotes?: Record<string, string[]>;
  onVoteBot?: (targetPlayerId: string) => void;
}

function formatCountdown(expiresAt: number): string {
  const sec = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${s}s`;
}

export default function PresenceBar({ players, presence, myPlayerId, botVotes, onVoteBot }: Props) {
  const [, tick] = useState(0);
  const isMobile = useMediaQuery('(max-width: 640px)');

  useEffect(() => {
    const id = setInterval(() => tick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const humans = players.filter((p) => !p.bot);

  return (
    <div style={styles.bar}>
      <span style={styles.label}>In game</span>
      <div style={isMobile ? styles.scroll : styles.wrap}>
        {humans.map((p) => {
          const pr = presence[p.id];
          const status = pr?.status ?? p.presenceStatus ?? (p.connected ? 'ONLINE' : 'DISCONNECTED');
          const isMe = p.id === myPlayerId;
          const graceExpires = pr?.graceExpiresAt ?? p.graceExpiresAt;
          const turnTimeoutAt = pr?.turnTimeoutAt;
          const autoPlayCount = pr?.autoPlayCount ?? p.autoPlayCount ?? 0;
          const isAway = status === 'AWAY' || status === 'DISCONNECTED' || (!pr?.connected && !p.connected && status !== 'ONLINE');
          const voteEligible = isAway && autoPlayCount >= 2 && !p.bot && p.id !== myPlayerId;
          const votes = botVotes?.[p.id] ?? [];
          const iVoted = myPlayerId ? votes.includes(myPlayerId) : false;

          let detail = 'Online';
          let color = '#2ecc71';
          if (status === 'AWAY') {
            // Away but not disruptive; if it's their turn we show the auto-play countdown.
            detail = turnTimeoutAt ? `Away · auto in ${formatCountdown(turnTimeoutAt)}` : 'Away';
            color = turnTimeoutAt ? '#e67e22' : '#95a5a6';
          } else if (status === 'GRACE' && graceExpires) {
            detail = formatCountdown(graceExpires);
            color = '#e67e22';
          } else if (status === 'PAUSED') {
            detail = 'Paused';
            color = '#f1c40f';
          } else if (status === 'DISCONNECTED') {
            detail = 'Offline';
            color = '#e74c3c';
          } else if (!pr?.connected && !p.connected) {
            detail = 'Connecting…';
            color = '#95a5a6';
          }

          return (
            <div key={p.id} style={styles.chip}>
              <span style={{ ...styles.dot, background: color }} />
              <span style={styles.name}>
                {p.username}{isMe ? ' (you)' : ''}
              </span>
              <span style={{ ...styles.status, color }}>{detail}</span>
              {autoPlayCount > 0 && (
                <span style={styles.autoBadge} title="Turns auto-played while away">
                  auto ×{autoPlayCount}
                </span>
              )}
              {voteEligible && onVoteBot && (
                <button
                  type="button"
                  style={{
                    ...styles.voteBtn,
                    ...(iVoted ? styles.voteBtnActive : {}),
                  }}
                  title="Vote to replace with BOT Vitality"
                  onClick={() => onVoteBot(p.id)}
                >
                  {iVoted ? 'Voted' : 'Vote bot'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  bar: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    background: 'rgba(0,0,0,0.25)',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    fontSize: 12,
  },
  label: {
    color: 'rgba(255,255,255,0.45)',
    fontWeight: 700,
    flexShrink: 0,
    fontSize: 11,
  },
  wrap: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  scroll: {
    display: 'flex',
    gap: 8,
    overflowX: 'auto',
    flex: 1,
    minWidth: 0,
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
  },
  chip: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 10px',
    borderRadius: 20,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  dot: { width: 7, height: 7, borderRadius: '50%' },
  name: { color: '#fff', fontWeight: 600 },
  status: { fontSize: 11, fontWeight: 600 },
  autoBadge: {
    fontSize: 10,
    fontWeight: 800,
    color: '#fff',
    background: '#e74c3c',
    borderRadius: 8,
    padding: '1px 6px',
    letterSpacing: 0.3,
  },
  voteBtn: {
    fontSize: 10,
    fontWeight: 700,
    color: '#fff',
    background: 'rgba(231,76,60,0.35)',
    border: '1px solid rgba(231,76,60,0.6)',
    borderRadius: 8,
    padding: '2px 8px',
    cursor: 'pointer',
  },
  voteBtnActive: {
    background: '#c0392b',
    borderColor: '#c0392b',
  },
};
