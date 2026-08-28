const GOOGLE_ANALYTICS_CLIENT_ID_PATTERN = /^\d+\.\d+$/;

export function isGoogleAnalyticsClientId(value: string): boolean {
  return GOOGLE_ANALYTICS_CLIENT_ID_PATTERN.test(value);
}

/** Extracts the GA4 client identifier from the first-party _ga cookie. */
export function getGoogleAnalyticsClientId(gaCookie: string | undefined): string | null {
  if (!gaCookie) {
    return null;
  }

  const clientId = gaCookie.split('.').slice(-2).join('.');
  return isGoogleAnalyticsClientId(clientId) ? clientId : null;
}
