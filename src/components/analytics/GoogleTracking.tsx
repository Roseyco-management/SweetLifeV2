import type { ReactNode } from 'react';
import { ConsentDefaultsScript } from './ConsentDefaultsScript';
import { ConsentProvider } from './ConsentProvider';
import { CookieBanner } from './CookieBanner';
import { GoogleTagLoader } from './GoogleTagLoader';

export function GoogleTracking({ children }: { children: ReactNode }) {
  const tagId = process.env.NEXT_PUBLIC_GOOGLE_TAG_ID?.trim();
  const trackingEnabled = Boolean(tagId);

  return (
    <>
      {trackingEnabled ? <ConsentDefaultsScript /> : null}
      <ConsentProvider trackingEnabled={trackingEnabled}>
        {children}
        {tagId ? (
          <>
            <CookieBanner />
            <GoogleTagLoader tagId={tagId} />
          </>
        ) : null}
      </ConsentProvider>
    </>
  );
}
