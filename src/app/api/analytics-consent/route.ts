import { NextRequest, NextResponse } from 'next/server';
import {
  ANALYTICS_CONSENT_COOKIE,
  ANALYTICS_CONSENT_MAX_AGE_SECONDS,
  createGrantedAnalyticsConsent,
  verifyGrantedAnalyticsConsent,
} from '@/lib/analyticsConsent';
import { getGoogleConversionConfiguration } from '@/lib/googleConversionConfig';

function noStoreHeaders(): HeadersInit {
  return { 'Cache-Control': 'no-store' };
}

function isSameOriginBrowserRequest(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  if (!origin) {
    return false;
  }

  try {
    return new URL(origin).origin === request.nextUrl.origin;
  } catch {
    return false;
  }
}

function setConsentCookie(response: NextResponse, value: string, maxAge: number): NextResponse {
  response.cookies.set(ANALYTICS_CONSENT_COOKIE, value, {
    httpOnly: true,
    maxAge,
    path: '/',
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
  });
  return response;
}

function isConsentAction(body: unknown): body is { action: 'grant' | 'revoke' } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return false;
  }

  const candidate = body as { action?: unknown };
  return candidate.action === 'grant' || candidate.action === 'revoke';
}

export async function GET(request: NextRequest) {
  const config = getGoogleConversionConfiguration();
  if (!config) {
    return new NextResponse(null, { status: 204, headers: noStoreHeaders() });
  }

  const consent = verifyGrantedAnalyticsConsent(
    request.cookies.get(ANALYTICS_CONSENT_COOKIE)?.value,
    config.apiSecret
  );

  return NextResponse.json(
    { state: consent ? 'granted' : 'unknown' },
    { headers: noStoreHeaders() }
  );
}

export async function POST(request: NextRequest) {
  const config = getGoogleConversionConfiguration();
  if (!config) {
    return new NextResponse(null, { status: 204, headers: noStoreHeaders() });
  }

  if (!isSameOriginBrowserRequest(request)) {
    return NextResponse.json(
      { error: 'Invalid consent origin.' },
      { status: 403, headers: noStoreHeaders() }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid consent request.' },
      { status: 400, headers: noStoreHeaders() }
    );
  }

  if (!isConsentAction(body)) {
    return NextResponse.json(
      { error: 'Invalid consent request.' },
      { status: 400, headers: noStoreHeaders() }
    );
  }

  if (body.action === 'revoke') {
    return setConsentCookie(
      NextResponse.json({ state: 'unknown' }, { headers: noStoreHeaders() }),
      '',
      0
    );
  }

  return setConsentCookie(
    NextResponse.json({ state: 'granted' }, { headers: noStoreHeaders() }),
    createGrantedAnalyticsConsent(config.apiSecret),
    ANALYTICS_CONSENT_MAX_AGE_SECONDS
  );
}
