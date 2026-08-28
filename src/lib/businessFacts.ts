/**
 * DO NOT treat any value in businessFacts.fixture.ts as a business fact.
 *
 * Gate A1: Mum/founder must confirm the true opening hours, primary phone
 * number, and official Facebook, Instagram, and TikTok handles. Until then,
 * all public surfaces deliberately publish a clearly labelled placeholder
 * (or omit the property where a placeholder would be invalid schema).
 *
 * Once A1 is answered, replace only A1_AUTHORITATIVE_FACTS with that single
 * owner-approved answer. Every public surface below is derived from it.
 */

export const A1_GATE =
  'A1 — mum must confirm the true opening hours, primary phone number, and official Facebook, Instagram, and TikTok handles';

export const A1_BLOCKED_PLACEHOLDER = 'PLACEHOLDER — BLOCKED ON A1';

export type OpeningHoursSpecification = {
  readonly '@type': 'OpeningHoursSpecification';
  readonly dayOfWeek: string | readonly string[];
  readonly opens: string;
  readonly closes: string;
};

export type AuthoritativeBusinessFacts = {
  readonly telephone: string | null;
  readonly openingHoursSpecification: readonly OpeningHoursSpecification[] | null;
  readonly sameAs: readonly string[] | null;
};

/**
 * The only place an A1-approved phone, hours, and social handles may be set.
 * null is intentional: it is safer than publishing one of the conflicting
 * currently served values in businessFacts.fixture.ts if this branch is
 * accidentally deployed.
 */
export const A1_AUTHORITATIVE_FACTS: AuthoritativeBusinessFacts = {
  telephone: null,
  openingHoursSpecification: null,
  sameAs: null,
};

export type RestaurantSchemaBusinessFacts = {
  readonly telephone?: string;
  readonly openingHoursSpecification?: readonly OpeningHoursSpecification[];
  readonly sameAs?: readonly string[];
};

function blocked(field: string): string {
  return `${A1_BLOCKED_PLACEHOLDER}: ${field} is intentionally withheld until ${A1_GATE}.`;
}

export function formatPhoneForPublication(telephone: string | null): string {
  return telephone ?? blocked('The primary phone number');
}

export function formatHoursForPublication(
  openingHoursSpecification: readonly OpeningHoursSpecification[] | null
): string {
  if (!openingHoursSpecification?.length) {
    return blocked('Opening hours');
  }

  return openingHoursSpecification
    .map(({ dayOfWeek, opens, closes }) => {
      const days = Array.isArray(dayOfWeek) ? dayOfWeek.join('/') : dayOfWeek;
      return `${days} ${opens}-${closes}`;
    })
    .join(', ');
}

export function formatSocialProfilesForPublication(sameAs: readonly string[] | null): string {
  return sameAs?.length ? sameAs.join(', ') : blocked('Official social profiles');
}

export function restaurantSchemaFactsFrom(
  facts: AuthoritativeBusinessFacts
): RestaurantSchemaBusinessFacts {
  return {
    ...(facts.telephone ? { telephone: facts.telephone } : {}),
    ...(facts.openingHoursSpecification?.length
      ? { openingHoursSpecification: facts.openingHoursSpecification }
      : {}),
    ...(facts.sameAs?.length ? { sameAs: facts.sameAs } : {}),
  };
}

const schema = restaurantSchemaFactsFrom(A1_AUTHORITATIVE_FACTS);
const phone = formatPhoneForPublication(A1_AUTHORITATIVE_FACTS.telephone);
const hours = formatHoursForPublication(A1_AUTHORITATIVE_FACTS.openingHoursSpecification);
const socialProfiles = formatSocialProfilesForPublication(A1_AUTHORITATIVE_FACTS.sameAs);

/**
 * Single facts-everywhere publication model used by JSON-LD, llms.txt,
 * llms-full.txt, and the footer. No public code should read the observed
 * conflict fixture in businessFacts.fixture.ts.
 */
export const PUBLIC_BUSINESS_FACTS = {
  status: A1_BLOCKED_PLACEHOLDER,
  gate: A1_GATE,
  schema,
  llms: {
    phone,
    hours,
    socialProfiles,
  },
  footer: {
    phone: `Phone: ${phone}`,
    hours: `Opening hours: ${hours}`,
    socialProfiles: `Official social profiles: ${socialProfiles}`,
  },
} as const;
