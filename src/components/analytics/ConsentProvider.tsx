'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type BrowserConsentState = 'unknown' | 'granted' | 'denied';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

interface ConsentContextValue {
  state: BrowserConsentState;
  isReady: boolean;
  isUpdating: boolean;
  grant: () => Promise<void>;
  revoke: () => Promise<void>;
}

const ConsentContext = createContext<ConsentContextValue | null>(null);

function updateGoogleConsent(state: BrowserConsentState): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
    return;
  }

  const value = state === 'granted' ? 'granted' : 'denied';
  window.gtag('consent', 'update', {
    ad_storage: value,
    analytics_storage: value,
    ad_user_data: value,
    ad_personalization: value,
  });
}

export function useConsent(): ConsentContextValue {
  const context = useContext(ConsentContext);
  if (!context) {
    throw new Error('useConsent must be used inside ConsentProvider.');
  }
  return context;
}

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BrowserConsentState>('unknown');
  const [isReady, setIsReady] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void fetch('/api/analytics-consent', {
      credentials: 'same-origin',
      cache: 'no-store',
    })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as { state?: unknown };
      })
      .then((payload) => {
        if (!cancelled && payload?.state === 'granted') {
          setState('granted');
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) {
          setIsReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isReady) {
      updateGoogleConsent(state);
    }
  }, [isReady, state]);

  const saveConsent = useCallback(async (action: 'grant' | 'revoke') => {
    setIsUpdating(true);

    try {
      const response = await fetch('/api/analytics-consent', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!response.ok) return;

      const payload = (await response.json()) as { state?: unknown };
      const nextState: BrowserConsentState =
        action === 'grant' && payload.state === 'granted' ? 'granted' : 'denied';
      setState(nextState);
      updateGoogleConsent(nextState);
    } catch {
      // A failed preference write leaves the default-denied state intact.
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const grant = useCallback(() => saveConsent('grant'), [saveConsent]);
  const revoke = useCallback(() => saveConsent('revoke'), [saveConsent]);

  const value = useMemo<ConsentContextValue>(
    () => ({ state, isReady, isUpdating, grant, revoke }),
    [state, isReady, isUpdating, grant, revoke]
  );

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}
