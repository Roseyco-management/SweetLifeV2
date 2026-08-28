export interface GoogleConversionConfiguration {
  measurementId: string;
  apiSecret: string;
}

/** The conversion feature is disabled until both required values exist. */
export function getGoogleConversionConfiguration(): GoogleConversionConfiguration | null {
  const measurementId = process.env.NEXT_PUBLIC_GOOGLE_TAG_ID?.trim();
  const apiSecret = process.env.GA4_MEASUREMENT_PROTOCOL_API_SECRET?.trim();

  if (!measurementId || !apiSecret) {
    return null;
  }

  return { measurementId, apiSecret };
}
