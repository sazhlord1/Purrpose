import { Link } from 'react-router-dom';
import { AppIcon } from '@purrpose/cats';
import { now } from '@purrpose/shared';
import { DetectiveBanner, FocusBanner, HubBanner, PactsBanner } from '../components/HubBanners.js';
import { localHour } from '../lib/commitmentView.js';
import { useCommitments, useHabits, useMe } from '../lib/queries.js';

function greeting(hour: number): string {
  if (hour < 5) return 'Up late';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function isReduced(): boolean {
  try {
    return localStorage.getItem('purrpose.reducedMotion') === '1';
  } catch {
    return false;
  }
}

/** The hub: a greeting and one animated door into each room. */
export function Home() {
  const me = useMe();
  const commitments = useCommitments(60_000);
  const habits = useHabits();
  const isGuest = me.data ? me.data.user.email === null : false;
  const firstName = me.data?.user.firstName?.trim() || null;
  const hour = localHour(now());
  const reduced = isReduced();

  const activePacts = (commitments.data?.commitments ?? []).filter(c => c.status === 'ACTIVE').length;
  const openCases = (habits.data?.habits ?? []).filter(h => h.status === 'ACTIVE').length;
  const meals = me.data?.balances.find(b => b.creditType === 'MEALS');

  return (
    <main>
      <header style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
          <h1>
            {greeting(hour)}
            {firstName ? (
              <>
                , <span className="greet-name">{firstName}</span>.
              </>
            ) : (
              '.'
            )}
          </h1>
          <div className="home-links">
            {isGuest && (
              <Link to="/login" className="muted" aria-label="Sign in or create an account">
                <AppIcon name="account" size={16} /> sign in
              </Link>
            )}
            {me.data?.user.role === 'ADMIN' && (
              <Link to="/admin" className="muted" aria-label="Admin panel">
                <AppIcon name="crown" size={16} /> admin
              </Link>
            )}
            <Link to="/settings" className="muted" aria-label="Settings">
              <AppIcon name="settings" size={16} /> settings
            </Link>
          </div>
        </div>
        <div className="chip-row" aria-label="Summary">
          <span className="chip" style={{ color: '#2E6930', fontWeight: 600 }}>
            pantry: {meals?.available ?? 0} meals
          </span>
          <Link to="/shop" className="chip" style={{ textDecoration: 'none', fontWeight: 600 }}>
            <AppIcon name="purr" size={16} /> {me.data?.purr ?? 0} PURR
          </Link>
        </div>
      </header>

      <nav className="hub" aria-label="Rooms">
        <HubBanner
          to="/pacts"
          title="Make a commitment"
          badge={activePacts > 0 ? `${activePacts} active` : undefined}
          blurb="Pick a task and a deadline, and stake some cat food. Finish in time and your stray moves up in the world. Miss it, and the cats eat."
        >
          <PactsBanner reduced={reduced} />
        </HubBanner>
        <HubBanner
          to="/focus"
          title="Focus Room"
          blurb="A quiet room for deep work. Start the timer, your cat curls up on its cushion, and you both stay put until it rings."
        >
          <FocusBanner reduced={reduced} />
        </HubBanner>
        <HubBanner
          to="/detective"
          title="Detective Cheat"
          badge={openCases > 0 ? `${openCases} open case${openCases > 1 ? 's' : ''}` : undefined}
          blurb="Quitting something? Stake food and confess every slip to the detective. Each slip locks a share of it — hit your limit and the case is closed."
        >
          <DetectiveBanner reduced={reduced} />
        </HubBanner>
      </nav>
    </main>
  );
}
