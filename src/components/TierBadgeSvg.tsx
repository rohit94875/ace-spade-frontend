import { tierColor, tierDivision, tierFamily, type TierFamily } from '../constants/tiers';

interface SvgProps {
  tier: string | null | undefined;
  placing?: boolean;
  size: number;
}

function darken(hex: string, pct: number): string {
  const n = hex.replace('#', '');
  const r = Math.max(0, parseInt(n.slice(0, 2), 16) * (1 - pct));
  const g = Math.max(0, parseInt(n.slice(2, 4), 16) * (1 - pct));
  const b = Math.max(0, parseInt(n.slice(4, 6), 16) * (1 - pct));
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}

function lighten(hex: string, pct: number): string {
  const n = hex.replace('#', '');
  const r = Math.min(255, parseInt(n.slice(0, 2), 16) + 255 * pct);
  const g = Math.min(255, parseInt(n.slice(2, 4), 16) + 255 * pct);
  const b = Math.min(255, parseInt(n.slice(4, 6), 16) + 255 * pct);
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}

function CenterIcon({ family, eliteTier }: { family: TierFamily; eliteTier?: string }) {
  if (family === 'unranked') {
    return <path d="M24 16 L28 24 L24 32 L20 24 Z" fill="rgba(255,255,255,0.35)" />;
  }
  if (family === 'elite') {
    if (eliteTier === 'Challenger') {
      return (
        <>
          <path d="M24 14 L27 22 L35 22 L28 27 L31 35 L24 30 L17 35 L20 27 L13 22 L21 22 Z" fill="rgba(255,255,255,0.9)" />
        </>
      );
    }
    if (eliteTier === 'ACE KING') {
      return <text x="24" y="28" textAnchor="middle" fontSize="14" fontWeight="900" fill="rgba(255,255,255,0.95)">♠</text>;
    }
    return <path d="M24 13 L30 19 L28 29 L24 26 L20 29 L18 19 Z" fill="rgba(255,255,255,0.9)" />;
  }
  // Spade mark — Ace Spade identity on all ranked tiers
  return (
    <path
      d="M24 14 C20 18 16 20 16 24 C16 27 18 29 21 29 C22.5 29 23.5 28.5 24 27.5 C24.5 28.5 25.5 29 27 29 C30 29 32 27 32 24 C32 20 28 18 24 14 Z M24 30 L22 34 L26 34 Z"
      fill="rgba(0,0,0,0.55)"
    />
  );
}

function DivisionWings({ division, color }: { division: number | null; color: string }) {
  if (!division) return null;
  const chevrons = division === 3 ? [18, 24, 30] : division === 2 ? [21, 27] : [24];
  return (
    <g fill={lighten(color, 0.35)} opacity={0.9}>
      {chevrons.map((cx) => (
        <path key={cx} d={`M${cx} 36 L${cx + 3} 40 L${cx - 3} 40 Z`} />
      ))}
    </g>
  );
}

export default function TierBadgeSvg({ tier, placing, size }: SvgProps) {
  const color = placing ? '#5c6b7a' : tierColor(tier);
  const family = placing ? 'unranked' as TierFamily : tierFamily(tier);
  const division = placing ? null : tierDivision(tier);
  const id = `tg-${(tier ?? 'placing').replace(/\s/g, '')}-${size}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      aria-hidden
      style={{ display: 'block', flexShrink: 0 }}
    >
      <defs>
        <linearGradient id={`${id}-face`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={lighten(color, 0.22)} />
          <stop offset="45%" stopColor={color} />
          <stop offset="100%" stopColor={darken(color, 0.28)} />
        </linearGradient>
        <linearGradient id={`${id}-rim`} x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.45)" />
        </linearGradient>
        <filter id={`${id}-glow`} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor={color} floodOpacity="0.65" />
        </filter>
      </defs>

      {/* Valorant-style angular shield */}
      <path
        d="M24 3 L42 11 L42 30 L24 45 L6 30 L6 11 Z"
        fill={`url(#${id}-face)`}
        stroke={`url(#${id}-rim)`}
        strokeWidth="1.5"
        filter={placing ? undefined : `url(#${id}-glow)`}
        opacity={placing ? 0.55 : 1}
      />

      {/* Inner facet lines */}
      <path
        d="M24 8 L37 14 L37 28 L24 38 L11 28 L11 14 Z"
        fill="none"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="0.75"
      />

      {placing ? (
        <>
          <path d="M14 18 L34 30" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
          <path d="M34 18 L14 30" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
          <text x="24" y="27" textAnchor="middle" fontSize="9" fontWeight="800" fill="rgba(255,255,255,0.7)">?</text>
        </>
      ) : (
        <>
          <CenterIcon family={family} eliteTier={tier ?? undefined} />
          <DivisionWings division={division} color={color} />
        </>
      )}

      {/* Side wings — Valorant chevrons */}
      {!placing && family !== 'unranked' && (
        <g stroke={lighten(color, 0.2)} strokeWidth="1.2" fill="none" opacity="0.7">
          <path d="M6 18 L2 22 L6 26" />
          <path d="M42 18 L46 22 L42 26" />
        </g>
      )}
    </svg>
  );
}
