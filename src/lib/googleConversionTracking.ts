import { getSizeByPieces } from '@/data/sushiData';
import type { GoogleConversionConfiguration } from '@/lib/googleConversionConfig';

const MEASUREMENT_PROTOCOL_URL = 'https://region1.google-analytics.com/mp/collect';
const TRACKING_TIMEOUT_MS = 2_000;
const GOOGLE_ANALYTICS_CLIENT_ID_PATTERN = /^\d+\.\d+$/;

function isGoogleAnalyticsClientId(value: string | null): value is string {
  return typeof value === 'string' && GOOGLE_ANALYTICS_CLIENT_ID_PATTERN.test(value);
}

/**
 * Best-effort reporting for an order the server has already accepted. This
 * function receives only a GA client ID, canonical order data, and a random
 * server reference; it never receives customer contact details.
 */
export async function reportAcceptedSushiPreOrder({
  config,
  clientId,
  pieces,
  orderReference,
}: {
  config: GoogleConversionConfiguration | null;
  clientId: string | null;
  pieces: number;
  orderReference: string;
}): Promise<void> {
  const size = getSizeByPieces(pieces);
  if (!config || !size || !isGoogleAnalyticsClientId(clientId)) {
    return;
  }

  const params = new URLSearchParams({
    measurement_id: config.measurementId,
    api_secret: config.apiSecret,
  });

  try {
    const response = await fetch(`${MEASUREMENT_PROTOCOL_URL}?${params.toString()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(TRACKING_TIMEOUT_MS),
      body: JSON.stringify({
        client_id: clientId,
        events: [
          {
            name: 'sushi_preorder_completed',
            params: {
              currency: 'GBP',
              value: size.price,
              order_reference: orderReference,
            },
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error('[tracking] Google conversion reporting returned a non-success status.');
    }
  } catch {
    console.error('[tracking] Google conversion reporting failed.');
  }
}
