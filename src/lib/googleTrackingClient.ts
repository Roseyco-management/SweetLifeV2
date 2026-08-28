import type { TrackingConsentState } from '@/lib/consent';

interface SushiPreOrderCompletionInput {
  consent: TrackingConsentState;
  pieces: number;
}

/**
 * Sends no customer details or conversion reference. The first-party relay
 * accepts only an HttpOnly proof minted by the already-successful order API.
 * Tracking must never affect a successful order confirmation.
 */
export async function reportSushiPreOrderCompletion({
  consent,
  pieces,
}: SushiPreOrderCompletionInput): Promise<void> {
  if (consent !== 'granted' || !process.env.NEXT_PUBLIC_GOOGLE_TAG_ID) {
    return;
  }

  try {
    await fetch('/api/conversions/sushi-preorder', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pieces }),
    });
  } catch {
    // Tracking is optional and must never change the customer's order result.
  }
}
