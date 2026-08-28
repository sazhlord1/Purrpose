import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { ensureSession } from './api.js';

interface SessionState {
  ready: boolean;
}

const SessionContext = createContext<SessionState>({ ready: false });

export function SessionProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await ensureSession();
      } catch (err) {
        console.error('Session bootstrap error:', err);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return <SessionContext.Provider value={{ ready }}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionState {
  return useContext(SessionContext);
}
