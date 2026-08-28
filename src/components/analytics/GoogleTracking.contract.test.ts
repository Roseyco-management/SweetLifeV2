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
  it('sets all Consent Mode v2 defaults before a tag can be loaded', () => {
    const defaults = sourceAt('src/components/analytics/ConsentDefaultsScript.tsx');
    const loader = sourceAt('src/components/analytics/GoogleTagLoader.tsx');

    expect(defaults).toContain("ad_storage: 'denied'");
    expect(defaults).toContain("analytics_storage: 'denied'");
    expect(defaults).toContain("ad_user_data: 'denied'");
    expect(defaults).toContain("ad_personalization: 'denied'");

    const consentGate = loader.indexOf("if (state !== 'granted') return;");
    const vendorUrl = loader.indexOf('www.googletagmanager.com');
    expect(consentGate).toBeGreaterThan(-1);
    expect(vendorUrl).toBeGreaterThan(consentGate);
  });
});
