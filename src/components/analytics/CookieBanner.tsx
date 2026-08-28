'use client';

import { useState } from 'react';
import { useConsent } from './ConsentProvider';

export function CookieBanner() {
  const { state, isReady, isUpdating, grant, revoke } = useConsent();
  const [showPreferences, setShowPreferences] = useState(false);

  if (!isReady) {
    return null;
  }

  const buttonClasses =
    'inline-flex min-h-11 items-center justify-center rounded-lg border-2 px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60';

  if (state === 'unknown') {
    return (
      <aside
        role="region"
        aria-label="Cookie preferences"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-warm-stone bg-white p-4 shadow-warm-lg"
      >
        <div className="container flex max-w-5xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-rich-brown/80">
            Optional analytics cookies help us understand completed sushi pre-orders. You can accept or
            reject them.
          </p>
          <div className="flex shrink-0 gap-3">
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => void revoke()}
              className={`${buttonClasses} border-charcoal bg-white text-charcoal hover:bg-warm-cream`}
            >
              Reject
            </button>
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => void grant()}
              className={`${buttonClasses} border-primary bg-primary text-charcoal hover:bg-primary/90`}
            >
              Accept
            </button>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <>
      <button
        type="button"
        aria-expanded={showPreferences}
        aria-controls="analytics-cookie-preferences"
        onClick={() => setShowPreferences((visible) => !visible)}
        className="fixed bottom-4 left-4 z-50 rounded-full bg-charcoal px-4 py-3 text-sm font-semibold text-white shadow-warm-lg hover:bg-rich-brown"
      >
        Cookie preferences
      </button>
      {showPreferences ? (
        <aside
          id="analytics-cookie-preferences"
          role="region"
          aria-label="Cookie preferences"
          className="fixed bottom-20 left-4 z-50 max-w-sm rounded-xl border border-warm-stone bg-white p-5 shadow-warm-lg"
        >
          <p className="mb-4 text-sm text-rich-brown/80">
            {state === 'granted'
              ? 'Analytics cookies are enabled.'
              : 'Analytics cookies are disabled.'}
          </p>
          {state === 'granted' ? (
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => void revoke()}
              className={`${buttonClasses} border-charcoal bg-white text-charcoal hover:bg-warm-cream`}
            >
              Revoke analytics cookies
            </button>
          ) : (
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => void grant()}
              className={`${buttonClasses} border-primary bg-primary text-charcoal hover:bg-primary/90`}
            >
              Enable analytics cookies
            </button>
          )}
        </aside>
      ) : null}
    </>
  );
}
