import type { RewardSymbolType } from '../types/season';

interface Props {
  symbol: RewardSymbolType;
  size?: number;
}

export default function AwardIcon({ symbol, size = 48 }: Props) {
  const style: React.CSSProperties = {
    width: size,
    height: size,
    display: 'block',
    filter: FILTER[symbol],
  };

  switch (symbol) {
    case 'TOP_MMR':
      return (
        <svg viewBox="0 0 64 64" fill="none" style={style} aria-hidden>
          <path d="M8 44 L14 22 L24 32 L32 14 L40 32 L50 22 L56 44 Z" fill="#f1c40f" stroke="#b8860b" strokeWidth="2" />
          <rect x="10" y="44" width="44" height="8" rx="2" fill="#d4a017" />
          <circle cx="32" cy="12" r="3" fill="#fff9e6" />
        </svg>
      );
    case 'MOST_MATCHES':
      return (
        <svg viewBox="0 0 64 64" fill="none" style={style} aria-hidden>
          <circle cx="32" cy="32" r="26" stroke="#74c69d" strokeWidth="3" fill="rgba(116,198,157,0.15)" />
          <circle cx="32" cy="32" r="18" stroke="#74c69d" strokeWidth="2.5" fill="none" />
          <circle cx="32" cy="32" r="10" fill="#74c69d" />
        </svg>
      );
    case 'MOST_WINS':
      return (
        <svg viewBox="0 0 64 64" fill="none" style={style} aria-hidden>
          <path d="M20 18 H44 V28 C44 36 38 42 32 42 C26 42 20 36 20 28 Z" fill="#f1c40f" stroke="#b8860b" strokeWidth="2" />
          <path d="M12 20 H18 V26 C18 30 14 32 12 32" stroke="#d4a017" strokeWidth="2.5" fill="none" />
          <path d="M52 20 H46 V26 C46 30 50 32 52 32" stroke="#d4a017" strokeWidth="2.5" fill="none" />
          <rect x="26" y="42" width="12" height="6" fill="#b8860b" />
          <rect x="22" y="48" width="20" height="5" rx="1" fill="#d4a017" />
        </svg>
      );
    case 'MOST_LOSSES':
      return (
        <svg viewBox="0 0 64 64" fill="none" style={style} aria-hidden>
          <circle cx="32" cy="30" r="20" fill="#4a4a4a" stroke="#888" strokeWidth="2" />
          <path d="M22 38 L32 48 L42 38" stroke="#888" strokeWidth="3" fill="none" />
          <path d="M26 22 L38 38" stroke="#aaa" strokeWidth="2" />
          <path d="M38 22 L26 38" stroke="#aaa" strokeWidth="2" />
        </svg>
      );
    case 'WIN_STREAK':
      return (
        <svg viewBox="0 0 64 64" fill="none" style={style} aria-hidden>
          <path d="M32 54 C20 44 14 34 18 24 C22 16 28 20 32 12 C36 20 42 16 46 24 C50 34 44 44 32 54 Z" fill="#e67e22" />
          <path d="M32 48 C26 40 24 32 28 26 C30 22 32 28 32 22 C32 28 34 22 36 26 C40 32 38 40 32 48 Z" fill="#f39c12" />
        </svg>
      );
    case 'LOSS_STREAK':
      return (
        <svg viewBox="0 0 64 64" fill="none" style={style} aria-hidden>
          <path d="M32 8 L32 56 M32 8 L20 20 M32 8 L44 20 M32 56 L20 44 M32 56 L44 44 M14 32 L50 32 M18 18 L46 46 M46 18 L18 46" stroke="#85c1e9" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="32" cy="32" r="6" fill="#aed6f1" />
        </svg>
      );
    case 'BID_MASTER':
      return (
        <svg viewBox="0 0 64 64" fill="none" style={style} aria-hidden>
          <circle cx="32" cy="32" r="26" stroke="#a29bfe" strokeWidth="2" fill="rgba(162,155,254,0.1)" />
          <circle cx="32" cy="32" r="16" stroke="#a29bfe" strokeWidth="2" fill="none" />
          <circle cx="32" cy="32" r="6" fill="#6c5ce7" />
          <path d="M32 6 L32 14 M32 50 L32 58 M6 32 L14 32 M50 32 L58 32" stroke="#a29bfe" strokeWidth="2" />
        </svg>
      );
    case 'FINISHER':
      return (
        <svg viewBox="0 0 64 64" fill="none" style={style} aria-hidden>
          <path d="M32 6 L52 16 V32 C52 44 42 52 32 58 C22 52 12 44 12 32 V16 Z" fill="#2ecc71" stroke="#27ae60" strokeWidth="2" />
          <path d="M22 32 L28 38 L42 24" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null;
  }
}

const FILTER: Partial<Record<RewardSymbolType, string>> = {
  TOP_MMR: 'drop-shadow(0 2px 6px rgba(241, 196, 15, 0.4))',
  MOST_MATCHES: 'drop-shadow(0 2px 6px rgba(116, 198, 157, 0.35))',
  MOST_WINS: 'drop-shadow(0 2px 6px rgba(241, 196, 15, 0.35))',
  MOST_LOSSES: 'drop-shadow(0 2px 6px rgba(150, 150, 150, 0.3))',
  WIN_STREAK: 'drop-shadow(0 2px 6px rgba(230, 126, 34, 0.45))',
  LOSS_STREAK: 'drop-shadow(0 2px 6px rgba(133, 193, 233, 0.4))',
  BID_MASTER: 'drop-shadow(0 2px 6px rgba(162, 155, 254, 0.4))',
  FINISHER: 'drop-shadow(0 2px 6px rgba(46, 204, 113, 0.35))',
};
