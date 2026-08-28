import { describe, expect, it } from 'vitest';
import {
  ANALYTICS_CONSENT_MAX_AGE_SECONDS,
  createAnalyticsConsent,
  createGrantedAnalyticsConsent,
  verifyAnalyticsConsent,
  verifyGrantedAnalyticsConsent,
} from './analyticsConsent';

describe('signed analytics consent', () => {
  it('accepts only an unexpired server-signed analytics grant', () => {
    const now = 1_700_000_000_000;
    const token = createGrantedAnalyticsConsent('server-only-secret', now);

    expect(verifyGrantedAnalyticsConsent(token, 'server-only-secret', now)).toEqual({
      state: 'granted',
      issuedAt: now,
      expiresAt: now + ANALYTICS_CONSENT_MAX_AGE_SECONDS * 1_000,
    });
  });

  it('rejects forged and expired grants', () => {
    const now = 1_700_000_000_000;
    const token = createGrantedAnalyticsConsent('server-only-secret', now);

    expect(
      verifyGrantedAnalyticsConsent(
        `${token.slice(0, -1)}${token.endsWith('a') ? 'b' : 'a'}`,
        'server-only-secret',
        now
      )
    ).toBeNull();
    expect(
      verifyGrantedAnalyticsConsent(
        token,
        'server-only-secret',
        now + ANALYTICS_CONSENT_MAX_AGE_SECONDS * 1_000
      )
    ).toBeNull();
  });

  it('keeps a valid signed denial distinct from a tracking grant', () => {
    const now = 1_700_000_000_000;
    const token = createAnalyticsConsent('denied', 'server-only-secret', now);

    expect(verifyAnalyticsConsent(token, 'server-only-secret', now)).toEqual({
      state: 'denied',
      issuedAt: now,
      expiresAt: now + ANALYTICS_CONSENT_MAX_AGE_SECONDS * 1_000,
    });
    expect(verifyGrantedAnalyticsConsent(token, 'server-only-secret', now)).toBeNull();
  });
});
