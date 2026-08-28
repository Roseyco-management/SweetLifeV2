import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(
  resolve(process.cwd(), 'src/components/sushi/SushiOrderForm.tsx'),
  'utf8'
);

describe('SushiOrderForm conversion seam', () => {
  it('reports a conversion only from the accepted pre-order success path', () => {
    const successPath = source.indexOf('if (response.ok && result.success)');
    const trackingCall = source.indexOf('reportSushiPreOrderCompletion(', successPath);

    expect(successPath).toBeGreaterThan(-1);
    expect(trackingCall).toBeGreaterThan(successPath);
  });

  it('asks the order API to mint a proof only for an explicit consent grant', () => {
    const orderRequest = source.indexOf("fetch('/api/sushi-order'");
    const consentDeclaration = source.indexOf(
      "trackingConsent: trackingConsent === 'granted'",
      orderRequest
    );

    expect(orderRequest).toBeGreaterThan(-1);
    expect(consentDeclaration).toBeGreaterThan(orderRequest);
  });
});
