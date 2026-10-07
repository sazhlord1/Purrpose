import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'framer-motion';
import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Link, NavLink, Route, Routes } from 'react-router-dom';
import { Home } from './pages/Home.js';
import { NewCommitment } from './pages/NewCommitment.js';
import { CommitmentDetail } from './pages/CommitmentDetail.js';
import { Focus } from './pages/Focus.js';
import { Pantry } from './pages/Pantry.js';
import { Impact } from './pages/Impact.js';
import { SessionProvider, useSession } from './lib/session.js';
import { Onboarding } from './components/Onboarding.js';
import { DevDrawer } from './components/DevDrawer.js';
import { AdminOnly } from './components/AdminOnly.js';
import { registerServiceWorker, useNotificationScheduler } from './lib/notifications.js';
import { useCommitments } from './lib/queries.js';
import { AppIcon } from '@purrpose/cats';
import { LegalPage } from './pages/Legal.js';

const Settings = lazy(() => import('./pages/Settings.js').then(m => ({ default: m.Settings })));
const DesignSystem = lazy(() => import('./pages/DesignSystem.js').then(m => ({ default: m.DesignSystem })));
const CatsGallery = lazy(() => import('./pages/CatsGallery.js').then(m => ({ default: m.CatsGallery })));
const CatLab = lazy(() => import('./pages/CatLab.js').then(m => ({ default: m.CatLab })));
const Shop = lazy(() => import('./pages/Shop.js').then(m => ({ default: m.Shop })));
const Detective = lazy(() => import('./pages/Detective.js').then(m => ({ default: m.Detective })));
const Pacts = lazy(() => import('./pages/Pacts.js').then(m => ({ default: m.Pacts })));
const AdminUser = lazy(() => import('./pages/AdminUser.js').then(m => ({ default: m.AdminUser })));
const Login = lazy(() => import('./pages/Login.js').then(m => ({ default: m.Login })));
const AdminLogin = lazy(() => import('./pages/AdminLogin.js').then(m => ({ default: m.AdminLogin })));
const Admin = lazy(() => import('./pages/Admin.js').then(m => ({ default: m.Admin })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: true, staleTime: 30_000, retry: 1 },
  },
});

function Shell() {
  const { ready } = useSession();
  const [onboarded, setOnboarded] = useState(
    () => localStorage.getItem('purrpose.onboarded') === '1',
  );

  // Wait for the session token before the first request.
  const commitments = useCommitments(undefined, ready);
  useNotificationScheduler(ready ? commitments.data?.commitments : undefined);

  useEffect(() => {
    void registerServiceWorker();
  }, []);

  return (
    <>
      {!onboarded && <Onboarding onDone={() => setOnboarded(true)} />}
      {ready ? (
        <>
          <MotionConfig reducedMotion="user">
            <Suspense fallback={<p className="muted">fetching the doodles…</p>}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/pacts" element={<Pacts />} />
                <Route path="/detective" element={<Detective />} />
                <Route path="/focus" element={<Focus />} />
                <Route path="/new" element={<NewCommitment />} />
                <Route path="/commitment/:id" element={<CommitmentDetail />} />
                <Route path="/pantry" element={<Pantry />} />
                <Route path="/impact" element={<Impact />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/login" element={<Login />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/admin/users/:id" element={<AdminUser />} />
                <Route path="/design" element={<AdminOnly><DesignSystem /></AdminOnly>} />
                <Route path="/cats" element={<AdminOnly><CatsGallery /></AdminOnly>} />
                <Route path="/lab" element={<AdminOnly><CatLab /></AdminOnly>} />
              </Routes>
            </Suspense>
          </MotionConfig>
          <nav className="nav" aria-label="Main">
            <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
              <AppIcon name="home" size={24} className="nav-icon" />
              Home
            </NavLink>
            <NavLink to="/shop" className={({ isActive }) => (isActive ? 'active' : '')}>
              <AppIcon name="shop" size={24} className="nav-icon" />
              Shop
            </NavLink>
            <Link to="/new" className="nav-new" aria-label="New commitment">
              +
            </Link>
            <NavLink to="/pantry" className={({ isActive }) => (isActive ? 'active' : '')}>
              <AppIcon name="pantry" size={24} className="nav-icon" />
              Pantry
            </NavLink>
            <NavLink to="/impact" className={({ isActive }) => (isActive ? 'active' : '')}>
              <AppIcon name="impact" size={24} className="nav-icon" />
              Impact
            </NavLink>
          </nav>
          <DevDrawer />
        </>
      ) : (
        <p className="muted">waking the cats…</p>
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
