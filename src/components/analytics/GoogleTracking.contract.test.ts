import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function sourceAt(relativePath: string): string {
  try {
    return readFileSync(resolve(process.cwd(), relativePath), 'utf8');
  } catch {
    return '';
  }
}

describe('Google tracking consent contract', () => {
  it('defaults every Consent Mode v2 setting to denied before a tag can load', () => {
    const defaults = sourceAt('src/components/analytics/ConsentDefaultsScript.tsx');
    const loader = sourceAt('src/components/analytics/GoogleTagLoader.tsx');

    expect(defaults).toContain("ad_storage: 'denied'");
    expect(defaults).toContain("analytics_storage: 'denied'");
    expect(defaults).toContain("ad_user_data: 'denied'");
    expect(defaults).toContain("ad_personalization: 'denied'");
    expect(loader.indexOf("if (state !== 'granted') return;")).toBeGreaterThan(-1);
    expect(loader.indexOf('www.googletagmanager.com')).toBeGreaterThan(
      loader.indexOf("if (state !== 'granted') return;")
    );
  });

  it('uses the first-party signed consent endpoint and offers a persistent revoke control', () => {
    const provider = sourceAt('src/components/analytics/ConsentProvider.tsx');
    const banner = sourceAt('src/components/analytics/CookieBanner.tsx');

    expect(provider).toContain("'/api/analytics-consent'");
    expect(provider).toContain("credentials: 'same-origin'");
    expect(banner).toContain('Cookie preferences');
    expect(banner).toContain('Revoke analytics cookies');
  });

  it('keeps the browser out of the conversion event path', () => {
    const form = sourceAt('src/components/sushi/SushiOrderForm.tsx');

    expect(form).not.toContain('/api/conversions');
    expect(form).not.toContain('reportAcceptedSushiPreOrder');
    expect(form).not.toContain('trackingConsent:');
  });

  it('does not retain the browser-callable conversion relay endpoint', () => {
    expect(sourceAt('src/app/api/conversions/sushi-preorder/route.ts')).toBe('');
  });
});
