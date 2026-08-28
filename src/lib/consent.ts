export const GOOGLE_TRACKING_CONSENT_STORAGE_KEY = 'sweet_life_google_consent_v1';

export type TrackingConsentState = 'granted' | 'denied' | 'unknown';

export interface TrackingConsentPayload {
  state: Exclude<TrackingConsentState, 'unknown'>;
  updatedAt: string;
}
