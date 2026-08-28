import { NextRequest, NextResponse } from 'next/server';
import { getSizeByPieces } from '@/data/sushiData';
import { getGoogleAnalyticsClientId } from '@/lib/googleAnalyticsClientId';
import { getGoogleTrackingConfiguration } from '@/lib/googleTrackingServer';
import {
  SUSHI_CONVERSION_PROOF_COOKIE,
  verifySushiConversionProof,
} from '@/lib/sushiConversionProof';

const MEASUREMENT_PROTOCOL_URL = 'https://region1.google-analytics.com/mp/collect';
const CONVERSION_PROOF_PATH = '/api/conversions/sushi-preorder';

function isConversionRequest(body: unknown): body is { pieces: number } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return false;
  }

  const candidate = body as { pieces?: unknown };
  return typeof candidate.pieces === 'number' && Number.isInteger(candidate.pieces);
}

function responseWithProofCleared(status: number, body?: { error: string }): NextResponse {
  const response = body
    ? NextResponse.json(body, { status })
    : new NextResponse(null, { status });

  response.cookies.set(SUSHI_CONVERSION_PROOF_COOKIE, '', {
    httpOnly: true,
    maxAge: 0,
    path: CONVERSION_PROOF_PATH,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
  });

  return response;
}

/**
 * Relays a proof of an accepted sushi pre-order to GA4 Measurement Protocol.
 * Both tracking settings are absent by default, making the route a complete
 * 204 no-op until a future account configuration deliberately enables it.
 */
export async function POST(request: NextRequest) {
  const config = getGoogleTrackingConfiguration();
  if (!config) {
    return new NextResponse(null, { status: 204 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return responseWithProofCleared(400, { error: 'Invalid conversion payload.' });
  }

  if (!isConversionRequest(body)) {
    return responseWithProofCleared(400, { error: 'Invalid conversion payload.' });
  }

  const size = getSizeByPieces(body.pieces);
  const clientId = getGoogleAnalyticsClientId(request.cookies.get('_ga')?.value);
  if (!clientId) {
    return responseWithProofCleared(204);
  }

  const proof = verifySushiConversionProof(
    request.cookies.get(SUSHI_CONVERSION_PROOF_COOKIE)?.value,
    config.apiSecret,
    Date.now(),
    clientId
  );
  if (!size || !proof || proof.pieces !== size.pieces || proof.price !== size.price) {
    return responseWithProofCleared(400, { error: 'Invalid conversion proof.' });
  }

  // The tag creates _ga only after the visitor grants consent. The HMAC proof
  // is additionally bound to that identifier, so an arbitrary or stale _ga
  // value cannot be substituted at relay time.

  const params = new URLSearchParams({
    measurement_id: config.measurementId,
    api_secret: config.apiSecret,
  });

  try {
    const response = await fetch(`${MEASUREMENT_PROTOCOL_URL}?${params.toString()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        events: [
          {
            name: 'sushi_preorder_completed',
            params: {
              currency: 'GBP',
              value: proof.price,
              order_reference: proof.orderReference,
            },
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error('[tracking] Google conversion relay returned a non-success status.');
    }
  } catch {
    console.error('[tracking] Google conversion relay failed.');
  }

  return responseWithProofCleared(204);
}
