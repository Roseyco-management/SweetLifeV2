'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import {
  GOOGLE_TRACKING_CONSENT_STORAGE_KEY,
  type TrackingConsentPayload,
  type TrackingConsentState,
} from '@/lib/consent';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

interface ConsentContextValue {
  state: TrackingConsentState;
  setGranted: () => void;
  setDenied: () => void;
}

const ConsentContext = createContext<ConsentContextValue | null>(null);
const CONSENT_CHANGE_EVENT = 'sweet-life-google-consent-change';
let inMemoryConsent: TrackingConsentState = 'unknown';

export function useConsent(): ConsentContextValue {
  const context = useContext(ConsentContext);
  if (!context) {
    throw new Error('useConsent must be used inside ConsentProvider.');
  }
  return context;
}

function readStoredConsent(): TrackingConsentState {
  if (typeof window === 'undefined') {
    return 'unknown';
  }

  try {
    const raw = window.localStorage.getItem(GOOGLE_TRACKING_CONSENT_STORAGE_KEY);
    if (!raw) return inMemoryConsent;

    const parsed = JSON.parse(raw) as Partial<TrackingConsentPayload>;
    if (parsed.state === 'granted' || parsed.state === 'denied') {
      inMemoryConsent = parsed.state;
    }

    return inMemoryConsent;
  } catch {
    return inMemoryConsent;
  }
}

function subscribeToConsentChanges(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  window.addEventListener(CONSENT_CHANGE_EVENT, onStoreChange);
  return () => window.removeEventListener(CONSENT_CHANGE_EVENT, onStoreChange);
}

function getServerConsentSnapshot(): TrackingConsentState {
  return 'unknown';
}

function updateGoogleConsent(state: TrackingConsentState): void {
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

export function ConsentProvider({
  children,
  trackingEnabled,
}: {
  children: ReactNode;
  trackingEnabled: boolean;
}) {
  const getConsentSnapshot = useCallback(
    () => (trackingEnabled ? readStoredConsent() : 'unknown'),
    [trackingEnabled]
  );
  const state = useSyncExternalStore(
    subscribeToConsentChanges,
    getConsentSnapshot,
    getServerConsentSnapshot
  );

  useEffect(() => {
    if (trackingEnabled) {
      updateGoogleConsent(state);
    }
  }, [state, trackingEnabled]);

  const setConsent = useCallback(
    (nextState: Exclude<TrackingConsentState, 'unknown'>) => {
      if (!trackingEnabled) return;

      inMemoryConsent = nextState;
      const payload: TrackingConsentPayload = {
        state: nextState,
        updatedAt: new Date().toISOString(),
      };

      try {
        window.localStorage.setItem(
          GOOGLE_TRACKING_CONSENT_STORAGE_KEY,
          JSON.stringify(payload)
        );
      } catch {
        // The choice remains valid for this page even when storage is unavailable.
      }

      updateGoogleConsent(nextState);
      window.dispatchEvent(new Event(CONSENT_CHANGE_EVENT));
    },
    [trackingEnabled]
  );

  const setGranted = useCallback(() => setConsent('granted'), [setConsent]);
  const setDenied = useCallback(() => setConsent('denied'), [setConsent]);

  const value = useMemo<ConsentContextValue>(
    () => ({ state, setGranted, setDenied }),
    [state, setGranted, setDenied]
  );

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}
