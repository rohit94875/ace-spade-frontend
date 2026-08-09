import { useState, useRef, useEffect, useMemo } from 'react';
import type { ChatMessageDto } from '../types/game';
import { sendChat } from '../services/websocket';
import { CHAT_EMOJIS } from '../constants/chatEmojis';
import { extractMentions, mentionQueryAtCursor, renderMentionParts } from '../utils/chatMentions';

interface Props {
  roomCode: string;
  messages: ChatMessageDto[];
  myPlayerId: string | null;
  mentionableUsers: string[];
  disabled?: boolean;
}

export default function ChatPanel({
  roomCode,
  messages,
  myPlayerId,
  mentionableUsers,
  disabled,
}: Props) {
  const [text, setText] = useState('');
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [mentionIdx, setMentionIdx] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const mentionQuery = useMemo(() => {
    const cursor = inputRef.current?.selectionStart ?? text.length;
    return mentionQueryAtCursor(text, cursor);
  }, [text]);

  const mentionSuggestions = useMemo(() => {
    if (mentionQuery === null) return [];
    const q = mentionQuery.toLowerCase();
    return mentionableUsers
      .filter((u) => u.toLowerCase().startsWith(q) && u.toLowerCase() !== q)
      .slice(0, 6);
  }, [mentionQuery, mentionableUsers]);

  useEffect(() => {
    setMentionIdx(0);
  }, [mentionQuery]);

  function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    const mentions = extractMentions(trimmed, mentionableUsers);
    sendChat(roomCode, { text: trimmed, mentions });
    setText('');
    setEmojiOpen(false);
  }

  function insertEmoji(emoji: string) {
    const input = inputRef.current;
    const cursor = input?.selectionStart ?? text.length;
    const next = text.slice(0, cursor) + emoji + text.slice(cursor);
    if (next.length > 300) return;
    setText(next);
    setEmojiOpen(false);
    requestAnimationFrame(() => {
      input?.focus();
      const pos = cursor + emoji.length;
      input?.setSelectionRange(pos, pos);
    });
  }

  function applyMention(username: string) {
    const input = inputRef.current;
    const cursor = input?.selectionStart ?? text.length;
    const before = text.slice(0, cursor);
    const at = before.lastIndexOf('@');
    if (at < 0) return;
    const next = `${text.slice(0, at)}@${username} ${text.slice(cursor)}`;
    setText(next);
    setMentionIdx(0);
    requestAnimationFrame(() => {
      input?.focus();
      const pos = at + username.length + 2;
      input?.setSelectionRange(pos, pos);
    });
  }

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (mentionSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIdx((i) => (i + 1) % mentionSuggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIdx((i) => (i - 1 + mentionSuggestions.length) % mentionSuggestions.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        applyMention(mentionSuggestions[mentionIdx]);
        return;
      }
      if (e.key === 'Escape') {
        setMentionIdx(0);
        return;
      }
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSend();
    }
  }

  function renderBody(m: ChatMessageDto) {
    const body = m.text ?? '';
    const parts = renderMentionParts(body, mentionableUsers);
    return (
      <span style={styles.msgText}>
        {parts.map((p, i) => (
          p.type === 'mention'
            ? <span key={i} style={styles.mention}>{p.value}</span>
            : <span key={i}>{p.value}</span>
        ))}
      </span>
    );
  }

  return (
    <div style={styles.panel}>
      <div style={styles.header}>Room chat</div>
      <div style={styles.messages}>
        {messages.length === 0 && (
          <p style={styles.empty}>Say hello to the table… use @ to mention someone</p>
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
            {renderBody(m)}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {emojiOpen && (
        <div style={styles.emojiPicker}>
          {CHAT_EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              style={styles.emojiBtn}
              disabled={disabled}
              onClick={() => insertEmoji(e)}
            >
              {e}
            </button>
          ))}
        </div>
      )}

      {mentionSuggestions.length > 0 && (
        <div style={styles.mentionMenu}>
          {mentionSuggestions.map((u, i) => (
            <button
              key={u}
              type="button"
              style={{ ...styles.mentionItem, ...(i === mentionIdx ? styles.mentionItemOn : {}) }}
              onMouseDown={(ev) => { ev.preventDefault(); applyMention(u); }}
            >
              @{u}
            </button>
          ))}
        </div>
      )}

      <form style={styles.form} onSubmit={handleSend}>
        <button
          type="button"
          style={{ ...styles.iconBtn, ...(emojiOpen ? styles.iconBtnOn : {}) }}
          disabled={disabled}
          title="Emoji"
          onClick={() => setEmojiOpen((o) => !o)}
        >
          😀
        </button>
        <input
          ref={inputRef}
          style={styles.input}
          value={text}
          maxLength={300}
          placeholder={disabled ? 'Chat unavailable' : 'Message… @name'}
          disabled={disabled}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onInputKeyDown}
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
    position: 'relative',
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
  mention: { color: '#74c69d', fontWeight: 700 },
  emojiPicker: {
    display: 'grid',
    gridTemplateColumns: 'repeat(10, 1fr)',
    gap: 2,
    padding: '6px 8px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(0,0,0,0.2)',
    maxHeight: 88,
    overflowY: 'auto',
  },
  emojiBtn: {
    border: 'none',
    background: 'transparent',
    fontSize: 20,
    padding: 4,
    cursor: 'pointer',
    borderRadius: 6,
    lineHeight: 1,
  },
  mentionMenu: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 48,
    background: '#1b4332',
    border: '1px solid rgba(116,198,157,0.35)',
    borderRadius: 8,
    overflow: 'hidden',
    zIndex: 5,
  },
  mentionItem: {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    padding: '8px 10px',
    border: 'none',
    background: 'transparent',
    color: '#fff',
    fontSize: 12,
    cursor: 'pointer',
  },
  mentionItemOn: { background: 'rgba(116,198,157,0.2)' },
  form: { display: 'flex', gap: 4, padding: 8, borderTop: '1px solid rgba(255,255,255,0.08)', alignItems: 'center' },
  iconBtn: {
    padding: '6px 8px',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.06)',
    color: 'rgba(255,255,255,0.75)',
    fontSize: 16,
    cursor: 'pointer',
    flexShrink: 0,
    lineHeight: 1,
  },
  iconBtnOn: {
    borderColor: 'rgba(116,198,157,0.5)',
    background: 'rgba(116,198,157,0.15)',
  },
  input: {
    flex: 1,
    padding: '8px 10px',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'rgba(255,255,255,0.08)',
    color: '#fff',
    fontSize: 13,
    outline: 'none',
    minWidth: 0,
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
    flexShrink: 0,
  },
};
