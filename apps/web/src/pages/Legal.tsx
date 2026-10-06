import { useEffect } from 'react';

/** Where people can reach us about their data. Change it here if the address changes. */
export const CONTACT_EMAIL = 'support@purrpose.space';
const EFFECTIVE = 'October 6, 2026';

function Mail() {
  return <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>;
}

function Privacy() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p className="muted">Effective {EFFECTIVE}</p>
      <p>
        Purrpose (“we”) is a productivity app: you make a commitment, and a cartoon cat keeps you to it. This page
        explains what we collect, why, and what you can do about it. We keep it short because we collect little.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Account details.</strong> If you create an account: your email address and, if you use a password,
          a one-way hash of it (never the password itself). If you sign in with Google, Google tells us your Google
          account ID, email address, whether it is verified, and your name. We do not get access to your Gmail,
          Drive, contacts or anything else in your Google account.
        </li>
        <li>
          <strong>What you do in the app.</strong> Your commitments (titles, descriptions, deadlines, outcomes), focus
          sessions, cats, shop items, PURR and credit history. Without an account this is linked to a random guest
          token stored in your browser.
        </li>
        <li>
          <strong>Notifications.</strong> If you turn on reminders, your browser gives us a push address so we can send
          them. Turning reminders off removes it.
        </li>
        <li>
          <strong>Technical data.</strong> Your IP address is used briefly to stop abuse (for example too many sign-in
          attempts). We keep simple in-app event logs (such as “commitment created”) to keep the app working and
          improve it.
        </li>
      </ul>

      <h2>How we use it</h2>
      <p>
        Only to run Purrpose: to save your progress, let you sign in on other devices, send the reminders you asked
        for, and keep the service secure. We do not sell your data, show ads, or share it with advertisers.
      </p>

      <h2>Who else handles it</h2>
      <p>
        Our hosting and database providers store the data on our behalf, Google handles “Sign in with Google”, and
        your browser’s push service delivers reminders. If paid features are enabled, payments are processed by the
        payment provider; we never see or store card numbers.
      </p>

      <h2>Keeping and deleting it</h2>
      <p>
        We keep your data while your account or guest token is in use. You can ask us to delete your account and
        everything linked to it at any time by emailing <Mail /> from the address on your account. Signing in on a
        device that has guest progress moves that progress into your account.
      </p>

      <h2>Children</h2>
      <p>Purrpose is not meant for children under 13, and we don’t knowingly collect their data.</p>

      <h2>Changes and contact</h2>
      <p>
        If this policy changes we’ll update the date above. Questions? Email <Mail />.
      </p>
    </>
  );
}

function Terms() {
  return (
    <>
      <h1>Terms of Service</h1>
      <p className="muted">Effective {EFFECTIVE}</p>
      <p>By using Purrpose you agree to these terms. If you don’t agree, please don’t use the app.</p>

      <h2>The app</h2>
      <p>
        Purrpose helps you keep commitments with a little friendly pressure from a cat. It is provided “as is”: we
        work hard to keep it running and your progress safe, but we can’t promise it will always be available or
        error-free.
      </p>

      <h2>Your account</h2>
      <p>
        Keep your sign-in details to yourself; you’re responsible for what happens in your account. One person per
        account, please. Don’t misuse the service — no attacking it, scraping it, or trying to get around its limits.
      </p>

      <h2>Credits and PURR</h2>
      <p>
        Credits (meals, dry food, vet care) and PURR are in-app items. They have no cash value, can’t be exchanged for
        money, and aren’t refundable except where the law requires it.
      </p>

      <h2>Ending things</h2>
      <p>
        You can stop using Purrpose at any time and ask us to delete your account (<Mail />). We may suspend accounts
        that abuse the service.
      </p>

      <h2>Liability</h2>
      <p>
        To the extent the law allows, we aren’t liable for indirect losses or for missed commitments — the cat only
        judges, it doesn’t guarantee.
      </p>

      <h2>Changes and contact</h2>
      <p>
        We may update these terms; the date above shows the latest version. Questions? Email <Mail />.
      </p>
    </>
  );
}

/** Public, standalone pages (no session, no onboarding) — Google links to them from its sign-in screen. */
export function LegalPage({ kind }: { kind: 'privacy' | 'terms' }) {
  useEffect(() => {
    document.title = kind === 'privacy' ? 'Privacy Policy · Purrpose' : 'Terms of Service · Purrpose';
  }, [kind]);
  return (
    <main className="legal-page">
      <a className="legal-back" href="/">
        ← Purrpose
      </a>
      {kind === 'privacy' ? <Privacy /> : <Terms />}
      <p className="muted" style={{ marginTop: 32 }}>
        <a href="/privacy">Privacy Policy</a> · <a href="/terms">Terms of Service</a>
      </p>
    </main>
  );
}
