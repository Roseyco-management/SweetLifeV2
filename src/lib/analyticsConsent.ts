import { createHmac, timingSafeEqual } from 'node:crypto';

export const ANALYTICS_CONSENT_COOKIE = 'sl_analytics_consent';
export const ANALYTICS_CONSENT_MAX_AGE_SECONDS = 180 * 24 * 60 * 60;

const VERSION = 1;
const BASE64_URL_PATTERN = /^[A-Za-z0-9_-]+$/;

interface AnalyticsConsentPayload {
  version: number;
  state: 'granted';
  issuedAt: number;
  expiresAt: number;
}

export interface VerifiedAnalyticsConsent {
  state: 'granted';
  issuedAt: number;
  expiresAt: number;
}

function sign(encodedPayload: string, secret: string): string {
  return createHmac('sha256', secret)
    .update(`sweet-life:analytics-consent:v${VERSION}.${encodedPayload}`)
    .digest('base64url');
}

function hasMatchingSignature(expected: string, received: string): boolean {
  const expectedBuffer = Buffer.from(expected, 'base64url');
  const receivedBuffer = Buffer.from(received, 'base64url');

  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}

function isValidTimestamp(timestamp: number): boolean {
  return Number.isSafeInteger(timestamp) && timestamp > 0;
}

function isValidPayload(payload: unknown): payload is AnalyticsConsentPayload {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return false;
  }

  const candidate = payload as Partial<AnalyticsConsentPayload>;
  return (
    candidate.version === VERSION &&
    candidate.state === 'granted' &&
    typeof candidate.issuedAt === 'number' &&
    isValidTimestamp(candidate.issuedAt) &&
    typeof candidate.expiresAt === 'number' &&
    isValidTimestamp(candidate.expiresAt) &&
    candidate.expiresAt - candidate.issuedAt === ANALYTICS_CONSENT_MAX_AGE_SECONDS * 1_000
  );
}

export function createGrantedAnalyticsConsent(secret: string, now = Date.now()): string {
  const issuedAt = Math.floor(now);
  if (!secret || !isValidTimestamp(issuedAt)) {
    throw new Error('Cannot create an invalid analytics consent token.');
  }

  const payload: AnalyticsConsentPayload = {
    version: VERSION,
    state: 'granted',
    issuedAt,
    expiresAt: issuedAt + ANALYTICS_CONSENT_MAX_AGE_SECONDS * 1_000,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');

  return `${encodedPayload}.${sign(encodedPayload, secret)}`;
}

export function verifyGrantedAnalyticsConsent(
  token: string | undefined,
  secret: string,
  now = Date.now()
): VerifiedAnalyticsConsent | null {
  const timestamp = Math.floor(now);
  if (!token || !secret || token.length > 1_024 || !isValidTimestamp(timestamp)) {
    return null;
  }

  const [encodedPayload, receivedSignature, ...extraParts] = token.split('.');
  if (
    extraParts.length > 0 ||
    !encodedPayload ||
    !receivedSignature ||
    !BASE64_URL_PATTERN.test(encodedPayload) ||
    !BASE64_URL_PATTERN.test(receivedSignature) ||
    !hasMatchingSignature(sign(encodedPayload, secret), receivedSignature)
  ) {
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

  return {
    state: 'granted',
    issuedAt: payload.issuedAt,
    expiresAt: payload.expiresAt,
  };
}
