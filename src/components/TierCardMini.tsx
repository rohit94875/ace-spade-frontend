import { isLightTierColor } from '../constants/tiers';

interface Props {
  color: string;
  width?: number;
  height?: number;
}

/** Mini in-game card preview: white face + tier glow, optional back swatch. */
export default function TierCardMini({ color, width = 36, height = 50 }: Props) {
  const ink = isLightTierColor(color) ? '#1a1a2e' : '#f0f0f0';
  const glow = `0 3px 8px rgba(0,0,0,0.35), 0 0 10px color-mix(in srgb, ${color} 55%, transparent)`;
  const backBg = `linear-gradient(145deg, color-mix(in srgb, ${color} 62%, #1a2a4a), color-mix(in srgb, ${color} 38%, #0f1f3a))`;
  const backBorder = `1px solid color-mix(in srgb, ${color} 72%, #2a5aae)`;
  const backGlow = `0 2px 6px rgba(0,0,0,0.35), 0 0 8px color-mix(in srgb, ${color} 45%, transparent)`;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div
        title="Face up — white card + tier glow"
        style={{
          width,
          height,
          borderRadius: 5,
          position: 'relative',
          flexShrink: 0,
          background: '#fff',
          boxShadow: glow,
          overflow: 'hidden',
        }}
      >
        <span style={{
          position: 'absolute', top: 4, left: 5, fontSize: 7, fontWeight: 800, lineHeight: 1, color: ink,
        }}>
          A<br />♠
        </span>
        <span style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          fontSize: 12, color: ink,
        }}>
          ♠
        </span>
      </div>
      <div
        title="Face down — tier-tinted back"
        style={{
          width: width * 0.85,
          height: height * 0.85,
          borderRadius: 4,
          flexShrink: 0,
          background: backBg,
          border: backBorder,
          boxShadow: backGlow,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10,
          color: 'rgba(255,255,255,0.35)',
        }}
      >
        ♠
      </div>
    </div>
  );
}
