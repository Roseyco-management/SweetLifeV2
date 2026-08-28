/** @vitest-environment node */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { afterMock, reportMock } = vi.hoisted(() => ({
  afterMock: vi.fn(),
  reportMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/server')>();
  return { ...actual, after: afterMock };
});

vi.mock('@/lib/googleConversionTracking', () => ({
  reportAcceptedSushiPreOrder: reportMock,
}));

import { NextRequest } from 'next/server';
import {
  createAnalyticsConsent,
  createGrantedAnalyticsConsent,
  ANALYTICS_CONSENT_COOKIE,
} from '@/lib/analyticsConsent';
import { POST } from './route';

const ORIGINAL_ENV = { ...process.env };
const NOW = new Date('2026-01-01T10:00:00.000Z');

function acceptedOrderBody(overrides: Record<string, unknown> = {}) {
  return {
    fullName: 'Jane Doe',
    phone: '07123456789',
    email: 'jane@example.com',
    pickupDateTime: '2026-01-03T13:00',
    specialRequests: '',
    variation: 'Mix',
    pieces: 30,
    price: 40,
    // A client value cannot authorize tracking; the signed cookie must.
    trackingConsent: false,
    ...overrides,
  };
}

function makeRequest(body: unknown, cookie?: string): NextRequest {
  return new NextRequest('http://localhost/api/sushi-order', {
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
  afterMock.mockReset();
  reportMock.mockReset().mockResolvedValue(undefined);
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  process.env.NEXT_PUBLIC_GOOGLE_TAG_ID = 'G-TEST123';
  process.env.GA4_MEASUREMENT_PROTOCOL_API_SECRET = 'test-api-secret';
  delete process.env.RESEND_API_KEY;
});

afterEach(() => {
  vi.useRealTimers();
  process.env = { ...ORIGINAL_ENV };
});

describe('POST /api/sushi-order conversion trigger', () => {
  it('schedules one server-side conversion only after accepting an order with a signed consent grant', async () => {
    const consent = createGrantedAnalyticsConsent('test-api-secret', NOW.getTime());
    const response = await POST(
      makeRequest(
        acceptedOrderBody(),
        `_ga=GA1.1.123456789.987654321; ${ANALYTICS_CONSENT_COOKIE}=${consent}`
      )
    );

    expect(response.status).toBe(200);
    expect(afterMock).toHaveBeenCalledTimes(1);

    const task = afterMock.mock.calls[0]?.[0];
    expect(task).toEqual(expect.any(Function));
    await task();

    expect(reportMock).toHaveBeenCalledWith({
      config: { measurementId: 'G-TEST123', apiSecret: 'test-api-secret' },
      clientId: '123456789.987654321',
      pieces: 30,
      orderReference: expect.stringMatching(/^sushi-order-/),
    });
  });

  it('does not trust a caller-supplied consent field when its cookie is forged', async () => {
    const response = await POST(
      makeRequest(
        acceptedOrderBody({ trackingConsent: true }),
        `_ga=GA1.1.123456789.987654321; ${ANALYTICS_CONSENT_COOKIE}=forged`
      )
    );

    expect(response.status).toBe(200);
    expect(afterMock).not.toHaveBeenCalled();
  });

  it('does not schedule reporting for a valid signed denial', async () => {
    const consent = createAnalyticsConsent('denied', 'test-api-secret', NOW.getTime());

    const response = await POST(
      makeRequest(
        acceptedOrderBody(),
        `_ga=GA1.1.123456789.987654321; ${ANALYTICS_CONSENT_COOKIE}=${consent}`
      )
    );

    expect(response.status).toBe(200);
    expect(afterMock).not.toHaveBeenCalled();
  });

  it('does not schedule reporting when the tracking configuration is absent', async () => {
    const consent = createGrantedAnalyticsConsent('test-api-secret', NOW.getTime());
    delete process.env.NEXT_PUBLIC_GOOGLE_TAG_ID;

    const response = await POST(
      makeRequest(
        acceptedOrderBody(),
        `_ga=GA1.1.123456789.987654321; ${ANALYTICS_CONSENT_COOKIE}=${consent}`
      )
    );

    expect(response.status).toBe(200);
    expect(afterMock).not.toHaveBeenCalled();
  });

  it('does not schedule reporting without a consent-created GA client ID', async () => {
    const consent = createGrantedAnalyticsConsent('test-api-secret', NOW.getTime());

    const response = await POST(
      makeRequest(acceptedOrderBody(), `${ANALYTICS_CONSENT_COOKIE}=${consent}`)
    );

    expect(response.status).toBe(200);
    expect(afterMock).not.toHaveBeenCalled();
  });

  it('never schedules a conversion for an order the server rejects', async () => {
    const consent = createGrantedAnalyticsConsent('test-api-secret', NOW.getTime());

    const response = await POST(
      makeRequest(
        acceptedOrderBody({ price: 1 }),
        `_ga=GA1.1.123456789.987654321; ${ANALYTICS_CONSENT_COOKIE}=${consent}`
      )
    );

    expect(response.status).toBe(400);
    expect(afterMock).not.toHaveBeenCalled();
  });

  it('keeps an accepted order successful if post-response scheduling is unavailable', async () => {
    const consent = createGrantedAnalyticsConsent('test-api-secret', NOW.getTime());
    afterMock.mockImplementation(() => {
      throw new Error('after unavailable');
    });
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const response = await POST(
      makeRequest(
        acceptedOrderBody(),
        `_ga=GA1.1.123456789.987654321; ${ANALYTICS_CONSENT_COOKIE}=${consent}`
      )
    );

    expect(response.status).toBe(200);
  });
});
