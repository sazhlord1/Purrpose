import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { DoodleButton, SketchCard } from '../components/ui/index.js';
import { ApiError } from '../lib/api.js';
import { GoogleButton } from '../components/GoogleButton.js';
import { IS_IR_EDITION } from '../lib/edition.js';
import { createAccount, isGuestAccount, phoneLoginEnabled, signIn, signInWithGoogle } from '../lib/auth.js';
import { PhoneLogin } from '../components/PhoneLogin.js';
import { useMe } from '../lib/queries.js';
import { backArrow, t } from '../i18n/index.js';
import { isNativeApp } from '../lib/platform.js';

type Mode = 'signin' | 'register';

/** Fills `{key}` slots in a translated sentence with elements (links etc.). */
function withParts(template: string, parts: Record<string, ReactNode>): ReactNode[] {
  return template.split(/(\{\w+\})/).map((piece, i) => {
    const key = /^\{(\w+)\}$/.exec(piece)?.[1];
    return key && key in parts ? <span key={i}>{parts[key]}</span> : piece;
  });
}

export function Login() {
  const me = useMe();
  const isGuest = me.data ? isGuestAccount(me.data.user) : true;
  // Iranian edition: a mobile number + SMS code is the main way in (email stays for the admin).
  const [phoneOn, setPhoneOn] = useState(false);
  const [useEmail, setUseEmail] = useState(false);
  useEffect(() => {
    if (IS_IR_EDITION) void phoneLoginEnabled().then(setPhoneOn);
  }, []);
  const phoneFirst = IS_IR_EDITION && phoneOn && !useEmail;
  const [mode, setMode] = useState<Mode>(isGuest ? 'register' : 'signin');
  const [params] = useSearchParams();
  // A witness link sends people here with the email they should use.
  const [email, setEmail] = useState(() => params.get('email')?.trim().slice(0, 254) ?? '');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const describe = (err: unknown) =>
    err instanceof ApiError
      ? err.code === 'INVALID_INPUT'
        ? t('Check your name and email, and use a password of at least {n} characters.', { n: 8 })
        : err.message
      : t('Could not reach the server.');

  const onGoogle = useCallback(async (credential: string) => {
    setError(null);
    setBusy(true);
    try {
      await signInWithGoogle(credential);
    } catch (err) {
      setError(describe(err));
      setBusy(false);
    }
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === 'register') await createAccount(email, password, firstName, lastName);
      else await signIn(email, password);
    } catch (err) {
      setError(describe(err));
      setBusy(false);
    }
  };

  if (me.data && !isGuestAccount(me.data.user)) {
    return (
      <main>
        <h1>{t("You're signed in")}</h1>
        <p className="muted">
          {withParts(t('as {email}'), { email: <span className="ltr">{me.data.user.email || me.data.user.phone}</span> })}
        </p>
        {me.data.user.role === 'ADMIN' && (
          <DoodleButton href="/admin" variant="primary">
            {t('Open the admin panel')}
          </DoodleButton>
        )}
        <DoodleButton href="/settings">{t('Go to settings')}</DoodleButton>
      </main>
    );
  }

  return (
    <main>
      <h1>{isGuest ? t('Keep your cats safe') : t('Welcome back')}</h1>
      <p className="muted">
        {t(
          'Sign in to save your progress and pick it up on any device. Everything you did here as a guest — pacts, pantry, PURR, cats and items — comes with you into your account.',
        )}
      </p>

      {phoneFirst && (
        <SketchCard variant="a">
          <PhoneLogin initialPhone={params.get('phone')?.trim().slice(0, 20) ?? ''} />
          <p style={{ margin: '12px 0 0', textAlign: 'center' }}>
            <button type="button" className="link-button" onClick={() => setUseEmail(true)}>
              {t('Use email instead')}
            </button>
          </p>
        </SketchCard>
      )}

      {!phoneFirst && (
      <SketchCard variant="a">
        {IS_IR_EDITION && phoneOn && (
          <p style={{ margin: '0 0 10px' }}>
            <button type="button" className="link-button" onClick={() => setUseEmail(false)}>
              {backArrow()} {t('Sign in with your mobile number')}
            </button>
          </p>
        )}
        {/* Google blocks its web sign-in inside app WebViews; the app gets native sign-in later. */}
        {!isNativeApp() && !IS_IR_EDITION && (
          <>
            <GoogleButton onToken={onGoogle} disabled={busy} />
            <div className="auth-divider" role="separator">
              <span>{t('or use email')}</span>
            </div>
          </>
        )}
        <div className="chip-row" role="tablist">
          <button type="button" role="tab" aria-selected={mode === 'register'} className={`chip ${mode === 'register' ? 'chip-active' : ''}`} onClick={() => setMode('register')}>
            {t('Create account')}
          </button>
          <button type="button" role="tab" aria-selected={mode === 'signin'} className={`chip ${mode === 'signin' ? 'chip-active' : ''}`} onClick={() => setMode('signin')}>
            {t('Sign in')}
          </button>
        </div>
        <form className="auth-form" onSubmit={submit}>
          {mode === 'register' && (
            <div className="name-row">
              <label className="field">
                <span>{t('First name')}</span>
                <input autoComplete="given-name" required maxLength={40} value={firstName} onChange={e => setFirstName(e.target.value)} />
              </label>
              <label className="field">
                <span>{t('Last name')}</span>
                <input autoComplete="family-name" required maxLength={40} value={lastName} onChange={e => setLastName(e.target.value)} />
              </label>
            </div>
          )}
          <label className="field">
            <span>{t('Email')}</span>
            <input type="email" className="ltr" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} />
          </label>
          <label className="field">
            <span>{t('Password')}</span>
            <input
              type="password"
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              required
              minLength={8}
              maxLength={128}
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <DoodleButton type="submit" variant="primary" size="big" disabled={busy}>
            {busy ? '…' : mode === 'register' ? t('Create account') : t('Sign in')}
          </DoodleButton>
        </form>
      </SketchCard>
      )}
      <p className="muted legal-note">
        {withParts(t('By continuing you agree to our {terms} and {privacy}.'), {
          terms: <a href="/terms">{t('Terms')}</a>,
          privacy: <a href="/privacy">{t('Privacy Policy')}</a>,
        })}
      </p>
      <p className="muted">
        <Link to="/">
          {backArrow()} {t('back home')}
        </Link>
      </p>
    </main>
  );
}
