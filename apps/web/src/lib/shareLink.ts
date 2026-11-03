import { IS_IR_EDITION } from './edition.js';
import { isNativeApp } from './platform.js';

/** Hands a link to the system share sheet, or copies it. Returns what happened. */
export async function shareLink(url: string, text: string): Promise<'shared' | 'copied' | 'failed'> {
  const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
  if (typeof nav.share === 'function') {
    try {
      await nav.share({ text, url });
      return 'shared';
    } catch (err) {
      if ((err as { name?: string }).name === 'AbortError') return 'failed';
    }
  }
  try {
    await navigator.clipboard.writeText(`${text} ${url}`);
    return 'copied';
  } catch {
    return 'failed';
  }
}


/**
 * The page a witness opens. On the web: this site. In the Android app the page's origin
 * is only an internal label, so the link goes to the real website of the app's edition.
 */
export function witnessUrl(token: string): string {
  const origin = isNativeApp() ? (IS_IR_EDITION ? 'https://app.purrpose.ir' : 'https://app.purrpose.space') : window.location.origin;
  return `${origin}/witness/${token}`;
}
