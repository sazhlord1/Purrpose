import { useEffect, useRef, useState, type FormEvent } from 'react';
import { PHONE_CODE_LENGTH, PHONE_RE, normalizeDigits, type AuthResponse } from '@purrpose/shared';
import { DoodleButton } from './ui/index.js';
import { ApiError } from '../lib/api.js';
import { finishSignIn, saveName, sendPhoneCode, verifyPhoneCode } from '../lib/auth.js';
import { t } from '../i18n/index.js';

type Step = 'phone' | 'code' | 'name';

const describe = (err: unknown): string =>
  err instanceof ApiError ? (err.code === 'INVALID_INPUT' ? t('The number must start with 09 and have 11 digits') : err.message) : t('Could not reach the server.');

/**
 * Sign in (or sign up) with a mobile number: 09… → a code by SMS → in. A brand-new
 * account is then asked for a name. Whatever this device did as a guest comes along.
 */
export function PhoneLogin({ initialPhone = '' }: { initialPhone?: string }) {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState(initialPhone);
  const [code, setCode] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resendAt, setResendAt] = useState(0);
  const [, setTick] = useState(0);
  const signedIn = useRef<AuthResponse | null>(null);

  // Countdown for "send again".
  useEffect(() => {
    if (step !== 'code') return;
    const timer = setInterval(() => setTick(n => n + 1), 1000);
    return () => clearInterval(timer);
  }, [step]);
  const resendIn = Math.max(0, Math.ceil((resendAt - Date.now()) / 1000));

  const clean = normalizeDigits(phone);
  const phoneOk = PHONE_RE.test(clean);

  const send = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!phoneOk) {
      setError(t('The number must start with 09 and have 11 digits'));
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const r = await sendPhoneCode(clean);
      setResendAt(Date.now() + r.resendInMs);
      setCode('');
      setStep('code');
    } catch (err) {
      setError(describe(err));
    } finally {
      setBusy(false);
    }
  };

  const verify = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await verifyPhoneCode(clean, normalizeDigits(code));
      signedIn.current = res;
      if (res.isNew) {
        setStep('name');
        setBusy(false);
      } else {
        finishSignIn(res);
      }
    } catch (err) {
      setError(err instanceof ApiError && err.code === 'INVALID_INPUT' ? t('Enter the code from the SMS') : describe(err));
      setBusy(false);
    }
  };

  const finish = async (e: FormEvent) => {
    e.preventDefault();
    const res = signedIn.current;
    if (!res) return;
    setBusy(true);
    try {
      if (firstName.trim()) await saveName(firstName.trim(), lastName.trim());
    } catch {
      /* the name is nice to have; never block signing in on it */
    }
    finishSignIn(res);
  };

  if (step === 'name') {
    return (
      <form className="auth-form" onSubmit={finish}>
        <p style={{ margin: '0 0 6px' }}>{t('Welcome! What should we call you?')}</p>
        <div className="name-row">
          <label className="field">
            <span>{t('First name')}</span>
            <input autoComplete="given-name" required maxLength={40} value={firstName} onChange={e => setFirstName(e.target.value)} />
          </label>
          <label className="field">
            <span>{t('Last name')}</span>
            <input autoComplete="family-name" maxLength={40} value={lastName} onChange={e => setLastName(e.target.value)} />
          </label>
        </div>
        <DoodleButton type="submit" variant="primary" size="big" disabled={busy}>
          {busy ? '…' : t('Let’s go')}
        </DoodleButton>
      </form>
    );
  }

  if (step === 'code') {
    return (
      <form className="auth-form" onSubmit={verify}>
        <p style={{ margin: '0 0 6px' }}>
          {t('We texted a {n}-digit code to', { n: PHONE_CODE_LENGTH })} <span className="ltr">{clean}</span>
        </p>
        <label className="field">
          <span>{t('Code')}</span>
          <input
            className="ltr"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            maxLength={PHONE_CODE_LENGTH + 4}
            value={code}
            onChange={e => setCode(e.target.value)}
            autoFocus
          />
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <DoodleButton type="submit" variant="primary" size="big" disabled={busy}>
          {busy ? '…' : t('Sign in')}
        </DoodleButton>
        <div className="chip-row" style={{ marginTop: 10 }}>
          <button type="button" className="link-button" disabled={busy || resendIn > 0} onClick={() => void send()}>
            {resendIn > 0 ? t('Send again in {s}s', { s: resendIn }) : t('Send the code again')}
          </button>
          <button
            type="button"
            className="link-button"
            onClick={() => {
              setStep('phone');
              setError(null);
            }}
          >
            {t('Change number')}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form className="auth-form" onSubmit={send}>
      <label className="field">
        <span>{t('Mobile number')}</span>
        <input
          type="tel"
          className="ltr"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="09121234567"
          required
          maxLength={20}
          value={phone}
          onChange={e => setPhone(e.target.value)}
        />
      </label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <DoodleButton type="submit" variant="primary" size="big" disabled={busy}>
        {busy ? '…' : t('Send me a code')}
      </DoodleButton>
    </form>
  );
}
