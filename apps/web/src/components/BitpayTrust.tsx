import { t } from '../i18n/index.js';
import { bitpayPlace } from '../lib/bitpay.js';

/** Bitpay's trust badge (links to its certificate for purrpose.ir). Website / PWA only. */
export function BitpayTrust() {
  if (!bitpayPlace()) return null;
  return (
    <div className="bitpay-trust">
      <a href="https://bitpay.ir/certificate-263962-purrpose.ir" target="_blank" rel="noopener noreferrer">
        <img src="https://bitpay.ir/theme/public/images/trusted-logo.svg" alt={t('Bitpay trust badge')} height={72} loading="lazy" />
      </a>
      <span className="muted">{t('Payments by Bitpay, a licensed Iranian gateway.')}</span>
    </div>
  );
}
