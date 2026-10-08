import { useEffect, useRef, useState } from 'react';
import { DEFAULT_GOOGLE_CLIENT_ID } from '@purrpose/shared';
import { getLocale, t } from '../i18n/index.js';

/** The parts of Google Identity Services (accounts.google.com/gsi/client) we use. */
interface GsiId {
  initialize(config: {
    client_id: string;
    callback: (response: { credential?: string }) => void;
    ux_mode?: 'popup' | 'redirect';
    auto_select?: boolean;
    itp_support?: boolean;
    use_fedcm_for_button?: boolean;
  }): void;
  renderButton(
    parent: HTMLElement,
    options: {
      type?: 'standard' | 'icon';
      theme?: 'outline' | 'filled_blue' | 'filled_black';
      size?: 'large' | 'medium' | 'small';
      text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
      shape?: 'rectangular' | 'pill' | 'circle' | 'square';
      logo_alignment?: 'left' | 'center';
      width?: number;
      /** Language of Google's button text (e.g. 'fa'). */
      locale?: string;
    },
  ): void;
}
declare global {
  interface Window {
    google?: { accounts?: { id?: GsiId } };
  }
}

const GSI_SRC = 'https://accounts.google.com/gsi/client';
const CLIENT_ID =
  (import.meta.env?.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim() || DEFAULT_GOOGLE_CLIENT_ID;

let scriptPromise: Promise<GsiId> | null = null;
/** GIS wants a single initialize() per page, so the callback is routed through here. */
let onCredential: ((credential: string) => void) | null = null;

function loadGsi(): Promise<GsiId> {
  scriptPromise ??= new Promise<GsiId>((resolve, reject) => {
    const ready = () => {
      const id = window.google?.accounts?.id;
      if (!id) return reject(new Error('Google sign-in did not load'));
      id.initialize({
        client_id: CLIENT_ID,
        callback: r => {
          if (r.credential) onCredential?.(r.credential);
        },
        ux_mode: 'popup',
        auto_select: false,
        itp_support: true,
        use_fedcm_for_button: true,
      });
      resolve(id);
    };
    if (window.google?.accounts?.id) return ready();
    const s = document.createElement('script');
    s.src = GSI_SRC;
    s.async = true;
    s.onload = ready;
    s.onerror = () => {
      scriptPromise = null; // allow a retry on the next mount
      reject(new Error('Google sign-in could not be reached'));
    };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

/**
 * Google's own "Continue with Google" button (their branding rules want the real
 * one). Calls `onToken` with the ID token; the server verifies it.
 */
export function GoogleButton({ onToken, disabled = false }: { onToken: (credential: string) => void; disabled?: boolean }) {
  const slot = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading');

  useEffect(() => {
    onCredential = onToken;
    return () => {
      if (onCredential === onToken) onCredential = null;
    };
  }, [onToken]);

  useEffect(() => {
    let alive = true;
    loadGsi()
      .then(id => {
        const el = slot.current;
        if (!alive || !el) return;
        el.replaceChildren();
        id.renderButton(el, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          logo_alignment: 'left',
          width: Math.max(200, Math.min(400, Math.round(el.getBoundingClientRect().width))),
          locale: getLocale() === 'fa' ? 'fa' : undefined,
        });
        setState('ready');
      })
      .catch(() => alive && setState('failed'));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="google-btn" aria-busy={state === 'loading'} data-disabled={disabled || undefined}>
      <div ref={slot} className="google-btn-slot" />
      {state === 'loading' && <p className="muted google-btn-note">{t('Loading Google sign-in…')}</p>}
      {state === 'failed' && (
        <p className="muted google-btn-note">
          {t("Google sign-in couldn't load here. Check your connection, or use email below.")}
        </p>
      )}
    </div>
  );
}
