import type { ReactNode } from 'react';
import { getGoogleConversionConfiguration } from '@/lib/googleConversionConfig';
import { ConsentDefaultsScript } from './ConsentDefaultsScript';
import { ConsentProvider } from './ConsentProvider';
import { CookieBanner } from './CookieBanner';
import { GoogleTagLoader } from './GoogleTagLoader';

export function GoogleTracking({ children }: { children: ReactNode }) {
  const config = getGoogleConversionConfiguration();

  if (!config) {
    return <>{children}</>;
  }

  return (
    <>
      <ConsentDefaultsScript />
      <ConsentProvider>
        {children}
        <CookieBanner />
        <GoogleTagLoader tagId={config.measurementId} />
      </ConsentProvider>
    </>
  );
}
