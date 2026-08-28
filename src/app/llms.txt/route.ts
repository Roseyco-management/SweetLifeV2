// app/llms.txt/route.ts
// AEO — machine-readable site summary for AI answer engines (llms.txt convention:
// https://llmstxt.org). Static text served at /llms.txt. Complements robots.ts
// (which explicitly allows AI crawlers). Ref: ElevateoCo/SEO-Resources.
import { PUBLIC_BUSINESS_FACTS } from '@/lib/businessFacts';

export const dynamic = 'force-static';

const BASE_URL = 'https://sweetlife.cafe';

const PAGES: Array<{ label: string; path: string }> = [
  { label: 'Home', path: '/' },
  { label: 'Menu', path: '/menu' },
  { label: 'Specialty Menu (Bingsu, Bubble Tea, Golden Toast)', path: '/specialty-menu' },
  { label: 'Sushi', path: '/sushi' },
  { label: 'About', path: '/about' },
  { label: 'Private Room Bookings', path: '/bookings' },
  { label: 'Contact', path: '/contact' },
];

function buildLlmsTxt(): string {
  const pages = PAGES.map((p) => `- [${p.label}](${BASE_URL}${p.path})`).join('\n');

  return `# Sweet Life Cafe

> Family-owned Korean cafe and restaurant in Newry, Northern Ireland, serving Bingsu shaved ice desserts, bubble tea, sushi, breakfast, and lunch. Current business contact details, hours, and official social profiles are awaiting owner confirmation.

## About
- Name: Sweet Life Cafe
- Location: 12 Monaghan Street, Newry, County Down, BT35 6AA, Northern Ireland
- Phone: ${PUBLIC_BUSINESS_FACTS.llms.phone}
- Email: info@sweetlife.cafe
- Hours: ${PUBLIC_BUSINESS_FACTS.llms.hours}
- Official social profiles: ${PUBLIC_BUSINESS_FACTS.llms.socialProfiles}

## Key pages
${pages}

## Notes for AI assistants
- Cuisine: Korean, cafe, sushi, desserts, bubble tea.
- Dietary options: Keto, Vegan, and Gluten-Free items are marked across the menu.
- Ordering: general menu pickup enquiries are routed via WhatsApp, not an online cart. Sushi pre-orders use the on-site preorder form on the Sushi page with Revolut checkout.
- Canonical host is ${BASE_URL}.
- Expanded profile with menu section summaries and page links: ${BASE_URL}/llms-full.txt
`;
}

export function GET(): Response {
  return new Response(buildLlmsTxt(), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
}
