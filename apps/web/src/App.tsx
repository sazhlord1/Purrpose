import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'framer-motion';
import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, NavLink, Route, Routes, useNavigate, useSearchParams } from 'react-router-dom';
import { Home } from './pages/Home.js';
import { NewCommitment } from './pages/NewCommitment.js';
import { CommitmentDetail } from './pages/CommitmentDetail.js';
import { Focus } from './pages/Focus.js';
import { Pantry } from './pages/Pantry.js';
import { Impact } from './pages/Impact.js';
import { SessionProvider, useSession } from './lib/session.js';
import { Onboarding } from './components/Onboarding.js';
import { WelcomeGift } from './components/WelcomeGift.js';
import { CheckoutReturn } from './components/CheckoutReturn.js';
import { DevDrawer } from './components/DevDrawer.js';
import { AdminOnly } from './components/AdminOnly.js';
import { registerServiceWorker, useNotificationScheduler } from './lib/notifications.js';
import { onReminderTap } from './lib/localReminders.js';
import { Messages } from './pages/Messages.js';
import { useCommitments, useMe } from './lib/queries.js';
import { GlobalModals } from './components/popup/GlobalModals.js';
import { startNewPact } from './lib/startFlows.js';
import { notifyNewMessages } from './lib/localReminders.js';
import { AppIcon } from '@purrpose/cats';
import { LegalPage } from './pages/Legal.js';
import { num, t } from './i18n/index.js';

const Settings = lazy(() => import('./pages/Settings.js').then(m => ({ default: m.Settings })));
const DesignSystem = lazy(() => import('./pages/DesignSystem.js').then(m => ({ default: m.DesignSystem })));
const CatsGallery = lazy(() => import('./pages/CatsGallery.js').then(m => ({ default: m.CatsGallery })));
const CatLab = lazy(() => import('./pages/CatLab.js').then(m => ({ default: m.CatLab })));
const Shop = lazy(() => import('./pages/Shop.js').then(m => ({ default: m.Shop })));
const AdminSite = lazy(() => import('./pages/AdminSite.js').then(m => ({ default: m.AdminSite })));
const AdminBlogEditor = lazy(() => import('./pages/AdminBlogEditor.js').then(m => ({ default: m.AdminBlogEditor })));
const Detective = lazy(() => import('./pages/Detective.js').then(m => ({ default: m.Detective })));
const Pacts = lazy(() => import('./pages/Pacts.js').then(m => ({ default: m.Pacts })));
const AdminUser = lazy(() => import('./pages/AdminUser.js').then(m => ({ default: m.AdminUser })));
const Login = lazy(() => import('./pages/Login.js').then(m => ({ default: m.Login })));
const AdminLogin = lazy(() => import('./pages/AdminLogin.js').then(m => ({ default: m.AdminLogin })));
const Admin = lazy(() => import('./pages/Admin.js').then(m => ({ default: m.Admin })));
const Witness = lazy(() => import('./pages/Witness.js').then(m => ({ default: m.Witness })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: true, staleTime: 30_000, retry: 1 },
  },
});

/** A small envelope for Messages (the icon set has none). */
function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" className="nav-icon" aria-hidden>
      <rect x="3" y="6" width="18" height="13" rx="2.5" fill="#FFF1C2" stroke="#26201D" strokeWidth="1.7" />
      <path d="M3.8 7.2 L12 13.2 L20.2 7.2" fill="none" stroke="#26201D" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Old links to /new: open the new-pact card over the home screen. */
function NewPactRoute() {
  const navigate = useNavigate();
  const me = useMe();
  const [params] = useSearchParams();
  useEffect(() => {
    if (!me.data) return;
    navigate('/', { replace: true });
    startNewPact(me.data, params.get('cat') ?? undefined);
  }, [Boolean(me.data)]);
  return null;
}

