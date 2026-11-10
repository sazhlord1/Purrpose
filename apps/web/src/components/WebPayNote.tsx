import { t } from '../i18n/index.js';
import { BAZAAR_APP_URL } from '../lib/edition.js';

/**
 * The Iranian website (and its home-screen PWA) can't take payments yet: a payment
 * gateway is on the way. Until then, buying happens in the Android app from Cafe Bazaar.
 */
export function WebPayNote() {
  return (
    <div className="card card-c" style={{ padding: '12px 14px', fontSize: 14 }} role="status">
      <p style={{ margin: '0 0 8px' }}>
        {t('Paying on the website is coming soon. For now you can buy in the Purrpose Android app.')}
      </p>
      <a className="btn btn-primary" href={BAZAAR_APP_URL} target="_blank" rel="noopener noreferrer">
        {t('Get it on Cafe Bazaar')}
      </a>
    </div>
  );
}
