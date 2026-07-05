import { useEffect, useState } from 'react';
import type { PlayerDto, PlayerPresenceDto } from '../types/game';

interface Props {
  players: PlayerDto[];
  presence: Record<string, PlayerPresenceDto>;
  myPlayerId: string | null;
  graceSeconds: number;
}

function formatCountdown(expiresAt: number): string {
  const sec = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${s}s`;
}

export default function PresenceBar({ players, presence, myPlayerId, graceSeconds }: Props) {
  const [, tick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => tick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const humans = players.filter((p) => !p.bot);

  return (
    <div style={styles.bar}>
      <span style={styles.label}>In game</span>
      {humans.map((p) => {
        const pr = presence[p.id];
        const status = pr?.status ?? p.presenceStatus ?? (p.connected ? 'ONLINE' : 'DISCONNECTED');
        const isMe = p.id === myPlayerId;
        const graceExpires = pr?.graceExpiresAt ?? p.graceExpiresAt;

        let detail = 'Online';
        let color = '#2ecc71';
        if (status === 'GRACE' && graceExpires) {
          detail = `Rejoin in ${formatCountdown(graceExpires)}`;
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
          </div>
        );
      })}
      <span style={styles.hint}>Grace period: {graceSeconds}s</span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  bar: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
    padding: '8px 20px',
    background: 'rgba(0,0,0,0.25)',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    fontSize: 12,
  },
  label: { color: 'rgba(255,255,255,0.45)', fontWeight: 700, marginRight: 4 },
  chip: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 10px',
    borderRadius: 20,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  dot: { width: 8, height: 8, borderRadius: '50%' },
  name: { color: '#fff', fontWeight: 600 },
  status: { fontSize: 11, fontWeight: 600 },
  hint: { marginLeft: 'auto', color: 'rgba(255,255,255,0.35)', fontSize: 11 },
};
