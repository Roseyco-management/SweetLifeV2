export interface GoogleTrackingConfiguration {
  measurementId: string;
  apiSecret: string;
}

/**
 * Conversion tracking remains dark until both the public GA4 measurement ID
 * and its server-only Measurement Protocol secret are configured.
 */
export function getGoogleTrackingConfiguration(): GoogleTrackingConfiguration | null {
  const measurementId = process.env.NEXT_PUBLIC_GOOGLE_TAG_ID?.trim();
  const apiSecret = process.env.GA4_MEASUREMENT_PROTOCOL_API_SECRET?.trim();

  if (!measurementId || !apiSecret) {
    return null;
  }

  return { measurementId, apiSecret };
}
