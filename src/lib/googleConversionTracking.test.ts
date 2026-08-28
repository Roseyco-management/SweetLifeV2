import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { reportAcceptedSushiPreOrder } from './googleConversionTracking';

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('accepted sushi pre-order conversion reporting', () => {
  it('does nothing when the full tracking configuration is absent', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch');

    await reportAcceptedSushiPreOrder({
      config: null,
      clientId: '123456789.987654321',
      pieces: 30,
      orderReference: 'sushi-order-12345678',
    });

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('does nothing without a consent-created GA client ID', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch');

    await reportAcceptedSushiPreOrder({
      config: { measurementId: 'G-TEST123', apiSecret: 'test-api-secret' },
      clientId: null,
      pieces: 30,
      orderReference: 'sushi-order-12345678',
    });

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('sends only canonical non-PII data for an accepted order', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(null, { status: 204 })
    );

    await reportAcceptedSushiPreOrder({
      config: { measurementId: 'G-TEST123', apiSecret: 'test-api-secret' },
      clientId: '123456789.987654321',
      pieces: 30,
      orderReference: 'sushi-order-12345678',
    });

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
            order_reference: 'sushi-order-12345678',
          },
        },
      ],
    });
  });

  it('swallows bounded delivery failures so tracking cannot affect the order', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('network unavailable'));

    await expect(
      reportAcceptedSushiPreOrder({
        config: { measurementId: 'G-TEST123', apiSecret: 'test-api-secret' },
        clientId: '123456789.987654321',
        pieces: 30,
        orderReference: 'sushi-order-12345678',
      })
    ).resolves.toBeUndefined();
  });
});
