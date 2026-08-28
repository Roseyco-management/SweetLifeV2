/**
 * @vitest-environment node
 *
 * Tracking proof cookies are minted only after this route accepts a canonical
 * sushi pre-order. They are never returned in JSON or readable by client code.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';
import {
  SUSHI_CONVERSION_PROOF_COOKIE,
  verifySushiConversionProof,
} from '@/lib/sushiConversionProof';

const ORIGINAL_ENV = { ...process.env };
const NOW = new Date('2026-01-01T10:00:00.000Z');

function acceptedOrderBody(trackingConsent: boolean) {
  return {
    fullName: 'Jane Doe',
    phone: '07123456789',
    email: 'jane@example.com',
    pickupDateTime: '2026-01-03T13:00',
    specialRequests: '',
    variation: 'Mix',
    pieces: 30,
    price: 40,
    trackingConsent,
  };
}

function makeRequest(body: unknown, gaCookie = '_ga=GA1.1.123456789.987654321'): NextRequest {
  return new NextRequest('http://localhost/api/sushi-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(gaCookie ? { cookie: gaCookie } : {}) },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  delete process.env.NEXT_PUBLIC_GOOGLE_TAG_ID;
  delete process.env.GA4_MEASUREMENT_PROTOCOL_API_SECRET;
  delete process.env.RESEND_API_KEY;
});

afterEach(() => {
  vi.useRealTimers();
  process.env = { ...ORIGINAL_ENV };
});

describe('POST /api/sushi-order conversion proof', () => {
  it('does not mint a proof cookie when either Google tracking setting is absent', async () => {
    process.env.NEXT_PUBLIC_GOOGLE_TAG_ID = 'G-TEST123';

    const withoutApiSecret = await POST(makeRequest(acceptedOrderBody(true)));
    delete process.env.NEXT_PUBLIC_GOOGLE_TAG_ID;
    process.env.GA4_MEASUREMENT_PROTOCOL_API_SECRET = 'test-api-secret';
    const withoutMeasurementId = await POST(makeRequest(acceptedOrderBody(true)));

    expect(withoutApiSecret.status).toBe(200);
    expect(withoutApiSecret.headers.get('set-cookie')).toBeNull();
    expect(withoutMeasurementId.status).toBe(200);
    expect(withoutMeasurementId.headers.get('set-cookie')).toBeNull();
  });

  it('mints an HttpOnly, strict, path-scoped proof from the canonical accepted order', async () => {
    process.env.NEXT_PUBLIC_GOOGLE_TAG_ID = 'G-TEST123';
    process.env.GA4_MEASUREMENT_PROTOCOL_API_SECRET = 'test-api-secret';

    const response = await POST(makeRequest(acceptedOrderBody(true)));
    const setCookie = response.headers.get('set-cookie');

    expect(response.status).toBe(200);
    expect(setCookie).toContain(`${SUSHI_CONVERSION_PROOF_COOKIE}=`);
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('SameSite=strict');
    expect(setCookie).toContain('Path=/api/conversions/sushi-preorder');

    const proof = setCookie?.match(/sl_sushi_conversion=([^;]+)/)?.[1];
    expect(proof).toBeTruthy();
    expect(
      verifySushiConversionProof(
        proof!,
        'test-api-secret',
        NOW.getTime(),
        '123456789.987654321'
      )
    ).toMatchObject({ pieces: 30, price: 40 });
  });

  it('does not mint a proof when the visitor has not granted analytics consent', async () => {
    process.env.NEXT_PUBLIC_GOOGLE_TAG_ID = 'G-TEST123';
    process.env.GA4_MEASUREMENT_PROTOCOL_API_SECRET = 'test-api-secret';

    const response = await POST(makeRequest(acceptedOrderBody(false)));

    expect(response.status).toBe(200);
    expect(response.headers.get('set-cookie')).toBeNull();
  });

  it('does not mint a proof without the consent-created GA client identifier to bind it to', async () => {
    process.env.NEXT_PUBLIC_GOOGLE_TAG_ID = 'G-TEST123';
    process.env.GA4_MEASUREMENT_PROTOCOL_API_SECRET = 'test-api-secret';

    const response = await POST(makeRequest(acceptedOrderBody(true), ''));

    expect(response.status).toBe(200);
    expect(response.headers.get('set-cookie')).toBeNull();
  });
});
