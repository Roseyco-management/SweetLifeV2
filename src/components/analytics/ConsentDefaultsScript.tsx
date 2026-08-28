import Script from 'next/script';

/**
 * Consent Mode v2 defaults must run before the Google tag can load. The tag is
 * still basic-consent gated below, so no Google request is made until accept.
 */
export function ConsentDefaultsScript() {
  return (
    // eslint-disable-next-line @next/next/no-before-interactive-script-outside-document -- RootLayout renders this component site-wide.
    <Script
      id="google-consent-defaults"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('consent', 'default', {
            ad_storage: 'denied',
            analytics_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            functionality_storage: 'granted',
            security_storage: 'granted',
            wait_for_update: 500,
          });
        `,
      }}
    />
  );
}
