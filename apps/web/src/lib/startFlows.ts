import { isGuestAccount } from './auth.js';
import { openLogin, openNewCase, openNewPact } from './modals.js';
import { t } from '../i18n/index.js';
import { IS_IR_EDITION } from './edition.js';

type MeLike = { user: { email: string | null; phone?: string | null; role?: string } } | undefined;

/** Guests are asked to sign in first: pacts and cases need an account (and its PURR / pantry). */
function needsAccount(me: MeLike): boolean {
  // The English edition still lets guests try it out (their progress follows them on sign-up).
  return IS_IR_EDITION && (!me || isGuestAccount(me.user));
}

export function startNewPact(me: MeLike, catId?: string): void {
  if (needsAccount(me)) openLogin(t('To make a new pact, sign in first.'));
  else openNewPact(catId);
}

export function startNewCase(me: MeLike): void {
  if (needsAccount(me)) openLogin(t('To open a case, sign in first.'));
  else openNewCase();
}