function Shell() {
  const { ready } = useSession();
  // A witness opening their link should see the promise first, not the app's intro.
  const isWitnessLink = typeof window !== 'undefined' && window.location.pathname.startsWith('/witness/');
  const [onboarded, setOnboarded] = useState(
    () => localStorage.getItem('purrpose.onboarded') === '1',
  );

  // Wait for the session token before the first request.
  const commitments = useCommitments(undefined, ready);
  useNotificationScheduler(ready ? commitments.data?.commitments : undefined);

  const navigate = useNavigate();
  const me = useMe(ready);
  const unread = me.data?.unreadMessages ?? 0;
  useEffect(() => {
    void notifyNewMessages(me.data ? unread : undefined);
  }, [unread, Boolean(me.data)]);
  useEffect(() => {
    void registerServiceWorker();
    // Android app: tapping a pact reminder opens that pact.
    void onReminderTap(url => navigate(url));
  }, []);

  return (
    <>
      {!onboarded && !isWitnessLink && <Onboarding onDone={() => setOnboarded(true)} />}
      {ready && onboarded && !isWitnessLink && <WelcomeGift />}
      {ready && <CheckoutReturn />}
      {ready ? (
        <>
          <MotionConfig reducedMotion="user">
            <Suspense fallback={<p className="muted">{t('fetching the doodles…')}</p>}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/pacts" element={<Pacts />} />
                <Route path="/detective" element={<Detective />} />
                <Route path="/focus" element={<Focus />} />
                <Route path="/new" element={<NewPactRoute />} />
                <Route path="/new/classic" element={<NewCommitment />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/commitment/:id" element={<CommitmentDetail />} />
                <Route path="/pantry" element={<Pantry />} />
                <Route path="/impact" element={<Impact />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/login" element={<Login />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/admin/users/:id" element={<AdminUser />} />
                <Route path="/admin/site" element={<AdminSite />} />
                <Route path="/admin/blog/:id" element={<AdminBlogEditor />} />
                <Route path="/witness/:token" element={<Witness />} />
                <Route path="/design" element={<AdminOnly><DesignSystem /></AdminOnly>} />
                <Route path="/cats" element={<AdminOnly><CatsGallery /></AdminOnly>} />
                <Route path="/lab" element={<AdminOnly><CatLab /></AdminOnly>} />
              </Routes>
            </Suspense>
          </MotionConfig>
          <nav className="nav" aria-label={t('Main')} data-tour="nav">
            <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
              <AppIcon name="home" size={24} className="nav-icon" />
              {t('Home')}
            </NavLink>
            <NavLink to="/shop" className={({ isActive }) => (isActive ? 'active' : '')}>
              <AppIcon name="shop" size={24} className="nav-icon" />
              {t('Shop')}
            </NavLink>
            <NavLink to="/pantry" className={({ isActive }) => (isActive ? 'active' : '')}>
              <AppIcon name="pantry" size={24} className="nav-icon" />
              {t('Pantry')}
            </NavLink>
            <NavLink to="/impact" className={({ isActive }) => (isActive ? 'active' : '')}>
              <AppIcon name="impact" size={24} className="nav-icon" />
              {t('Impact')}
            </NavLink>
            <NavLink to="/messages" className={({ isActive }) => (isActive ? 'active' : '')}>
              <span className="nav-icon-wrap">
                <MailIcon />
                {unread > 0 && <span className="nav-badge">{unread > 9 ? '9+' : num(unread)}</span>}
              </span>
              {t('Messages')}
            </NavLink>
            <NavLink to="/settings" className={({ isActive }) => (isActive ? 'active' : '')} data-tour="home-settings">
              <AppIcon name="settings" size={24} className="nav-icon" />
              {t('Settings')}
            </NavLink>
          </nav>
          <GlobalModals />
          <DevDrawer />
        </>
      ) : (
        <p className="muted">{t('waking the cats…')}</p>
      )}
    </>
  );
}

export function App() {
  // Privacy / Terms are plain public pages: no guest session, no onboarding.
  const path = typeof window !== 'undefined' ? window.location.pathname.replace(/\/$/, '') : '';
  if (path === '/privacy' || path === '/terms') return <LegalPage kind={path === '/privacy' ? 'privacy' : 'terms'} />;
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <BrowserRouter>
          <Shell />
        </BrowserRouter>
      </SessionProvider>
    </QueryClientProvider>
  );
}
