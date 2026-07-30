import { isLightTierColor } from '../constants/tiers';

interface Props {
  color: string;
  width?: number;
  height?: number;
}

/** Mini tier-colored playing card for rank catalog previews. */
export default function TierCardMini({ color, width = 36, height = 50 }: Props) {
  const light = isLightTierColor(color);
  const suitColor = light ? '#1a1a2e' : '#f5f5f5';
  const h = height;
  const w = width;

  return (
    <div
      title={`${color} card face`}
      style={{
        width: w,
        height: h,
        borderRadius: 5,
        position: 'relative',
        flexShrink: 0,
        background: color,
        border: `1px solid color-mix(in srgb, ${color} 65%, black)`,
        boxShadow: `0 4px 10px rgba(0,0,0,0.35), 0 0 8px color-mix(in srgb, ${color} 40%, transparent)`,
        overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(155deg, color-mix(in srgb, white 24%, ${color}), ${color}, color-mix(in srgb, black 14%, ${color}))`,
      }} />
      <div style={{
        position: 'absolute',
        inset: 4,
        borderRadius: 3,
        border: `1px solid color-mix(in srgb, ${color} 50%, black)`,
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.12)',
        pointerEvents: 'none',
      }} />
      <span style={{
        position: 'absolute',
        top: 4,
        left: 5,
        fontSize: 8,
        fontWeight: 800,
        lineHeight: 1,
        color: suitColor,
        zIndex: 1,
      }}>
        A<br />♠
      </span>
      <span style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        fontSize: 14,
        color: suitColor,
        zIndex: 1,
        filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.2))',
      }}>
        ♠
      </span>
    </div>
  );
}
