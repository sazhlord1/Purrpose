import { Link, useNavigate } from 'react-router-dom';
import { openLogin, openPantryPeek } from '../lib/modals.js';
import { startNewPact } from '../lib/startFlows.js';
import { isGuestAccount } from '../lib/auth.js';
import { AppIcon } from '@purrpose/cats';
import { now } from '@purrpose/shared';
import { DetectiveBanner, FocusBanner, HubBanner, PactsBanner } from '../components/HubBanners.js';
import { num, t } from '../i18n/index.js';
import { localHour } from '../lib/commitmentView.js';
import { useCommitments, useHabits, useMe } from '../lib/queries.js';
import { Tour } from '../components/Tour.js';
import { homeTour } from '../lib/tours.js';

type Greeting = 'Up late' | 'Good morning' | 'Good afternoon' | 'Good evening';

function greeting(hour: number): Greeting {
  if (hour < 5) return 'Up late';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/** The whole greeting line as one sentence, with "{name}" where the name goes. */
function greetingLine(g: Greeting, named: boolean): string {
  switch (g) {
    case 'Up late':
      return named ? t('Up late, {name}.') : t('Up late.');
    case 'Good morning':
      return named ? t('Good morning, {name}.') : t('Good morning.');
    case 'Good afternoon':
      return named ? t('Good afternoon, {name}.') : t('Good afternoon.');
    default:
      return named ? t('Good evening, {name}.') : t('Good evening.');
  }
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
  const isGuest = me.data ? isGuestAccount(me.data.user) : false;
  const firstName = me.data?.user.firstName?.trim() || null;
  const hour = localHour(now());
  const reduced = isReduced();

  const activePacts = (commitments.data?.commitments ?? []).filter(c => c.status === 'ACTIVE').length;
  const openCases = (habits.data?.habits ?? []).filter(h => h.status === 'ACTIVE').length;
  const navigate = useNavigate();
  const [beforeName, afterName = ''] = greetingLine(greeting(hour), Boolean(firstName)).split('{name}');

  return (
    <main>
      <header style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
          <h1>
            {beforeName}
            {firstName && (
              <>
                <span className="greet-name">{firstName}</span>
                {afterName}
              </>
            )}
          </h1>
          {me.data?.user.role === 'ADMIN' && (
            <div className="home-links">
              <Link to="/admin" className="muted" aria-label={t('Admin panel')}>
                <AppIcon name="crown" size={16} /> {t('admin')}
              </Link>
            </div>
          )}
        </div>
        <div className={`home-stats ${isGuest ? 'is-three' : ''}`} aria-label={t('Summary')} data-tour="home-wallet">
          <Link to="/shop" className="home-stat">
            <AppIcon name="purr" size={20} /> {t('{n} PURR', { n: me.data?.purr ?? 0 })}
          </Link>
          <button type="button" className="home-stat" onClick={openPantryPeek}>
            <AppIcon name="pantry" size={20} /> {t('See your pantry')}
          </button>
          {isGuest && (
            <button type="button" className="home-stat home-stat-login" onClick={() => openLogin()} aria-label={t('Sign in or create an account')}>
              <AppIcon name="account" size={20} /> {t('sign in')}
            </button>
          )}
        </div>
      </header>

      <Tour id="home" steps={homeTour()} />
      <nav className="hub" aria-label={t('Rooms')}>
        <HubBanner
          to="/pacts"
          tour="hub-pacts"
          title={t('New pact')}
          sub={t('A task, a deadline, a cat waiting.')}
          onOpen={() => (isGuest || activePacts === 0 ? startNewPact(me.data) : navigate('/pacts'))}
          badge={activePacts > 0 ? t('{n} active pacts', { n: num(activePacts) }) : undefined}
          blurb={t('Pick a task and a deadline, and stake some cat food. Finish in time and your stray moves up in the world. Miss it, and the cats eat.')}
        >
          <PactsBanner reduced={reduced} />
        </HubBanner>
        <HubBanner
          to="/focus"
          tour="hub-focus"
          title={t('Focus Room')}
          sub={t('Start the timer and stay put with your cat.')}
          blurb={t('A quiet room for deep work. Start the timer, your cat curls up on its cushion, and you both stay put until it rings.')}
        >
          <FocusBanner reduced={reduced} />
        </HubBanner>
        <HubBanner
          to="/detective"
          tour="hub-detective"
          title={t('Detective Cheat')}
          sub={t('Quit a bad habit. Confess every slip.')}
          badge={
            openCases > 0
              ? openCases > 1
                ? t('{n} open cases', { n: openCases })
                : t('{n} open case', { n: openCases })
              : undefined
          }
          blurb={t('Quitting something? Stake food and confess every slip to the detective. Each slip locks a share of it — hit your limit and the case is closed.')}
        >
          <DetectiveBanner reduced={reduced} />
        </HubBanner>
      </nav>
    </main>
  );
}
