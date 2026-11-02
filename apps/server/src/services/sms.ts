import type { Env } from '../env.js';
import { AppError } from '../errors.js';

/**
 * Sends the sign-in code by SMS through an Iranian SMS gateway's "verify" (template)
 * service, which delivers fast even to numbers that block ads:
 *
 *  - kavenegar: GET  https://api.kavenegar.com/v1/{SMS_API_KEY}/verify/lookup.json
 *               (SMS_TEMPLATE = the template name; the code fills %token)
 *  - smsir:     POST https://api.sms.ir/v1/send/verify, header X-API-KEY
 *               (SMS_TEMPLATE = the numeric template id; the code fills #SMS_CODE_PARAM#)
 *  - ippanel:   POST https://edge.ippanel.com/v1/api/send, header Authorization: <key>
 *               (IPPanel and the panels built on it, e.g. Artapayamak; SMS_TEMPLATE = the
 *               pattern code, SMS_FROM = your sender line, the code fills SMS_CODE_PARAM)
 *  - console:   development only: prints the code in the server log, sends nothing.
 *
 * The API key lives only in the server's environment (Liara), never in the repo.
 */
export type SmsProvider = 'kavenegar' | 'smsir' | 'ippanel' | 'console';

export interface SmsSender {
  provider: SmsProvider;
  sendCode(phone: string, code: string): Promise<void>;
}

type FetchLike = (url: string, init?: { method?: string; headers?: Record<string, string>; body?: string; signal?: AbortSignal }) => Promise<{
  ok: boolean;
  status: number;
  text(): Promise<string>;
}>;

/** Last code "sent" by the console provider, per phone — for tests and local development. */
export const consoleOutbox = new Map<string, string>();

const TIMEOUT_MS = 10_000;

function fail(provider: string, detail: string): never {
  // The gateway's answer goes to the server log only; the user just sees "couldn't send".
  console.error(`[sms:${provider}] send failed: ${detail.slice(0, 300)}`);
  throw new AppError('SMS_FAILED', undefined, 'We couldn’t send the SMS. Try again in a minute.');
}

export function makeSmsSender(env: Env, fetchImpl: FetchLike = fetch as unknown as FetchLike): SmsSender | null {
  const provider = env.SMS_PROVIDER;
  if (!provider) return null;

  if (provider === 'console') {
    // Never in production: it would let anyone sign in to anyone's number by reading logs.
    if (env.NODE_ENV === 'production') return null;
    return {
      provider,
      async sendCode(phone, code) {
        consoleOutbox.set(phone, code);
        if (env.NODE_ENV !== 'test') console.info(`[sms:console] code for ${phone}: ${code}`);
      },
    };
  }

  const key = env.SMS_API_KEY;
  const template = env.SMS_TEMPLATE;
  if (!key || !template) return null;

  if (provider === 'kavenegar') {
    return {
      provider,
      async sendCode(phone, code) {
        const url =
          `https://api.kavenegar.com/v1/${encodeURIComponent(key)}/verify/lookup.json` +
          `?receptor=${encodeURIComponent(phone)}&token=${encodeURIComponent(code)}&template=${encodeURIComponent(template)}`;
        const res = await fetchImpl(url, { method: 'GET', signal: AbortSignal.timeout(TIMEOUT_MS) }).catch(err => fail(provider, String(err)));
        const text = await res.text().catch(() => '');
        if (!res.ok) fail(provider, `HTTP ${res.status}: ${text}`);
        // Kavenegar answers {"return":{"status":200,...}} on success.
        try {
          const status = (JSON.parse(text) as { return?: { status?: number } }).return?.status;
          if (status !== 200) fail(provider, text);
        } catch (err) {
          if (err instanceof AppError) throw err;
          fail(provider, text);
        }
      },
    };
  }

  if (provider === 'ippanel') {
    const from = env.SMS_FROM;
    if (!from) return null;
    // IPPanel wants numbers in international form: 09121234567 → +989121234567.
    const e164 = (raw: string) => {
      const n = raw.replace(/[\s-]/g, '');
      if (n.startsWith('+')) return n;
      if (n.startsWith('0098')) return `+${n.slice(2)}`;
      if (n.startsWith('98') && n.length >= 12) return `+${n}`;
      return `+98${n.startsWith('0') ? n.slice(1) : n}`; // 0912… or a line like 3000505
    };
    return {
      provider,
      async sendCode(phone, code) {
        const res = await fetchImpl('https://edge.ippanel.com/v1/api/send', {
          method: 'POST',
          headers: { 'content-type': 'application/json', accept: 'application/json', authorization: key },
          body: JSON.stringify({
            sending_type: 'pattern',
            from_number: e164(from),
            code: template,
            recipients: [e164(phone)],
            params: { [env.SMS_CODE_PARAM]: code },
          }),
          signal: AbortSignal.timeout(TIMEOUT_MS),
        }).catch(err => fail(provider, String(err)));
        const text = await res.text().catch(() => '');
        if (!res.ok) fail(provider, `HTTP ${res.status}: ${text}`);
        // IPPanel answers {"meta":{"status":true,...}} on success.
        try {
          if ((JSON.parse(text) as { meta?: { status?: boolean } }).meta?.status !== true) fail(provider, text);
        } catch (err) {
          if (err instanceof AppError) throw err;
          fail(provider, text);
        }
      },
    };
  }

  // sms.ir
  const templateId = Number(template);
  const param = env.SMS_CODE_PARAM;
  return {
    provider,
    async sendCode(phone, code) {
      if (!Number.isInteger(templateId)) fail(provider, 'SMS_TEMPLATE must be the numeric template id');
      const res = await fetchImpl('https://api.sms.ir/v1/send/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json', 'x-api-key': key },
        body: JSON.stringify({ mobile: phone, templateId, parameters: [{ name: param, value: code }] }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      }).catch(err => fail(provider, String(err)));
      const text = await res.text().catch(() => '');
      if (!res.ok) fail(provider, `HTTP ${res.status}: ${text}`);
      // sms.ir answers {"status":1,...} on success.
      try {
        if ((JSON.parse(text) as { status?: number }).status !== 1) fail(provider, text);
      } catch (err) {
        if (err instanceof AppError) throw err;
        fail(provider, text);
      }
    },
  };
}
