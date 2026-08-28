import { createHmac, timingSafeEqual } from 'node:crypto';
import { getSizeByPieces } from '@/data/sushiData';
import { isGoogleAnalyticsClientId } from '@/lib/googleAnalyticsClientId';

export const SUSHI_CONVERSION_PROOF_COOKIE = 'sl_sushi_conversion';
export const SUSHI_CONVERSION_PROOF_MAX_AGE_SECONDS = 10 * 60;

const VERSION = 1;
const ORDER_REFERENCE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{7,127}$/;
const BASE64_URL_PATTERN = /^[A-Za-z0-9_-]+$/;

interface SushiConversionProofPayload {
  version: number;
  pieces: number;
  price: number;
  orderReference: string;
  clientIdDigest: string;
  issuedAt: number;
  expiresAt: number;
}

export interface SushiConversionProofClaims {
  pieces: number;
  price: number;
  orderReference: string;
  issuedAt: number;
  expiresAt: number;
}

function sign(encodedPayload: string, secret: string): string {
  return createHmac('sha256', secret)
    .update(`sweet-life:sushi-preorder:v${VERSION}.${encodedPayload}`)
    .digest('base64url');
}

function createClientIdDigest(clientId: string, secret: string): string {
  return createHmac('sha256', secret)
    .update(`sweet-life:sushi-preorder:v${VERSION}:client-id.${clientId}`)
    .digest('base64url');
}

function hasMatchingDigest(expected: string, received: string): boolean {
  const expectedBuffer = Buffer.from(expected, 'base64url');
  const receivedBuffer = Buffer.from(received, 'base64url');

  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}

function hasValidTimestamp(timestamp: number): boolean {
  return Number.isSafeInteger(timestamp) && timestamp > 0;
}

function isValidPayload(payload: unknown): payload is SushiConversionProofPayload {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return false;
  }

  const candidate = payload as Partial<SushiConversionProofPayload>;
  const size =
    typeof candidate.pieces === 'number' && Number.isInteger(candidate.pieces)
      ? getSizeByPieces(candidate.pieces)
      : undefined;

  return (
    candidate.version === VERSION &&
    Boolean(size) &&
    candidate.price === size?.price &&
    typeof candidate.orderReference === 'string' &&
    ORDER_REFERENCE_PATTERN.test(candidate.orderReference) &&
    typeof candidate.clientIdDigest === 'string' &&
    BASE64_URL_PATTERN.test(candidate.clientIdDigest) &&
    typeof candidate.issuedAt === 'number' &&
    hasValidTimestamp(candidate.issuedAt) &&
    typeof candidate.expiresAt === 'number' &&
    hasValidTimestamp(candidate.expiresAt) &&
    candidate.expiresAt - candidate.issuedAt === SUSHI_CONVERSION_PROOF_MAX_AGE_SECONDS * 1_000
  );
}

/**
 * Creates a server-only HMAC proof after the order route has independently
 * validated the canonical sushi size and price. It contains no customer data.
 */
export function createSushiConversionProof(
  input: { pieces: number; orderReference: string; clientId: string },
  secret: string,
  now = Date.now()
): string {
  const size = getSizeByPieces(input.pieces);
  const issuedAt = Math.floor(now);

  if (
    !size ||
    !ORDER_REFERENCE_PATTERN.test(input.orderReference) ||
    !isGoogleAnalyticsClientId(input.clientId) ||
    !secret ||
    !hasValidTimestamp(issuedAt)
  ) {
    throw new Error('Cannot create an invalid sushi conversion proof.');
  }

  const payload: SushiConversionProofPayload = {
    version: VERSION,
    pieces: size.pieces,
    price: size.price,
    orderReference: input.orderReference,
    clientIdDigest: createClientIdDigest(input.clientId, secret),
    issuedAt,
    expiresAt: issuedAt + SUSHI_CONVERSION_PROOF_MAX_AGE_SECONDS * 1_000,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');

  return `${encodedPayload}.${sign(encodedPayload, secret)}`;
}

/**
 * Validates the HMAC with timing-safe comparison and returns only the data
 * needed by the relay. Proofs are valid for ten minutes at most.
 */
export function verifySushiConversionProof(
  proof: string | undefined,
  secret: string,
  now = Date.now(),
  expectedClientId?: string
): SushiConversionProofClaims | null {
  const timestamp = Math.floor(now);
  if (
    !proof ||
    !secret ||
    proof.length > 1_024 ||
    !hasValidTimestamp(timestamp)
  ) {
    return null;
  }

  const [encodedPayload, receivedSignature, ...extraParts] = proof.split('.');
  if (
    extraParts.length > 0 ||
    !encodedPayload ||
    !receivedSignature ||
    !BASE64_URL_PATTERN.test(encodedPayload) ||
    !BASE64_URL_PATTERN.test(receivedSignature)
  ) {
    return null;
  }

  if (!hasMatchingDigest(sign(encodedPayload, secret), receivedSignature)) {
    return null;
  }

  let payload: unknown;
  try {
    payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }

  if (!isValidPayload(payload) || payload.issuedAt > timestamp || payload.expiresAt <= timestamp) {
    return null;
  }

  if (
    expectedClientId &&
    (!isGoogleAnalyticsClientId(expectedClientId) ||
      !hasMatchingDigest(createClientIdDigest(expectedClientId, secret), payload.clientIdDigest))
  ) {
    return null;
  }

  return {
    pieces: payload.pieces,
    price: payload.price,
    orderReference: payload.orderReference,
    issuedAt: payload.issuedAt,
    expiresAt: payload.expiresAt,
  };
}
