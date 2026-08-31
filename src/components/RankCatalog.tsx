import { useMemo, useState } from 'react';
import {
  TIER_CATALOG,
  tierCatalogIndex,
  tierColor,
  type TierFamily,
} from '../constants/tiers';
import TierBadge from './TierBadge';

interface Props {
  currentTier: string | null | undefined;
  placementComplete: boolean;
  /** When false (viewing another player), use neutral labels. */
  viewingOwnProfile?: boolean;
  /** Hide title blurb when embedded in RankCollectionPage hero. */
  hideHeader?: boolean;
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

export default function RankCatalog({
  currentTier,
  placementComplete,
  viewingOwnProfile = true,
  hideHeader = false,
}: Props) {
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
      {!hideHeader && (
        <div style={styles.sectionHead}>
          <h2 style={styles.title}>Rank collection</h2>
          <p style={styles.sub}>
            All tier badges. Card backs and glow match your rank in every game.
            {viewingOwnProfile ? ' Climb MMR to unlock higher tiers.' : ''}
          </p>
        </div>
      )}

      <div style={styles.familyTabs}>
        <button
          type="button"
          style={{ ...styles.tab, ...(expandedFamily === 'all' ? styles.tabOn : {}) }}
          onClick={() => setExpandedFamily('all')}
        >
          All
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
                    {isCurrent && (
                      <span style={styles.currentTag}>
                        {viewingOwnProfile ? 'Yours' : 'Current'}
                      </span>
                    )}
                    <TierBadge tier={t.name} size="sm" dimmed={!isUnlocked && !isCurrent} />
                    <div style={styles.rankMeta}>
                      <span style={{ ...styles.rankName, color: tierColor(t.name) }}>{t.name}</span>
                      <span style={styles.rankMmr}>{t.mmr}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        );
      })}

      {!placementComplete && viewingOwnProfile && (
        <p style={styles.placingNote}>
          Finish placement games to reveal rank badge and unlock tiers in the collection.
        </p>
      )}
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  section: {
    marginTop: 4,
    marginBottom: 12,
  },
  sectionHead: { marginBottom: 12 },
  title: { margin: '0 0 4px', fontSize: 16, fontWeight: 800, color: '#fff' },
  sub: { margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.45 },
  familyTabs: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 5,
    marginBottom: 12,
  },
  tab: {
    padding: '4px 9px',
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
  familyBlock: { marginBottom: 12 },
  familyTitle: {
    margin: '0 0 6px',
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.32)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(108px, 1fr))',
    gap: 6,
  },
  rankCard: {
    background: 'rgba(0,0,0,0.22)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 10,
    padding: '8px 8px 7px',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 5,
    textAlign: 'center',
  },
  rankCardCurrent: {
    borderColor: 'rgba(116,198,157,0.5)',
    boxShadow: '0 0 14px rgba(116,198,157,0.1)',
    background: 'rgba(116,198,157,0.06)',
  },
  rankCardFuture: {
    opacity: 0.55,
  },
  currentTag: {
    position: 'absolute',
    top: 5,
    right: 5,
    fontSize: 7,
    fontWeight: 800,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: '#74c69d',
    background: 'rgba(116,198,157,0.15)',
    padding: '1px 5px',
    borderRadius: 3,
  },
  rankMeta: { display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 },
  rankName: { fontSize: 10, fontWeight: 800, lineHeight: 1.15 },
  rankMmr: { fontSize: 8, fontFamily: 'ui-monospace, monospace', color: 'rgba(255,255,255,0.38)' },
  placingNote: {
    fontSize: 11,
    color: '#f1c40f',
    margin: '10px 0 0',
    lineHeight: 1.45,
  },
};
