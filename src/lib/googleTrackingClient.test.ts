import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { reportSushiPreOrderCompletion } from './googleTrackingClient';

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  vi.restoreAllMocks();
  delete process.env.NEXT_PUBLIC_GOOGLE_TAG_ID;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe('reportSushiPreOrderCompletion', () => {
  it('does nothing while tracking is dark or consent is not granted', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch');

    await reportSushiPreOrderCompletion({
      consent: 'granted',
      pieces: 30,
    });

    process.env.NEXT_PUBLIC_GOOGLE_TAG_ID = 'G-TEST123';
    await reportSushiPreOrderCompletion({
      consent: 'denied',
      pieces: 30,
    });

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('posts the completed pre-order to the first-party relay after consent', async () => {
    process.env.NEXT_PUBLIC_GOOGLE_TAG_ID = 'G-TEST123';
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(null, { status: 204 })
    );

    await reportSushiPreOrderCompletion({
      consent: 'granted',
      pieces: 30,
    });

    expect(fetchSpy).toHaveBeenCalledWith('/api/conversions/sushi-preorder', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pieces: 30,
      }),
    });
  });
});
