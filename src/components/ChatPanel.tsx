import { useState, useRef, useEffect } from 'react';
import type { ChatMessageDto } from '../types/game';
import { sendChat } from '../services/websocket';

interface Props {
  roomCode: string;
  messages: ChatMessageDto[];
  myPlayerId: string | null;
  disabled?: boolean;
}

export default function ChatPanel({ roomCode, messages, myPlayerId, disabled }: Props) {
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    sendChat(roomCode, trimmed);
    setText('');
  }

  return (
    <div style={styles.panel}>
      <div style={styles.header}>Room chat</div>
      <div style={styles.messages}>
        {messages.length === 0 && (
          <p style={styles.empty}>Say hello to the table…</p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              ...styles.msg,
              ...(m.playerId === myPlayerId ? styles.msgMine : {}),
            }}
          >
            <span style={styles.msgUser}>{m.username}</span>
            <span style={styles.msgText}>{m.text}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form style={styles.form} onSubmit={handleSend}>
        <input
          style={styles.input}
          value={text}
          maxLength={300}
          placeholder={disabled ? 'Chat unavailable' : 'Message…'}
          disabled={disabled}
          onChange={(e) => setText(e.target.value)}
        />
        <button style={styles.sendBtn} type="submit" disabled={disabled || !text.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    display: 'flex',
    flexDirection: 'column',
    background: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.1)',
    overflow: 'hidden',
    minHeight: 220,
    maxHeight: 320,
  },
  header: {
    padding: '10px 12px',
    fontWeight: 700,
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  empty: { color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: 0 },
  msg: {
    padding: '6px 10px',
    borderRadius: 8,
    background: 'rgba(255,255,255,0.06)',
    fontSize: 12,
  },
  msgMine: { background: 'rgba(45,106,79,0.5)', alignSelf: 'flex-end' },
  msgUser: { fontWeight: 700, color: '#f1c40f', marginRight: 6, fontSize: 11 },
  msgText: { color: 'rgba(255,255,255,0.9)' },
  form: { display: 'flex', gap: 6, padding: 8, borderTop: '1px solid rgba(255,255,255,0.08)' },
  input: {
    flex: 1,
    padding: '8px 10px',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'rgba(255,255,255,0.08)',
    color: '#fff',
    fontSize: 13,
    outline: 'none',
  },
  sendBtn: {
    padding: '8px 12px',
    borderRadius: 8,
    border: 'none',
    background: '#2d6a4f',
    color: '#fff',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: 12,
  },
};
