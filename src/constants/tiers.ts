export const TIER_COLORS: Record<string, string> = {
  "Please Don't Play": '#616161',
  'Sand 3': '#E8D5B7',
  'Sand 2': '#DCC29A',
  'Sand 1': '#D2B48C',
  'Bronze 3': '#D89A5B',
  'Bronze 2': '#D18444',
  'Bronze 1': '#CD7F32',
  'Silver 3': '#ECECEC',
  'Silver 2': '#A8A8A8',
  'Silver 1': '#787878',
  'Gold 3': '#F8DB72',
  'Gold 2': '#F4CF3D',
  'Gold 1': '#F1C40F',
  'Platinum 3': '#C5F7F7',
  'Platinum 2': '#A4F1F1',
  'Platinum 1': '#81ECEC',
  'Diamond 3': '#CCC7FF',
  'Diamond 2': '#B6B0FF',
  'Diamond 1': '#A29BFE',
  Master: '#8E44AD',
  'ACE KING': '#E74C3C',
};

export type TierFamily =
  | 'unranked' | 'sand' | 'bronze' | 'silver' | 'gold'
  | 'platinum' | 'diamond' | 'elite';

export interface TierCatalogEntry {
  name: string;
  family: TierFamily;
  familyLabel: string;
  color: string;
  mmr: string;
  division: number | null;
}

export const TIER_CATALOG: TierCatalogEntry[] = [
  { name: "Please Don't Play", family: 'unranked', familyLabel: 'Unranked', color: '#616161', mmr: '< 1050', division: null },
  { name: 'Sand 3', family: 'sand', familyLabel: 'Sand', color: '#E8D5B7', mmr: '1050 – 1099', division: 3 },
  { name: 'Sand 2', family: 'sand', familyLabel: 'Sand', color: '#DCC29A', mmr: '1100 – 1149', division: 2 },
  { name: 'Sand 1', family: 'sand', familyLabel: 'Sand', color: '#D2B48C', mmr: '1150 – 1199', division: 1 },
  { name: 'Bronze 3', family: 'bronze', familyLabel: 'Bronze', color: '#D89A5B', mmr: '1200 – 1249', division: 3 },
  { name: 'Bronze 2', family: 'bronze', familyLabel: 'Bronze', color: '#D18444', mmr: '1250 – 1299', division: 2 },
  { name: 'Bronze 1', family: 'bronze', familyLabel: 'Bronze', color: '#CD7F32', mmr: '1300 – 1349', division: 1 },
  { name: 'Silver 3', family: 'silver', familyLabel: 'Silver', color: '#ECECEC', mmr: '1350 – 1399', division: 3 },
  { name: 'Silver 2', family: 'silver', familyLabel: 'Silver', color: '#A8A8A8', mmr: '1400 – 1449', division: 2 },
  { name: 'Silver 1', family: 'silver', familyLabel: 'Silver', color: '#787878', mmr: '1450 – 1499', division: 1 },
  { name: 'Gold 3', family: 'gold', familyLabel: 'Gold', color: '#F8DB72', mmr: '1500 – 1549', division: 3 },
  { name: 'Gold 2', family: 'gold', familyLabel: 'Gold', color: '#F4CF3D', mmr: '1550 – 1599', division: 2 },
  { name: 'Gold 1', family: 'gold', familyLabel: 'Gold', color: '#F1C40F', mmr: '1600 – 1649', division: 1 },
  { name: 'Platinum 3', family: 'platinum', familyLabel: 'Platinum', color: '#C5F7F7', mmr: '1650 – 1699', division: 3 },
  { name: 'Platinum 2', family: 'platinum', familyLabel: 'Platinum', color: '#A4F1F1', mmr: '1700 – 1749', division: 2 },
  { name: 'Platinum 1', family: 'platinum', familyLabel: 'Platinum', color: '#81ECEC', mmr: '1750 – 1799', division: 1 },
  { name: 'Diamond 3', family: 'diamond', familyLabel: 'Diamond', color: '#CCC7FF', mmr: '1800 – 1849', division: 3 },
  { name: 'Diamond 2', family: 'diamond', familyLabel: 'Diamond', color: '#B6B0FF', mmr: '1850 – 1899', division: 2 },
  { name: 'Diamond 1', family: 'diamond', familyLabel: 'Diamond', color: '#A29BFE', mmr: '1900 – 1949', division: 1 },
  { name: 'Master', family: 'elite', familyLabel: 'Elite', color: '#8E44AD', mmr: '1950 – 1974', division: null },
  { name: 'ACE KING', family: 'elite', familyLabel: 'Elite', color: '#E74C3C', mmr: '1975+', division: null },
];

