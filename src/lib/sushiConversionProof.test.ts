import { describe, expect, it } from 'vitest';
import {
  createSushiConversionProof,
  SUSHI_CONVERSION_PROOF_MAX_AGE_SECONDS,
  verifySushiConversionProof,
} from './sushiConversionProof';

describe('sushi conversion proof', () => {
  it('binds a proof to the canonical accepted order value', () => {
    const now = 1_700_000_000_000;
    const proof = createSushiConversionProof(
      {
        pieces: 30,
        orderReference: 'sushi-preorder-12345678',
        clientId: '123456789.987654321',
      },
      'server-only-secret',
      now
    );

    expect(verifySushiConversionProof(proof, 'server-only-secret', now)).toEqual({
      pieces: 30,
      price: 40,
      orderReference: 'sushi-preorder-12345678',
      issuedAt: now,
      expiresAt: now + SUSHI_CONVERSION_PROOF_MAX_AGE_SECONDS * 1_000,
    });
  });

  it('rejects tampered and expired proofs', () => {
    const now = 1_700_000_000_000;
    const proof = createSushiConversionProof(
      {
        pieces: 30,
        orderReference: 'sushi-preorder-12345678',
        clientId: '123456789.987654321',
      },
      'server-only-secret',
      now
    );

    expect(
      verifySushiConversionProof(
        `${proof.slice(0, -1)}${proof.endsWith('a') ? 'b' : 'a'}`,
        'server-only-secret',
        now
      )
    ).toBeNull();
    expect(
      verifySushiConversionProof(
        proof,
        'server-only-secret',
        now + SUSHI_CONVERSION_PROOF_MAX_AGE_SECONDS * 1_000
      )
    ).toBeNull();
    expect(
      verifySushiConversionProof(
        proof,
        'server-only-secret',
        now,
        '111111111.222222222'
      )
    ).toBeNull();
  });
});
