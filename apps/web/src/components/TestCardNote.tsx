import { t } from '../i18n/index.js';

/** Stripe test mode: how to pay without a real card. */
export function TestCardNote() {
  return (
    <p className="card card-c" style={{ padding: '10px 12px', fontSize: 13.5 }} role="note">
      {t('Test mode: nothing is charged. Pay with card')} <span className="ltr" style={{ fontWeight: 700 }}>4242 4242 4242 4242</span>
      {t(', any future date, any CVC.')}
    </p>
  );
}
