import { AppIcon, type IconName } from '@purrpose/cats';
import type { ConsequenceType } from '@purrpose/shared';
import { useNavigate } from 'react-router-dom';
import { DoodleButton } from '../ui/index.js';
import { foodName, foodQty, t } from '../../i18n/index.js';
import { closeModal } from '../../lib/modals.js';
import { useMe } from '../../lib/queries.js';
import { Popup } from './Popup.js';

const ICON: Record<ConsequenceType, IconName> = { MEALS: 'meals', DRY_FOOD: 'dryFood', VET_CARE: 'vetCare' };

/** "What can I stake?" — the food that's free for new pacts, at a glance. */
export function PantryPeek({ open }: { open: boolean }) {
  const me = useMe();
  const navigate = useNavigate();
  const balances = me.data?.balances ?? [];
  return (
    <Popup open={open} onClose={closeModal} label={t('Your pantry')}>
      <h2>{t('Your pantry')}</h2>
      <p className="muted" style={{ marginTop: 0 }}>{t('Food you can put on the line in your pacts:')}</p>
      <div className="peek-list">
        {balances.map(b => (
          <div key={b.creditType} className="peek-row">
            <AppIcon name={ICON[b.creditType]} size={30} />
            <span className="peek-name">{foodName(b.creditType)}</span>
            <span className="peek-amount">
              <strong>{foodQty(b.creditType, b.available)}</strong>
              {b.stakedActive > 0 && <small>{t('+{n} at stake', { n: foodQty(b.creditType, b.stakedActive) })}</small>}
            </span>
          </div>
        ))}
      </div>
      <div className="chip-row" style={{ marginTop: 14, justifyContent: 'center' }}>
        <DoodleButton
          variant="primary"
          onClick={() => {
            closeModal();
            navigate('/pantry');
          }}
        >
          {t('Open the pantry')}
        </DoodleButton>
      </div>
    </Popup>
  );
}