export function tierForMmr(mmr: number): string {
  if (mmr < 1050) return "Please Don't Play";
  if (mmr < 1100) return 'Sand 3';
  if (mmr < 1150) return 'Sand 2';
  if (mmr < 1200) return 'Sand 1';
  if (mmr < 1250) return 'Bronze 3';
  if (mmr < 1300) return 'Bronze 2';
  if (mmr < 1350) return 'Bronze 1';
  if (mmr < 1400) return 'Silver 3';
  if (mmr < 1450) return 'Silver 2';
  if (mmr < 1500) return 'Silver 1';
  if (mmr < 1550) return 'Gold 3';
  if (mmr < 1600) return 'Gold 2';
  if (mmr < 1650) return 'Gold 1';
  if (mmr < 1700) return 'Platinum 3';
  if (mmr < 1750) return 'Platinum 2';
  if (mmr < 1800) return 'Platinum 1';
  if (mmr < 1850) return 'Diamond 3';
  if (mmr < 1900) return 'Diamond 2';
  if (mmr < 1950) return 'Diamond 1';
  if (mmr < 1975) return 'Master';
  return 'ACE KING';
}

export function tierColor(tier: string | null | undefined): string {
  if (!tier) return '#4a5568';
  return TIER_COLORS[tier] ?? '#4a5568';
}

export function tierFamily(tier: string | null | undefined): TierFamily {
  if (!tier) return 'unranked';
  if (tier === "Please Don't Play") return 'unranked';
  if (tier.startsWith('Sand')) return 'sand';
  if (tier.startsWith('Bronze')) return 'bronze';
  if (tier.startsWith('Silver')) return 'silver';
  if (tier.startsWith('Gold')) return 'gold';
  if (tier.startsWith('Platinum')) return 'platinum';
  if (tier.startsWith('Diamond')) return 'diamond';
  return 'elite';
}

export function tierDivision(tier: string | null | undefined): number | null {
  if (!tier) return null;
  if (tier.endsWith(' 3')) return 3;
  if (tier.endsWith(' 2')) return 2;
  if (tier.endsWith(' 1')) return 1;
  return null;
}

export function tierCatalogIndex(tier: string | null | undefined): number {
  if (!tier) return -1;
  return TIER_CATALOG.findIndex((t) => t.name === tier);
}

/** @deprecated use TierBadge SVG — kept for any text fallbacks */
export function tierEmblem(tier: string | null | undefined): string {
  if (!tier) return '?';
  const f = tierFamily(tier);
  if (f === 'elite') return tier === 'ACE KING' ? '♠' : '★';
  return '♠';
}

export function isLightTierColor(color: string): boolean {
  const light = new Set(TIER_CATALOG.filter((t) => t.family !== 'elite' && t.family !== 'unranked').map((t) => t.color));
  return light.has(color);
}

/** Tier color for card glow / back tint; null = default styling. */
export function tierCardFaceColor(tier: string | null | undefined): string | null {
  if (!tier) return null;
  return tierColor(tier);
}

export function tierCardGlow(
  tierColorHex: string | null | undefined,
  selected = false,
  hover = false,
): string {
  if (selected) return '0 0 12px #f1c40f88';
  const depth = hover ? '0 8px 20px rgba(0,0,0,0.5)' : '0 3px 10px rgba(0,0,0,0.4)';
  if (!tierColorHex) return depth;
  const glow = hover ? 18 : 14;
  const spread = hover ? 6 : 4;
  return `${depth}, 0 0 ${glow}px color-mix(in srgb, ${tierColorHex} 55%, transparent), 0 0 ${spread}px color-mix(in srgb, ${tierColorHex} 35%, transparent)`;
}

export function tierCardBackStyle(tierColorHex: string | null | undefined): {
  background: string;
  border: string;
  boxShadow: string;
} {
  if (!tierColorHex) {
    return {
      background: 'linear-gradient(135deg, #1e4a8a, #1a3a6e)',
      border: '2px solid #2a5aae',
      boxShadow: '0 3px 10px rgba(0,0,0,0.4)',
    };
  }
  return {
    background: `linear-gradient(145deg, color-mix(in srgb, ${tierColorHex} 62%, #1a2a4a), color-mix(in srgb, ${tierColorHex} 38%, #0f1f3a))`,
    border: `2px solid color-mix(in srgb, ${tierColorHex} 72%, #2a5aae)`,
    boxShadow: `0 3px 10px rgba(0,0,0,0.4), 0 0 14px color-mix(in srgb, ${tierColorHex} 50%, transparent)`,
  };
}
