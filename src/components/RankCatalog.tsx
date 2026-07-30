import { useMemo, useState } from 'react';
import {
  TIER_CATALOG,
  tierCatalogIndex,
  tierColor,
  type TierFamily,
} from '../constants/tiers';
import TierBadge from './TierBadge';
import TierCardMini from './TierCardMini';

interface Props {
  currentTier: string | null | undefined;
  placementComplete: boolean;
}

const FAMILY_ORDER: TierFamily[] = [
  'unranked', 'sand', 'bronze', 'silver', 'gold', 'platinum', 'diamond', 'elite',
];

const FAMILY_LABELS: Record<TierFamily, string> = {
  unranked: 'Unranked',
  sand: 'Sand',
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum',
  diamond: 'Diamond',
  elite: 'Elite',
};

export default function RankCatalog({ currentTier, placementComplete }: Props) {
  const [expandedFamily, setExpandedFamily] = useState<TierFamily | 'all'>('all');
  const currentIdx = tierCatalogIndex(currentTier);

  const grouped = useMemo(() => {
    const map = new Map<TierFamily, typeof TIER_CATALOG>();
    for (const f of FAMILY_ORDER) {
      map.set(f, TIER_CATALOG.filter((t) => t.family === f));
    }
    return map;
  }, []);

  const families = expandedFamily === 'all'
    ? FAMILY_ORDER
    : [expandedFamily];

  return (
    <section style={styles.section}>
      <div style={styles.sectionHead}>
        <div>
          <h2 style={styles.title}>Rank collection</h2>
          <p style={styles.sub}>
            Every tier unlocks a unique card color in all games. Climb MMR to earn new faces.
          </p>
        </div>
      </div>

      <div style={styles.familyTabs}>
        <button
          type="button"
          style={{ ...styles.tab, ...(expandedFamily === 'all' ? styles.tabOn : {}) }}
          onClick={() => setExpandedFamily('all')}
        >
          All ranks
        </button>
        {FAMILY_ORDER.filter((f) => f !== 'unranked').map((f) => (
          <button
            key={f}
            type="button"
            style={{ ...styles.tab, ...(expandedFamily === f ? styles.tabOn : {}) }}
            onClick={() => setExpandedFamily(f)}
          >
            {FAMILY_LABELS[f]}
          </button>
        ))}
      </div>

      {families.map((family) => {
        const tiers = grouped.get(family) ?? [];
        if (tiers.length === 0) return null;
        return (
          <div key={family} style={styles.familyBlock}>
            {expandedFamily === 'all' && (
              <h3 style={styles.familyTitle}>{FAMILY_LABELS[family]}</h3>
            )}
            <div style={styles.grid}>
              {tiers.map((t) => {
                const globalIdx = TIER_CATALOG.findIndex((x) => x.name === t.name);
                const isCurrent = placementComplete && currentTier === t.name;
                const isUnlocked = placementComplete && currentIdx >= globalIdx && globalIdx >= 0;
                const isFuture = placementComplete && currentIdx >= 0 && globalIdx > currentIdx;

                return (
                  <article
                    key={t.name}
                    style={{
                      ...styles.rankCard,
                      ...(isCurrent ? styles.rankCardCurrent : {}),
                      ...(isFuture ? styles.rankCardFuture : {}),
                    }}
                  >
                    {isCurrent && <span style={styles.currentTag}>Your rank</span>}
                    <div style={styles.rankTop}>
                      <TierBadge tier={t.name} size="md" dimmed={!isUnlocked && !isCurrent} />
                      <div style={styles.rankMeta}>
                        <span style={{ ...styles.rankName, color: tierColor(t.name) }}>{t.name}</span>
                        <span style={styles.rankMmr}>MMR {t.mmr}</span>
                      </div>
                    </div>
                    <div style={styles.cardPreview}>
                      <TierCardMini color={t.color} />
                      <span style={styles.cardHint}>Card face color</span>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        );
      })}

      {!placementComplete && (
        <p style={styles.placingNote}>
          Finish placement games to reveal your rank badge and unlock your tier in the collection.
        </p>
      )}
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  section: {
    marginTop: 8,
    marginBottom: 20,
    paddingTop: 16,
    borderTop: '1px solid rgba(255,255,255,0.08)',
  },
  sectionHead: { marginBottom: 14 },
  title: { margin: '0 0 6px', fontSize: 17, fontWeight: 800, color: '#fff' },
  sub: { margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 },
  familyTabs: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  tab: {
    padding: '5px 10px',
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(0,0,0,0.2)',
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontWeight: 700,
    cursor: 'pointer',
  },
  tabOn: {
    background: 'rgba(116,198,157,0.15)',
    borderColor: 'rgba(116,198,157,0.4)',
    color: '#74c69d',
  },
  familyBlock: { marginBottom: 18 },
  familyTitle: {
    margin: '0 0 10px',
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.35)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))',
    gap: 10,
  },
  rankCard: {
    background: 'rgba(0,0,0,0.28)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: '12px 12px 10px',
    position: 'relative',
  },
  rankCardCurrent: {
    borderColor: 'rgba(116,198,157,0.55)',
    boxShadow: '0 0 20px rgba(116,198,157,0.12)',
    background: 'rgba(116,198,157,0.06)',
  },
  rankCardFuture: {
    opacity: 0.72,
  },
  currentTag: {
    position: 'absolute',
    top: 8,
    right: 8,
    fontSize: 8,
    fontWeight: 800,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: '#74c69d',
    background: 'rgba(116,198,157,0.15)',
    padding: '2px 6px',
    borderRadius: 4,
  },
  rankTop: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  rankMeta: { display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 },
  rankName: { fontSize: 12, fontWeight: 800, lineHeight: 1.2 },
  rankMmr: { fontSize: 9, fontFamily: 'ui-monospace, monospace', color: 'rgba(255,255,255,0.4)' },
  cardPreview: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    paddingTop: 8,
    borderTop: '1px solid rgba(255,255,255,0.06)',
  },
  cardHint: { fontSize: 9, color: 'rgba(255,255,255,0.35)', fontWeight: 600 },
  placingNote: {
    fontSize: 12,
    color: '#f1c40f',
    margin: '12px 0 0',
    lineHeight: 1.45,
  },
};
