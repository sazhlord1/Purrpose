import { useState } from 'react';
import { t } from '../i18n/index.js';
import { bitpayPlace } from '../lib/bitpay.js';

const CERT = 'https://bitpay.ir/certificate-263962-purrpose.ir';

/**
 * Bitpay's trust badge (links to its certificate for purrpose.ir). Website / PWA only.
 * If Bitpay's picture doesn't load (some browsers block it, or bitpay.ir is slow), a
 * plain badge with the same link takes its place, so there is always something to tap.
 */
export function BitpayTrust() {
  const [failed, setFailed] = useState(false);
  if (!bitpayPlace()) return null;
  return (
    <div className="bitpay-trust">
      <a href={CERT} target="_blank" rel="noopener" className={failed ? 'bitpay-trust-fallback' : undefined}>
        {failed ? (
          <>
            <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
              <path d="M12 2.5 4.5 5.5v6c0 4.6 3.2 8.4 7.5 10 4.3-1.6 7.5-5.4 7.5-10v-6Z" fill="#3D9A6B" stroke="#26201D" strokeWidth="1.6" strokeLinejoin="round" />
              <path d="m8.3 12.2 2.6 2.6 4.9-5.2" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{t('Verified by Bitpay')}</span>
          </>
        ) : (
          <img
            src="https://bitpay.ir/theme/public/images/trusted-logo.svg"
            alt={t('Bitpay trust badge')}
            height={72}
            referrerPolicy="no-referrer-when-downgrade"
            onError={() => setFailed(true)}
          />
        )}
      </a>
      <span className="muted">{t('Payments by Bitpay, a licensed Iranian gateway.')}</span>
    </div>
  );
}
