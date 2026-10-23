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

/** The page a witness opens. Same origin as the app (the Android app uses app.purrpose.space too). */
export function witnessUrl(token: string): string {
  return `${window.location.origin}/witness/${token}`;
}
