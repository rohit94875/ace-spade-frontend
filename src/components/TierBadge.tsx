import TierBadgeSvg from './TierBadgeSvg';
import { tierColor } from '../constants/tiers';

export type TierBadgeSize = 'sm' | 'md' | 'lg' | 'xl';

interface Props {
  tier: string | null | undefined;
  placing?: boolean;
  placementGames?: number;
  placementRequired?: number;
  size?: TierBadgeSize;
  showLabel?: boolean;
  title?: string;
  dimmed?: boolean;
}

const PX: Record<TierBadgeSize, number> = {
  sm: 22,
  md: 30,
  lg: 56,
  xl: 72,
};

const FONT: Record<TierBadgeSize, number> = {
  sm: 10,
  md: 11,
  lg: 14,
  xl: 15,
};

export default function TierBadge({
  tier,
  placing = false,
  placementGames,
  placementRequired,
  size = 'md',
  showLabel = false,
  title,
  dimmed = false,
}: Props) {
  const px = PX[size];
  const color = tier ? tierColor(tier) : '#5c6b7a';
  const showPlacing = placing && !tier;
  const label = tier
    ?? (showPlacing && placementRequired != null && placementGames != null
      ? `Placing ${placementGames}/${placementRequired}`
      : showPlacing ? 'Placing' : null);

  if (!tier && !showPlacing && !showLabel) return null;

  const tooltip = title ?? label ?? tier ?? 'Rank';

  return (
    <span
      title={tooltip}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: size === 'sm' ? 5 : 8,
        flexShrink: 0,
        opacity: dimmed ? 0.38 : 1,
        filter: dimmed ? 'grayscale(0.35)' : undefined,
        transition: 'opacity 0.2s ease',
      }}
    >
      <TierBadgeSvg tier={tier} placing={showPlacing} size={px} />
      {showLabel && label && (
        <span style={{
          fontSize: FONT[size],
          fontWeight: 800,
          color,
          whiteSpace: 'nowrap',
          letterSpacing: 0.3,
          textTransform: size === 'sm' ? 'none' : 'uppercase',
        }}>
          {label}
        </span>
      )}
    </span>
  );
}
