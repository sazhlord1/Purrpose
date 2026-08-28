import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'framer-motion';
import { lazy, Suspense, useState } from 'react';
import { BrowserRouter, Link, NavLink, Route, Routes } from 'react-router-dom';
import type { CommitmentDto } from '@purrpose/shared';
import { Home } from './pages/Home.js';
import { NewCommitment } from './pages/NewCommitment.js';
import { CommitmentDetail } from './pages/CommitmentDetail.js';
import { Pantry } from './pages/Pantry.js';
import { Impact } from './pages/Impact.js';
import { SessionProvider, useSession } from './lib/session.js';
import { Onboarding } from './components/Onboarding.js';
import { DevDrawer } from './components/DevDrawer.js';
import { useNotificationScheduler } from './lib/notifications.js';
import { api } from './lib/api.js';

const Settings = lazy(() => import('./pages/Settings.js').then(m => ({ default: m.Settings })));
const DesignSystem = lazy(() => import('./pages/DesignSystem.js').then(m => ({ default: m.DesignSystem })));
const CatsGallery = lazy(() => import('./pages/CatsGallery.js').then(m => ({ default: m.CatsGallery })));
const CatLab = lazy(() => import('./pages/CatLab.js').then(m => ({ default: m.CatLab })));

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

  const commitments = useQuery({
    queryKey: ['commitments'],
    queryFn: () => api<{ commitments: CommitmentDto[] }>('/commitments'),
    enabled: ready,
  });

  useNotificationScheduler(ready ? commitments.data?.commitments : undefined);

  return (
    <>
      {!onboarded && <Onboarding onDone={() => setOnboarded(true)} />}
      {ready ? (
        <>
          <MotionConfig reducedMotion="user">
            <Suspense fallback={<p className="muted">fetching the doodles…</p>}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/new" element={<NewCommitment />} />
                <Route path="/commitment/:id" element={<CommitmentDetail />} />
                <Route path="/pantry" element={<Pantry />} />
                <Route path="/impact" element={<Impact />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/design" element={<DesignSystem />} />
                <Route path="/cats" element={<CatsGallery />} />
                <Route path="/lab" element={<CatLab />} />
              </Routes>
            </Suspense>
          </MotionConfig>
          <nav className="nav" aria-label="Main">
            <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
              Home
            </NavLink>
            <Link to="/new" className="nav-new" aria-label="New commitment">
              +
            </Link>
            <NavLink to="/pantry" className={({ isActive }) => (isActive ? 'active' : '')}>
              Pantry
            </NavLink>
            <NavLink to="/impact" className={({ isActive }) => (isActive ? 'active' : '')}>
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
