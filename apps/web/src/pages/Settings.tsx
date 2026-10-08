import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BackLink } from '../components/BackLink.js';
import { DoodleButton, SketchCard } from '../components/ui/index.js';
import { fmtDateTime, fwdArrow, getLocale, setAppLanguage, t, type Locale } from '../i18n/index.js';
import { signOut } from '../lib/auth.js';
import { currentPushState, disablePush, enablePush, refreshPushLocale, type PushState } from '../lib/notifications.js';
import { useMe } from '../lib/queries.js';

const PUSH_COPY: Record<PushState, string> = {
  on: 'On — reminders arrive even when Purrpose is closed.',
  off: 'Off',
  denied: 'Blocked in your browser settings.',
  unsupported: 'Not supported in this browser. On iPhone, add Purrpose to your Home Screen first.',
  unavailable: 'Not available on this server yet.',
};

const LANGS: Array<{ id: Locale; label: string }> = [
  { id: 'en', label: 'English' },
  { id: 'fa', label: 'فارسی' },
];

export function Settings() {
  const me = useMe();
  const [push, setPush] = useState<PushState | null>(null);
  const [pushBusy, setPushBusy] = useState(false);
  const locale = getLocale();
  const reducedMotion =
    typeof localStorage !== 'undefined' && localStorage.getItem('purrpose.reducedMotion') === '1';

  useEffect(() => {
    void currentPushState().then(setPush);
  }, []);

  const togglePush = async () => {
    setPushBusy(true);
    try {
      setPush(push === 'on' ? await disablePush() : await enablePush());
    } catch {
      setPush('off');
    } finally {
      setPushBusy(false);
    }
  };

  const user = me.data?.user;
  const isAdmin = user?.role === 'ADMIN';
  const go = fwdArrow();

  return (
    <main>
      <BackLink />
      <h1>{t('Settings')}</h1>

      <SketchCard variant="a">
        <h2>{t('Language')}</h2>
        <div className="chip-row" role="radiogroup" aria-label={t('Language')} style={{ margin: 0 }}>
          {LANGS.map(l => (
            <button
              key={l.id}
              type="button"
              role="radio"
              aria-checked={locale === l.id}
              lang={l.id}
              className={`chip ${locale === l.id ? 'chip-active' : ''}`}
              onClick={() => {
                if (l.id !== locale) setAppLanguage(l.id, refreshPushLocale);
              }}
            >
              {l.label}
            </button>
          ))}
        </div>
        <p className="muted" style={{ margin: '8px 0 0', fontSize: 13 }}>
          {t('The app reloads in the language you pick.')}
        </p>
      </SketchCard>

      <SketchCard variant="a">
        <h2>{t('Account')}</h2>
        {user?.email ? (
          <>
            <div className="row">
              <span className="muted">{t('Signed in as')}</span>
              <span>
                <span className="ltr">{user.email}</span>
                {isAdmin ? ` · ${t('admin')}` : ''}
              </span>
            </div>
            <div className="row">
              <span className="muted">{t('Member since')}</span>
              <span>{fmtDateTime(user.createdAtISO, { dateStyle: 'medium' })}</span>
            </div>
            <div className="chip-row" style={{ marginTop: 12 }}>
              <DoodleButton onClick={() => void signOut()}>{t('Sign out')}</DoodleButton>
              {isAdmin && <DoodleButton href="/admin">{t('Admin panel')} {go}</DoodleButton>}
            </div>
          </>
        ) : (
          <>
            <p className="muted">
              {t(
                "You're playing as a guest. Create an account so your cats, pantry and PURR are safe if this browser is cleared — and so you can sign in on your other devices.",
              )}
            </p>
            <div className="chip-row">
              <DoodleButton href="/login" variant="primary">
                {t('Create account / Sign in')}
              </DoodleButton>
            </div>
          </>
        )}
      </SketchCard>

      <SketchCard variant="b">
        <h2>{t('Notifications')}</h2>
        <div className="row">
          <span>{t('Deadline reminders')}</span>
          <span className="muted" style={{ textAlign: 'end' }}>{push ? t(PUSH_COPY[push]) : '…'}</span>
        </div>
        {(push === 'on' || push === 'off') && (
          <DoodleButton onClick={() => void togglePush()} disabled={pushBusy}>
            {push === 'on' ? t('Turn off') : t('Turn on')}
          </DoodleButton>
        )}
      </SketchCard>

      <SketchCard variant="b">
        <h2>{t('Accessibility')}</h2>
        <label className="row" style={{ cursor: 'pointer' }}>
          <span>{t('Reduced motion (calmer cats)')}</span>
          <input
            type="checkbox"
            checked={reducedMotion}
            onChange={e => {
              localStorage.setItem('purrpose.reducedMotion', e.target.checked ? '1' : '0');
              location.reload();
            }}
            style={{ width: 'auto' }}
          />
        </label>
      </SketchCard>

      <SketchCard variant="c">
        <h2>{t('About')}</h2>
        <p>
          <strong>{t('Purrpose')}</strong> v0.2.0
        </p>
        <p className="muted">{t('Get your shit done. Or feed a cat.')}</p>
        <div className="chip-row">
          <Link className="chip" to="/shop">{t('Cat Shop')} {go}</Link>
          <a className="chip" href="/privacy">{t('Privacy Policy')}</a>
          <a className="chip" href="/terms">{t('Terms of Service')}</a>
          {(isAdmin || import.meta.env.DEV) && (
            <>
              <Link className="chip" to="/lab">Cat Lab {go}</Link>
              <Link className="chip" to="/cats">Cat gallery {go}</Link>
              <Link className="chip" to="/design">Design kit {go}</Link>
            </>
          )}
        </div>
      </SketchCard>
    </main>
  );
}
