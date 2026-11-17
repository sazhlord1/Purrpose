import { LoginPanel } from '../../pages/Login.js';
import { t } from '../../i18n/index.js';
import { closeModal } from '../../lib/modals.js';
import { Popup } from './Popup.js';

/** Sign in without leaving the screen: the same form as the sign-in page, in a pop-up. */
export function LoginPopup({ open, reason }: { open: boolean; reason?: string }) {
  return (
    <Popup open={open} onClose={closeModal} label={t('Sign in')}>
      <h2>{t('Sign in to Purrpose')}</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        {reason ?? t('Sign in to save your progress and pick it up on any device.')}
      </p>
      <LoginPanel />
    </Popup>
  );
}
