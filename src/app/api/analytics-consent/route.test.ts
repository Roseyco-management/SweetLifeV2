/** @vitest-environment node */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from './route';
import {
  ANALYTICS_CONSENT_COOKIE,
  createGrantedAnalyticsConsent,
} from '@/lib/analyticsConsent';
const ORIGINAL_ENV = { ...process.env };

function makeRequest(
  method: 'GET' | 'POST',
  options: { body?: unknown; origin?: string; cookie?: string } = {}
): NextRequest {
  return new NextRequest('http://localhost/api/analytics-consent', {
    method,
    headers: {
      ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {}),
      ...(options.origin ? { Origin: options.origin } : {}),
      ...(options.cookie ? { cookie: options.cookie } : {}),
    },
    ...(method === 'POST' ? { body: JSON.stringify(options.body) } : {}),
  });
}

beforeEach(() => {
  delete process.env.NEXT_PUBLIC_GOOGLE_TAG_ID;
  delete process.env.GA4_MEASUREMENT_PROTOCOL_API_SECRET;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe('analytics consent endpoint', () => {
  it('is a no-op with no consent cookie while either tracking setting is unset', async () => {
    process.env.NEXT_PUBLIC_GOOGLE_TAG_ID = 'G-TEST123';
    const withoutApiSecret = await POST(
      makeRequest('POST', { origin: 'http://localhost', body: { action: 'grant' } })
    );
    delete process.env.NEXT_PUBLIC_GOOGLE_TAG_ID;
    process.env.GA4_MEASUREMENT_PROTOCOL_API_SECRET = 'test-api-secret';
    const withoutMeasurementId = await GET(makeRequest('GET'));

    expect(withoutApiSecret.status).toBe(204);
    expect(withoutApiSecret.headers.get('set-cookie')).toBeNull();
    expect(withoutMeasurementId.status).toBe(204);
    expect(withoutMeasurementId.headers.get('set-cookie')).toBeNull();
  });

  it('rejects missing and cross-origin consent writes without setting a cookie', async () => {
    process.env.NEXT_PUBLIC_GOOGLE_TAG_ID = 'G-TEST123';
    process.env.GA4_MEASUREMENT_PROTOCOL_API_SECRET = 'test-api-secret';

    const missingOrigin = await POST(
      makeRequest('POST', { body: { action: 'grant' } })
    );
    const crossOrigin = await POST(
      makeRequest('POST', { origin: 'https://attacker.example', body: { action: 'grant' } })
    );

    expect(missingOrigin.status).toBe(403);
    expect(crossOrigin.status).toBe(403);
    expect(missingOrigin.headers.get('set-cookie')).toBeNull();
    expect(crossOrigin.headers.get('set-cookie')).toBeNull();
  });

  it('sets a signed grant for a same-origin choice', async () => {
    process.env.NEXT_PUBLIC_GOOGLE_TAG_ID = 'G-TEST123';
    process.env.GA4_MEASUREMENT_PROTOCOL_API_SECRET = 'test-api-secret';

    const grant = await POST(
      makeRequest('POST', { origin: 'http://localhost', body: { action: 'grant' } })
    );

    expect(grant.status).toBe(200);
    expect(grant.headers.get('set-cookie')).toContain(
      `${ANALYTICS_CONSENT_COOKIE}=`
    );
    expect(grant.headers.get('set-cookie')).toContain('HttpOnly');
    expect(grant.headers.get('set-cookie')).toContain('SameSite=strict');
  });

  it('persists a signed denial across reload after a visitor rejects analytics', async () => {
    process.env.NEXT_PUBLIC_GOOGLE_TAG_ID = 'G-TEST123';
    process.env.GA4_MEASUREMENT_PROTOCOL_API_SECRET = 'test-api-secret';

    const rejection = await POST(
      makeRequest('POST', { origin: 'http://localhost', body: { action: 'revoke' } })
    );
    const setCookie = rejection.headers.get('set-cookie');
    const cookieValue = setCookie?.match(
      new RegExp(`${ANALYTICS_CONSENT_COOKIE}=([^;]+)`)
    )?.[1];
    const reloaded = await GET(
      makeRequest('GET', {
        cookie: `${ANALYTICS_CONSENT_COOKIE}=${cookieValue}`,
      })
    );

    expect(rejection.status).toBe(200);
    expect(await rejection.json()).toEqual({ state: 'denied' });
    expect(cookieValue).toBeTruthy();
    expect(await reloaded.json()).toEqual({ state: 'denied' });
  });

  it('reports granted only for a valid signed cookie', async () => {
    process.env.NEXT_PUBLIC_GOOGLE_TAG_ID = 'G-TEST123';
    process.env.GA4_MEASUREMENT_PROTOCOL_API_SECRET = 'test-api-secret';
    const token = createGrantedAnalyticsConsent('test-api-secret');

    const forged = await GET(
      makeRequest('GET', { cookie: `${ANALYTICS_CONSENT_COOKIE}=forged` })
    );
    const granted = await GET(
      makeRequest('GET', { cookie: `${ANALYTICS_CONSENT_COOKIE}=${token}` })
    );

    expect(await forged.json()).toEqual({ state: 'unknown' });
    expect(await granted.json()).toEqual({ state: 'granted' });
  });
});
