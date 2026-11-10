import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useMediaQuery } from '../hooks/useMediaQuery';
import type { ChatMessageDto } from '../types/game';
import { sendChat } from '../services/websocket';
import { CHAT_EMOJIS } from '../constants/chatEmojis';
import { extractMentions, mentionQueryAtCursor, renderMentionParts } from '../utils/chatMentions';

/** Within this distance of the bottom counts as "reading the latest messages". */
const BOTTOM_THRESHOLD_PX = 40;
/** Share of the chat panel that must be on screen for its messages to count as seen. */
const VISIBLE_RATIO = 0.6;
/** Touch swipe-to-reply: drag distance that triggers a reply, and the max visual drag. */
const SWIPE_THRESHOLD_PX = 56;
const SWIPE_MAX_PX = 80;

interface SwipeState {
  msg: ChatMessageDto;
  startX: number;
  startY: number;
  locked: boolean;
  dx: number;
}

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
  const [unread, setUnread] = useState(0);
  const [replyingTo, setReplyingTo] = useState<ChatMessageDto | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);
  const swipeRef = useRef<SwipeState | null>(null);
  const isMobile = useMediaQuery('(max-width: 640px)');
  const canHover = useMediaQuery('(hover: hover)');
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  /** Chat list is scrolled to (near) its bottom. */
  const atBottomRef = useRef(true);
  /** Chat panel is mostly on screen (page scroll, not list scroll). */
  const visibleRef = useRef(true);
  const initializedRef = useRef(false);
  /** Id of the newest message already processed (length stops changing at the 100-message cap). */
  const lastSeenIdRef = useRef<string | null>(null);

  const lastId = messages.length > 0 ? messages[messages.length - 1].id : null;

  function scrollToBottom(smooth: boolean) {
    const list = listRef.current;
    if (!list) return;
    // Scroll only the chat list (not ancestors, unlike scrollIntoView).
    list.scrollTo({ top: list.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
  }

  /** Messages count as read only while the panel is on screen and the list is at the bottom. */
  function clearUnreadIfReading() {
    if (visibleRef.current && atBottomRef.current) setUnread(0);
  }

  function handleListScroll() {
    const list = listRef.current;
    if (!list) return;
    atBottomRef.current =
      list.scrollHeight - list.scrollTop - list.clientHeight <= BOTTOM_THRESHOLD_PX;
    clearUnreadIfReading();
  }

  useEffect(() => {
    const el = panelRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.intersectionRatio >= VISIBLE_RATIO;
        clearUnreadIfReading();
      },
      { threshold: [0, 0.3, VISIBLE_RATIO, 1] },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!initializedRef.current) {
      // First render or resume: start at the latest message, nothing is unread.
      initializedRef.current = true;
      lastSeenIdRef.current = lastId;
      scrollToBottom(false);
      return;
    }
    if (lastId === lastSeenIdRef.current) return;

    const prevId = lastSeenIdRef.current;
    lastSeenIdRef.current = lastId;
    const prevIdx = prevId ? messages.findIndex((m) => m.id === prevId) : -1;
    const fresh = messages.slice(prevIdx + 1);
    if (fresh.length === 0) return;

    const sentByMe = fresh[fresh.length - 1].playerId === myPlayerId;
    const fromOthers = fresh.filter((m) => m.playerId !== myPlayerId).length;

    if (sentByMe) {
      atBottomRef.current = true;
      setUnread(0);
      scrollToBottom(true);
    } else if (atBottomRef.current) {
      // Keep following. If the panel is off screen the messages are still unseen.
      scrollToBottom(visibleRef.current);
      if (!visibleRef.current) setUnread((n) => n + fromOthers);
    } else {
      setUnread((n) => n + fromOthers);
    }
  }, [lastId]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Desktop pill: jump the chat list to the newest message. */
  function jumpToLatest() {
    atBottomRef.current = true;
    setUnread(0);
    scrollToBottom(true);
  }

  /** Mobile floating button: bring the chat panel on screen, then to the newest message. */
  function goToChat() {
    panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    atBottomRef.current = true;
    setUnread(0);
    scrollToBottom(false);
  }

  const unreadLabel = unread > 99 ? '99+' : String(unread);

  function startReply(msg: ChatMessageDto) {
    if (disabled) return;
    setReplyingTo(msg);
    inputRef.current?.focus();
  }

  function cancelReply() {
    setReplyingTo(null);
  }

  /** Scroll the chat list to a quoted message and flash it. No-op if it is no longer loaded. */
  function jumpToMessage(id: string) {
    const list = listRef.current;
    if (!list) return;
    const el = Array.from(list.querySelectorAll<HTMLElement>('[data-msg-id]'))
      .find((node) => node.getAttribute('data-msg-id') === id);
    if (!el) return;
    list.scrollTo({ top: Math.max(0, el.offsetTop - 10), behavior: 'smooth' });
    setFlashId(id);
    window.setTimeout(() => setFlashId((cur) => (cur === id ? null : cur)), 1400);
  }

  function onBubblePointerDown(e: React.PointerEvent<HTMLDivElement>, msg: ChatMessageDto) {
    if (e.pointerType === 'mouse' || disabled) return;
    swipeRef.current = { msg, startX: e.clientX, startY: e.clientY, locked: false, dx: 0 };
  }

  function onBubblePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const s = swipeRef.current;
    if (!s) return;
    const dx = e.clientX - s.startX;
    const dy = e.clientY - s.startY;
    if (!s.locked) {
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
        s.locked = true;
        e.currentTarget.setPointerCapture(e.pointerId);
      } else {
        return;
      }
    }
    const d = Math.max(0, Math.min(dx, SWIPE_MAX_PX));
    s.dx = d;
    const bubble = e.currentTarget;
    bubble.style.transition = 'none';
    bubble.style.transform = `translateX(${d}px)`;
    const hint = bubble.parentElement?.querySelector<HTMLElement>('[data-swipe-hint]');
    if (hint) hint.style.opacity = String(Math.min(1, d / SWIPE_THRESHOLD_PX));
  }

  function onBubblePointerEnd(e: React.PointerEvent<HTMLDivElement>) {
    const s = swipeRef.current;
    swipeRef.current = null;
    if (!s) return;
    const bubble = e.currentTarget;
    bubble.style.transition = 'transform 0.22s ease';
    bubble.style.transform = 'translateX(0)';
    const hint = bubble.parentElement?.querySelector<HTMLElement>('[data-swipe-hint]');
    if (hint) hint.style.opacity = '0';
    if (s.locked && s.dx >= SWIPE_THRESHOLD_PX && e.type === 'pointerup') startReply(s.msg);
  }

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
    sendChat(roomCode, { text: trimmed, mentions, replyToId: replyingTo?.id });
    setText('');
    setEmojiOpen(false);
    setReplyingTo(null);
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
    if (e.key === 'Escape' && replyingTo) {
      cancelReply();
      return;
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
    <div ref={panelRef} style={styles.panel}>
      <div style={styles.header}>Room chat</div>
      <div ref={listRef} style={styles.messages} onScroll={handleListScroll}>
        {messages.length === 0 && (
          <p style={styles.empty}>Say hello to the table… use @ to mention someone</p>
        )}
        {messages.map((m) => {
          const mine = m.playerId === myPlayerId;
          return (
            <div
              key={m.id}
              data-msg-id={m.id}
              style={{ ...styles.msgRow, ...(mine ? styles.msgRowMine : {}) }}
              onMouseEnter={canHover ? () => setHoverId(m.id) : undefined}
              onMouseLeave={canHover ? () => setHoverId((cur) => (cur === m.id ? null : cur)) : undefined}
            >
              <span data-swipe-hint style={styles.swipeHint} aria-hidden="true">↩</span>
              <div
                style={{
                  ...styles.msg,
                  ...(mine ? styles.msgMine : {}),
                  ...(flashId === m.id ? styles.msgFlash : {}),
                }}
                onPointerDown={(e) => onBubblePointerDown(e, m)}
                onPointerMove={onBubblePointerMove}
                onPointerUp={onBubblePointerEnd}
                onPointerCancel={onBubblePointerEnd}
              >
                {m.replyTo && (
                  <button
                    type="button"
                    style={styles.quote}
                    onClick={() => jumpToMessage(m.replyTo!.id)}
                  >
                    <span style={styles.quoteName}>{m.replyTo.username}</span>
                    <span style={styles.quoteText}>{m.replyTo.text}</span>
                  </button>
                )}
                <span style={styles.msgUser}>{m.username}</span>
                {renderBody(m)}
              </div>
              {canHover && !disabled && hoverId === m.id && (
                <button
                  type="button"
                  style={styles.replyBtn}
                  onClick={() => startReply(m)}
                  aria-label={`Reply to ${m.username}`}
                  title="Reply"
                >
                  ↩
                </button>
              )}
            </div>
          );
        })}
      </div>

      {unread > 0 && !isMobile && (
        <button type="button" style={styles.newMsgPill} onClick={jumpToLatest}>
          {unread === 1 ? 'New message' : `${unreadLabel} new messages`} ↓
        </button>
      )}

      {unread > 0 && isMobile && createPortal(
        <button
          type="button"
          style={styles.chatFab}
          onClick={goToChat}
          aria-label={`${unreadLabel} unread chat messages. Go to chat`}
        >
          <span style={styles.chatFabIcon} aria-hidden="true">💬</span>
          <span style={styles.chatFabBadge}>{unreadLabel}</span>
        </button>,
        document.body,
      )}

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

      {replyingTo && (
        <div style={styles.replyBar}>
          <div style={styles.replyBarText}>
            <span style={styles.replyBarName}>Replying to {replyingTo.username}</span>
            <span style={styles.replyBarSnippet}>{replyingTo.text}</span>
          </div>
          <button
            type="button"
            style={styles.replyBarClose}
            onClick={cancelReply}
            aria-label="Cancel reply"
          >
            ✕
          </button>
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
    position: 'relative',
  },
  empty: { color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: 0 },
  msgRow: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    width: '100%',
    flexShrink: 0,
  },
  msgRowMine: { flexDirection: 'row-reverse' },
  msg: {
    padding: '6px 10px',
    borderRadius: 8,
    background: 'rgba(255,255,255,0.06)',
    fontSize: 12,
    maxWidth: '85%',
    minWidth: 0,
    touchAction: 'pan-y',
    transition: 'background 0.4s, box-shadow 0.4s',
  },
  msgMine: { background: 'rgba(45,106,79,0.5)' },
  msgFlash: {
    background: 'rgba(241,196,15,0.35)',
    boxShadow: '0 0 0 1px rgba(241,196,15,0.7)',
  },
  swipeHint: {
    position: 'absolute',
    left: 4,
    top: '50%',
    marginTop: -13,
    width: 26,
    height: 26,
    borderRadius: '50%',
    background: 'rgba(116,198,157,0.4)',
    color: '#d8f3dc',
    fontSize: 15,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0,
    pointerEvents: 'none',
  },
  replyBtn: {
    flex: '0 0 auto',
    width: 26,
    height: 26,
    borderRadius: '50%',
    border: 'none',
    background: 'rgba(255,255,255,0.12)',
    color: '#d8f3dc',
    fontSize: 15,
    lineHeight: 1,
    cursor: 'pointer',
    padding: 0,
  },
  quote: {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    margin: '0 0 5px',
    padding: '4px 8px',
    border: 'none',
    borderLeft: '3px solid #74c69d',
    borderRadius: 0,
    background: 'rgba(0,0,0,0.3)',
    color: 'rgba(255,255,255,0.75)',
    fontFamily: 'inherit',
    fontSize: 11,
    cursor: 'pointer',
  },
  quoteName: { display: 'block', color: '#74c69d', fontWeight: 700, fontSize: 11 },
  quoteText: {
    display: 'block',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  replyBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 10px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(0,0,0,0.25)',
  },
  replyBarText: {
    flex: 1,
    minWidth: 0,
    borderLeft: '3px solid #74c69d',
    paddingLeft: 8,
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
  },
  replyBarName: { display: 'block', color: '#74c69d', fontWeight: 700 },
  replyBarSnippet: {
    display: 'block',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  replyBarClose: {
    border: 'none',
    background: 'transparent',
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    cursor: 'pointer',
    padding: 4,
  },
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
  newMsgPill: {
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    bottom: 56,
    padding: '6px 14px',
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.35)',
    background: '#2d6a4f',
    color: '#fff',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    zIndex: 4,
    whiteSpace: 'nowrap',
    boxShadow: '0 3px 10px rgba(0,0,0,0.55)',
  },
  chatFab: {
    position: 'fixed',
    right: 16,
    bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
    width: 52,
    height: 52,
    borderRadius: '50%',
    border: '1px solid rgba(255,255,255,0.4)',
    background: '#2d6a4f',
    color: '#fff',
    cursor: 'pointer',
    zIndex: 60,
    padding: 0,
    boxShadow: '0 4px 12px rgba(0,0,0,0.55)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatFabIcon: { fontSize: 24, lineHeight: 1 },
  chatFabBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 20,
    height: 20,
    padding: '0 5px',
    boxSizing: 'border-box',
    borderRadius: 10,
    background: '#e74c3c',
    color: '#fff',
    fontSize: 12,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
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
