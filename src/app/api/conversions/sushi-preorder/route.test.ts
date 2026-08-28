/**
 * @vitest-environment node
 *
 * The browser calls this route only after the on-site sushi order API accepts
 * a pre-order. The route forwards a privacy-safe completion event to GA4's
 * Measurement Protocol when, and only when, its server-only configuration is
 * present.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';
import {
  createSushiConversionProof,
  SUSHI_CONVERSION_PROOF_COOKIE,
  SUSHI_CONVERSION_PROOF_MAX_AGE_SECONDS,
} from '@/lib/sushiConversionProof';

const ORIGINAL_ENV = { ...process.env };

function makeRequest(body: unknown, cookie?: string): NextRequest {
  return new NextRequest('http://localhost/api/conversions/sushi-preorder', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
  delete process.env.NEXT_PUBLIC_GOOGLE_TAG_ID;
  delete process.env.GA4_MEASUREMENT_PROTOCOL_API_SECRET;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe('POST /api/conversions/sushi-preorder', () => {
  it('is a silent no-op before parsing a request when Google tracking is not fully configured', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(null, { status: 204 })
    );
    const response = await POST(
      makeRequest({ arbitrary: 'request-body-is-ignored-while-dark' })
    );

    expect(response.status).toBe(204);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('forwards only a server-proven completed sushi pre-order after both server settings exist', async () => {
    process.env.NEXT_PUBLIC_GOOGLE_TAG_ID = 'G-TEST123';
    process.env.GA4_MEASUREMENT_PROTOCOL_API_SECRET = 'test-api-secret';
    const proof = createSushiConversionProof(
      {
        pieces: 30,
        orderReference: 'sushi-preorder-12345678',
        clientId: '123456789.987654321',
      },
      'test-api-secret'
    );
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(null, { status: 204 })
    );

    const response = await POST(
      makeRequest(
        { pieces: 30 },
        `_ga=GA1.1.123456789.987654321; ${SUSHI_CONVERSION_PROOF_COOKIE}=${proof}`
      )
    );

    expect(response.status).toBe(204);
    expect(response.headers.get('set-cookie')).toContain(
      `${SUSHI_CONVERSION_PROOF_COOKIE}=;`
    );
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe(
      'https://region1.google-analytics.com/mp/collect?measurement_id=G-TEST123&api_secret=test-api-secret'
    );
    expect(init).toMatchObject({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    expect(JSON.parse(init?.body as string)).toEqual({
      client_id: '123456789.987654321',
      events: [
        {
          name: 'sushi_preorder_completed',
          params: {
            currency: 'GBP',
            value: 40,
            order_reference: 'sushi-preorder-12345678',
          },
        },
      ],
    });
  });

  it('rejects arbitrary, tampered, and expired proofs without forwarding an event', async () => {
    process.env.NEXT_PUBLIC_GOOGLE_TAG_ID = 'G-TEST123';
    process.env.GA4_MEASUREMENT_PROTOCOL_API_SECRET = 'test-api-secret';
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(null, { status: 204 })
    );
    const proof = createSushiConversionProof(
      {
        pieces: 30,
        orderReference: 'sushi-preorder-12345678',
        clientId: '123456789.987654321',
      },
      'test-api-secret'
    );
    const expiredProof = createSushiConversionProof(
      {
        pieces: 30,
        orderReference: 'sushi-preorder-12345678',
        clientId: '123456789.987654321',
      },
      'test-api-secret',
      Date.now() - SUSHI_CONVERSION_PROOF_MAX_AGE_SECONDS * 1_000
    );

    const arbitrary = await POST(
      makeRequest({ pieces: 30 }, '_ga=GA1.1.123456789.987654321')
    );
    const tampered = await POST(
      makeRequest(
        { pieces: 30 },
        `_ga=GA1.1.123456789.987654321; ${SUSHI_CONVERSION_PROOF_COOKIE}=${proof}x`
      )
    );
    const expired = await POST(
      makeRequest(
        { pieces: 30 },
        `_ga=GA1.1.123456789.987654321; ${SUSHI_CONVERSION_PROOF_COOKIE}=${expiredProof}`
      )
    );
    const mismatchedGaCookie = await POST(
      makeRequest(
        { pieces: 30 },
        `_ga=GA1.1.111111111.222222222; ${SUSHI_CONVERSION_PROOF_COOKIE}=${proof}`
      )
    );
    const mismatchedOrderSize = await POST(
      makeRequest(
        { pieces: 50 },
        `_ga=GA1.1.123456789.987654321; ${SUSHI_CONVERSION_PROOF_COOKIE}=${proof}`
      )
    );

    expect(arbitrary.status).toBe(400);
    expect(tampered.status).toBe(400);
    expect(expired.status).toBe(400);
    expect(mismatchedGaCookie.status).toBe(400);
    expect(mismatchedOrderSize.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('does not forward without the consent-created GA cookie', async () => {
    process.env.NEXT_PUBLIC_GOOGLE_TAG_ID = 'G-TEST123';
    process.env.GA4_MEASUREMENT_PROTOCOL_API_SECRET = 'test-api-secret';
    const proof = createSushiConversionProof(
      {
        pieces: 30,
        orderReference: 'sushi-preorder-12345678',
        clientId: '123456789.987654321',
      },
      'test-api-secret'
    );
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(null, { status: 204 })
    );

    const response = await POST(
      makeRequest({ pieces: 30 }, `${SUSHI_CONVERSION_PROOF_COOKIE}=${proof}`)
    );

    expect(response.status).toBe(204);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
