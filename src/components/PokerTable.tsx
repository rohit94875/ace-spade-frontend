import { sendPokerAction } from '../services/websocket';
import type { Card, PokerAction, PokerTableState } from '../types/game';
import { RANK_DISPLAY, SUIT_SYMBOLS, isRedSuit } from '../types/game';

interface Props {
  roomCode: string;
  playerId: string;
  poker: PokerTableState;
  hand: Card[];
  isMyTurn: boolean;
  paused?: boolean;
}

function MiniCard({ card, small }: { card: Card; small?: boolean }) {
  const red = isRedSuit(card.suit);
  return (
    <div
      style={{
        ...styles.card,
        ...(small ? styles.cardSmall : {}),
        color: red ? '#c0392b' : '#1a1a2e',
      }}
    >
      <span>{RANK_DISPLAY[card.rank]}</span>
      <span>{SUIT_SYMBOLS[card.suit]}</span>
    </div>
  );
}

function CardBack({ small }: { small?: boolean }) {
  return <div style={{ ...styles.card, ...styles.cardBack, ...(small ? styles.cardSmall : {}) }}>🂠</div>;
}

export default function PokerTable({
  roomCode, playerId, poker, hand, isMyTurn, paused,
}: Props) {
  const me = poker.seats.find((s) => s.id === playerId);
  const legal: PokerAction[] = (isMyTurn && !paused
    ? (poker.legalActions ?? me?.legalActions ?? [])
    : []) as PokerAction[];
  const toCall = poker.toCall ?? Math.max(0, poker.currentBet - (me?.betThisStreet ?? 0));

  function act(action: PokerAction) {
    if (!legal.includes(action) || paused) return;
    sendPokerAction(roomCode, action);
  }

  function blindTags(seat: { isDealer?: boolean; isSmallBlind?: boolean; isBigBlind?: boolean }) {
    const tags: string[] = [];
    if (seat.isDealer) tags.push('D');
    if (seat.isSmallBlind) tags.push('SB');
    if (seat.isBigBlind) tags.push('BB');
    return tags;
  }

  const opponents = poker.seats.filter((s) => s.id !== playerId);
  const sbLabel = poker.smallBlindUsername ?? '—';
  const bbLabel = poker.bigBlindUsername ?? '—';

  return (
    <div style={styles.wrap}>
      <div style={styles.meta}>
        <span>Hand #{poker.handNumber}</span>
        <span>{poker.street ?? '—'}</span>
        <span>Pot {poker.pot}</span>
        <span>Blinds {poker.smallBlind}/{poker.bigBlind}</span>
      </div>
      <div style={styles.blindBanner}>
        <span style={styles.sbPill}>SB {sbLabel}</span>
        <span style={styles.bbPill}>BB {bbLabel}</span>
      </div>
      {poker.lastAction && <div style={styles.feed}>{poker.lastAction}</div>}

      <div style={styles.opponents}>
        {opponents.map((seat) => {
          const tags = blindTags(seat);
          return (
          <div
            key={seat.id}
            style={{
              ...styles.seat,
              ...(seat.id === poker.currentTurnPlayerId ? styles.seatTurn : {}),
              ...(seat.folded ? styles.seatFolded : {}),
            }}
          >
            <div style={styles.seatName}>
              {tags.length > 0 && (
                <span style={styles.tagRow}>
                  {tags.map((t) => (
                    <span
                      key={t}
                      style={{
                        ...styles.roleTag,
                        ...(t === 'SB' ? styles.sbTag : {}),
                        ...(t === 'BB' ? styles.bbTag : {}),
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </span>
              )}
              {seat.username}
              {seat.allIn ? ' · ALL-IN' : ''}
            </div>
            <div style={styles.chips}>{seat.chips} chips</div>
            {seat.betThisStreet > 0 && <div style={styles.bet}>Bet {seat.betThisStreet}</div>}
            <div style={styles.holeRow}>
              {seat.holeCards?.length
                ? seat.holeCards.map((c, i) => <MiniCard key={i} card={c} small />)
                : Array.from({ length: seat.holeCardCount ?? 2 }).map((_, i) => (
                  <CardBack key={i} small />
                ))}
            </div>
          </div>
          );
        })}
      </div>

      <div style={styles.board}>
        {(poker.communityCards ?? []).length === 0 ? (
          <div style={styles.boardEmpty}>Waiting for flop…</div>
        ) : (
          poker.communityCards.map((c, i) => <MiniCard key={i} card={c} />)
        )}
      </div>

      <div style={styles.hero}>
        <div style={styles.seatName}>
          {blindTags(me ?? {}).length > 0 && (
            <span style={styles.tagRow}>
              {blindTags(me ?? {}).map((t) => (
                <span
                  key={t}
                  style={{
                    ...styles.roleTag,
                    ...(t === 'SB' ? styles.sbTag : {}),
                    ...(t === 'BB' ? styles.bbTag : {}),
                  }}
                >
                  {t}
                </span>
              ))}
            </span>
          )}
          You · {me?.chips ?? 0} chips
          {me?.folded ? ' · Folded' : ''}
          {me?.allIn ? ' · ALL-IN' : ''}
        </div>
        {me && me.betThisStreet > 0 && <div style={styles.bet}>Bet {me.betThisStreet}</div>}
        <div style={styles.holeRow}>
          {(hand.length ? hand : me?.holeCards ?? []).map((c, i) => (
            <MiniCard key={i} card={c} />
          ))}
        </div>
      </div>

      <div style={styles.actions}>
        {isMyTurn && !paused ? (
          <>
            {toCall > 0 && <span style={styles.toCall}>To call: {toCall}</span>}
            {(['FOLD', 'CHECK', 'CALL', 'BET', 'RAISE'] as PokerAction[]).map((a) => (
              <button
                key={a}
                type="button"
                disabled={!legal.includes(a)}
                style={{
                  ...styles.btn,
                  ...(!legal.includes(a) ? styles.btnDisabled : {}),
                  ...(a === 'FOLD' ? styles.btnFold : {}),
                  ...(a === 'BET' || a === 'RAISE' ? styles.btnRaise : {}),
                }}
                onClick={() => act(a)}
              >
                {a === 'BET' || a === 'RAISE' ? `${a} ${poker.betUnit}` : a}
              </button>
            ))}
          </>
        ) : (
          <span style={styles.wait}>
            {paused ? 'Paused' : me?.folded ? 'You folded' : 'Waiting for other players…'}
          </span>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    padding: '8px 12px 16px',
    minHeight: 0,
  },
  meta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: 600,
  },
  blindBanner: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  sbPill: {
    fontSize: 12,
    fontWeight: 700,
    padding: '4px 10px',
    borderRadius: 999,
    background: 'rgba(52, 152, 219, 0.25)',
    color: '#5dade2',
    border: '1px solid rgba(52,152,219,0.45)',
  },
  bbPill: {
    fontSize: 12,
    fontWeight: 700,
    padding: '4px 10px',
    borderRadius: 999,
    background: 'rgba(241, 196, 15, 0.2)',
    color: '#f1c40f',
    border: '1px solid rgba(241,196,15,0.45)',
  },
  tagRow: { display: 'inline-flex', gap: 4, marginRight: 6, verticalAlign: 'middle' },
  roleTag: {
    display: 'inline-block',
    fontSize: 10,
    fontWeight: 800,
    padding: '1px 5px',
    borderRadius: 4,
    background: 'rgba(255,255,255,0.15)',
    color: '#fff',
  },
  sbTag: { background: 'rgba(52,152,219,0.35)', color: '#5dade2' },
  bbTag: { background: 'rgba(241,196,15,0.35)', color: '#f1c40f' },
  feed: {
    fontSize: 13,
    color: '#74c69d',
    fontWeight: 600,
  },
  opponents: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  seat: {
    minWidth: 110,
    padding: 10,
    borderRadius: 12,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    textAlign: 'center',
  },
  seatTurn: {
    borderColor: '#74c69d',
    boxShadow: '0 0 0 1px #74c69d',
  },
  seatFolded: { opacity: 0.45 },
  seatName: { fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 4 },
  chips: { fontSize: 12, color: 'rgba(255,255,255,0.65)' },
  bet: { fontSize: 11, color: '#f1c40f', marginTop: 2 },
  holeRow: { display: 'flex', gap: 4, justifyContent: 'center', marginTop: 8 },
  board: {
    display: 'flex',
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 72,
    padding: 12,
    borderRadius: 16,
    background: 'radial-gradient(ellipse at center, #1b4332 0%, #081c15 70%)',
    border: '1px solid rgba(116,198,157,0.25)',
  },
  boardEmpty: { color: 'rgba(255,255,255,0.35)', fontSize: 13 },
  hero: {
    textAlign: 'center',
    padding: 12,
    borderRadius: 12,
    background: 'rgba(116,198,157,0.08)',
    border: '1px solid rgba(116,198,157,0.2)',
  },
  card: {
    width: 44,
    height: 62,
    borderRadius: 6,
    background: '#fff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: 14,
    boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
  },
  cardSmall: { width: 32, height: 44, fontSize: 11 },
  cardBack: {
    background: 'linear-gradient(135deg, #1d3557, #457b9d)',
    color: '#fff',
    fontSize: 18,
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 48,
  },
  toCall: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginRight: 4 },
  btn: {
    padding: '10px 14px',
    borderRadius: 10,
    border: 'none',
    background: '#2d6a4f',
    color: '#fff',
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
  },
  btnDisabled: { opacity: 0.35, cursor: 'not-allowed' },
  btnFold: { background: '#6c757d' },
  btnRaise: { background: '#c1121f' },
  wait: { fontSize: 13, color: 'rgba(255,255,255,0.45)' },
};
