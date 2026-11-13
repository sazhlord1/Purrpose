import { useQuery } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { type ConsequenceType, type HistoryResponse } from '@purrpose/shared';
import { catName } from '@purrpose/cats';
import { api } from '../lib/api.js';
import { foodName, t } from '../i18n/index.js';
import { AnimatedNumber, DoodleButton, SketchCard, Stamp, Skeleton } from '../components/ui/index.js';
import { CanTin, KibbleBag, VetCare } from '../components/doodles/index.js';
import { RankCard } from '../components/RankCard.js';
import { Tour } from '../components/Tour.js';
import { rankFor } from '../lib/ranks.js';
import { shareRankCard } from '../lib/rankShare.js';
import { impactTour } from '../lib/tours.js';

const DOODLE_BY_TYPE = {
  MEALS: CanTin,
  DRY_FOOD: KibbleBag,
  VET_CARE: VetCare,
};

export function Impact() {
  const cardRef = useRef<SVGSVGElement>(null);
  const [sharing, setSharing] = useState<'idle' | 'busy' | 'downloaded' | 'error'>('idle');

  const history = useQuery({
    queryKey: ['history'],
    queryFn: () => api<HistoryResponse>('/history'),
  });

  const data = history.data;

  if (history.isLoading)
    return (
      <main>
        <h1>{t('Your Impact')}</h1>
        <Skeleton h={110} />
        <div style={{ display: 'grid', gap: 14, marginTop: 16 }}>
          {[0, 1, 2].map(i => (
            <Skeleton key={i} h={52} />
          ))}
        </div>
        <p className="muted" style={{ marginTop: 12 }}>
          {t('counting kibble…')}
        </p>
      </main>
    );

  if (!data)
    return (
      <main>
        <h1>{t('Your Impact')}</h1>
        <p className="muted">{t('The ledger wandered off.')}</p>
      </main>
    );

  const { totals } = data;
  const donatedLines = Object.entries(totals.donatedByType).filter(([, v]) => v > 0);
  const rank = rankFor(totals.completed);
  const share = async () => {
    if (!cardRef.current) return;
    setSharing('busy');
    try {
      const how = await shareRankCard(cardRef.current, rank, totals.completed, catName(rank.cat));
      setSharing(how === 'downloaded' ? 'downloaded' : 'idle');
    } catch {
      setSharing('error');
    }
  };

  return (
    <main>
      <h1>{t('Your Impact')}</h1>

      <Tour id="impact" steps={impactTour()} />
      <div data-tour="impact-totals">
      <div className="score-pair">
        <div className="score-box score-won">
          <AnimatedNumber value={totals.completed} className="hand score-num" />
          <span>{t('commitments kept')}</span>
        </div>
        <div className="score-box score-lost">
          <AnimatedNumber value={totals.failed} className="hand score-num" />
          <span>{t('times the cat won')}</span>
        </div>
      </div>
      {donatedLines.length === 0 ? (
        <p className="muted" style={{ textAlign: 'center', margin: '4px 0 0' }}>
          {t("No cats fed yet. Keep procrastinating — this section fills up when you don't.")}
        </p>
      ) : (
        <SketchCard variant="a">
          {donatedLines.map(([type, amount]) => {
            const Icon = DOODLE_BY_TYPE[type as ConsequenceType] ?? CanTin;
            return (
              <div className="row" key={type}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <Icon size={20} strokeWidth={2.2} />
                  {amount} {foodName(type as ConsequenceType)}
                </span>
                <Stamp kind="fed" />
              </div>
            );
          })}
        </SketchCard>
      )}
      </div>

      <section className="rank-section" data-tour="rank-card">
        <RankCard ref={cardRef} rank={rank} wins={totals.completed} catName={catName(rank.cat)} className="rank-card" />
        <DoodleButton variant="primary" onClick={() => void share()} disabled={sharing === 'busy'} style={{ width: '100%' }}>
          {sharing === 'busy' ? t('Making your card…') : t('Share my card')}
        </DoodleButton>
        {sharing === 'downloaded' && (
          <p className="muted" role="status" style={{ textAlign: 'center', margin: 0 }}>
            {t('Saved the image. Post it wherever you like.')}
          </p>
        )}
        {sharing === 'error' && (
          <p className="form-error" role="status" style={{ textAlign: 'center', margin: 0 }}>
            {t('Could not make the image. Try again.')}
          </p>
        )}
      </section>
    </main>
  );
}
