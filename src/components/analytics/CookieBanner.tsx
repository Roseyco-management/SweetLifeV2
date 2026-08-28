'use client';

import { useConsent } from './ConsentProvider';

export function CookieBanner() {
  const { state, setGranted, setDenied } = useConsent();

  if (state !== 'unknown') {
    return null;
  }

  const buttonClasses =
    'inline-flex min-h-11 items-center justify-center rounded-lg border-2 px-5 py-3 text-sm font-semibold';

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
            onClick={setDenied}
            className={`${buttonClasses} border-charcoal bg-white text-charcoal hover:bg-warm-cream`}
          >
            Reject
          </button>
          <button
            type="button"
            onClick={setGranted}
            className={`${buttonClasses} border-primary bg-primary text-charcoal hover:bg-primary/90`}
          >
            Accept
          </button>
        </div>
      </div>
    </aside>
  );
}
