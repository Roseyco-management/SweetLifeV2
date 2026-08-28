/**
 * A1 is a human gate: Mum/founder must confirm the true opening hours,
 * primary phone number, and official social handles before any of them can be
 * published again. This test exercises rendered/served surfaces instead of a
 * snapshot, so a future edit cannot silently make one surface disagree with
 * another.
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import StructuredData from '@/components/seo/StructuredData';
import Footer from '@/components/layout/Footer';
import { GET as getLlmsTxt } from '@/app/llms.txt/route';
import { GET as getLlmsFullTxt } from '@/app/llms-full.txt/route';

const A1_PLACEHOLDER = 'PLACEHOLDER — BLOCKED ON A1';

function restaurantSchema(): Record<string, unknown> {
  const html = renderToStaticMarkup(createElement(StructuredData));
  const match = html.match(/<script[^>]*>(.*)<\/script>/);

  if (!match) {
    throw new Error('Restaurant JSON-LD script was not rendered');
  }

  return JSON.parse(match[1]);
}

function factLine(text: string, label: string): string | undefined {
  return text.split('\n').find((line) => line.startsWith(`- ${label}: `))?.slice(label.length + 4);
}

describe('A1-gated business facts', () => {
  it('keeps JSON-LD, llms files, and the footer safe and consistent while A1 is unresolved', async () => {
    const schema = restaurantSchema();
    const llmsTxt = await (await getLlmsTxt()).text();
    const llmsFullTxt = await (await getLlmsFullTxt()).text();
    const footer = renderToStaticMarkup(createElement(Footer));

    // RED on the existing site: it currently publishes mutually conflicting
    // phone numbers and opening hours. Unknown facts must be omitted from
    // schema rather than represented by a made-up value.
    expect(schema.telephone).toBeUndefined();
    expect(schema.openingHoursSpecification).toBeUndefined();
    expect(schema.sameAs).toBeUndefined();

    const facts = await import('./businessFacts');
    const { A1_OBSERVED_CONFLICTS } = await import('./businessFacts.fixture');

    // The source model is the single relationship that makes it impossible to
    // publish a schema phone/hours value that differs from either llms file.
    expect(schema.telephone ?? null).toBe(facts.A1_AUTHORITATIVE_FACTS.telephone);
    expect(schema.openingHoursSpecification ?? null).toEqual(
      facts.A1_AUTHORITATIVE_FACTS.openingHoursSpecification
    );
    expect(schema.sameAs ?? null).toEqual(facts.A1_AUTHORITATIVE_FACTS.sameAs);
    expect(facts.PUBLIC_BUSINESS_FACTS.schema).toEqual(
      facts.restaurantSchemaFactsFrom(facts.A1_AUTHORITATIVE_FACTS)
    );
    expect(facts.PUBLIC_BUSINESS_FACTS.llms.phone).toBe(
      facts.formatPhoneForPublication(facts.A1_AUTHORITATIVE_FACTS.telephone)
    );
    expect(facts.PUBLIC_BUSINESS_FACTS.llms.hours).toBe(
      facts.formatHoursForPublication(facts.A1_AUTHORITATIVE_FACTS.openingHoursSpecification)
    );

    expect(factLine(llmsTxt, 'Phone')).toBe(facts.PUBLIC_BUSINESS_FACTS.llms.phone);
    expect(factLine(llmsFullTxt, 'Phone')).toBe(facts.PUBLIC_BUSINESS_FACTS.llms.phone);
    expect(factLine(llmsTxt, 'Hours')).toBe(facts.PUBLIC_BUSINESS_FACTS.llms.hours);
    expect(factLine(llmsFullTxt, 'Hours')).toBe(facts.PUBLIC_BUSINESS_FACTS.llms.hours);
    expect(factLine(llmsTxt, 'Official social profiles')).toBe(facts.PUBLIC_BUSINESS_FACTS.llms.socialProfiles);
    expect(factLine(llmsFullTxt, 'Official social profiles')).toBe(facts.PUBLIC_BUSINESS_FACTS.llms.socialProfiles);
    expect(footer).toContain(facts.PUBLIC_BUSINESS_FACTS.footer.phone);
    expect(footer).toContain(facts.PUBLIC_BUSINESS_FACTS.footer.hours);
    expect(footer).toContain(facts.PUBLIC_BUSINESS_FACTS.footer.socialProfiles);

    expect(facts.PUBLIC_BUSINESS_FACTS.llms.phone).toContain(A1_PLACEHOLDER);
    expect(facts.PUBLIC_BUSINESS_FACTS.llms.hours).toContain(A1_PLACEHOLDER);
    expect(facts.PUBLIC_BUSINESS_FACTS.llms.socialProfiles).toContain(A1_PLACEHOLDER);
    expect(facts.PUBLIC_BUSINESS_FACTS.schema).toEqual({});

    // These are evidence for the human A1 decision only. They must never be
    // treated as canonical facts or rendered by the application.
    const observedPublicValues = [
      A1_OBSERVED_CONFLICTS.restaurantJsonLd.telephone,
      ...A1_OBSERVED_CONFLICTS.restaurantJsonLd.sameAs,
      A1_OBSERVED_CONFLICTS.llmsTxt.telephone,
      A1_OBSERVED_CONFLICTS.llmsTxt.hours,
      A1_OBSERVED_CONFLICTS.llmsTxt.instagram,
      A1_OBSERVED_CONFLICTS.llmsFullTxt.hours,
      A1_OBSERVED_CONFLICTS.footer.telephone,
      A1_OBSERVED_CONFLICTS.footer.hours,
      A1_OBSERVED_CONFLICTS.footer.facebook,
      A1_OBSERVED_CONFLICTS.footer.instagram,
      A1_OBSERVED_CONFLICTS.footer.tiktok,
    ];

    for (const value of observedPublicValues) {
      expect(JSON.stringify(schema)).not.toContain(value);
      expect(llmsTxt).not.toContain(value);
      expect(llmsFullTxt).not.toContain(value);
      expect(footer).not.toContain(value);
    }

    expect(A1_OBSERVED_CONFLICTS).toMatchObject({
      restaurantJsonLd: {
        telephone: '+44 28 3044 8808',
        sunday: { opens: '12:00', closes: '17:00' },
      },
      llmsTxt: {
        telephone: '+44 7716 508513',
        hours: 'Mon-Wed 08:00-18:00, Thu-Fri 08:00-20:00, Sat 09:00-18:00, Sunday closed',
      },
      footer: {
        telephone: '+447716508513',
        tiktok: 'https://www.tiktok.com/@sweetlifeireland',
      },
    });
  });
});
